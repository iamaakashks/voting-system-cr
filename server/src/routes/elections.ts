import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election, { IElection } from '../models/Election';
import { findStudentModelById } from '../utils/getStudentModel';
import Student, { IStudent } from '../models/Student';
import Ticket from '../models/Ticket';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';
import { sendNewElectionNotification, sendWinnerNotification } from '../utils/emailService';
import { enrichCandidatesWithProfilePictures } from '../utils/electionUtils';
import { ITeacher } from '../models/Teacher';
import { io } from '../index';

const router = express.Router();



// ... (rest of the imports)

// @route   POST api/elections
// @desc    Create a new election
// @access  Private (Teacher)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { title, description, branch, section, admissionYear, startTime, endTime, candidates } = req.body;

  try {
    const now = new Date();
    const parsedStartTime = new Date(startTime);
    
    const initialStatus = parsedStartTime <= now ? 'Ongoing' : 'Pending';

    const newElection = new Election({
      title,
      description: description || '',
      branch,
      section,
      admissionYear,
      startTime: parsedStartTime,
      endTime,
      createdBy: req.user.id,
      status: initialStatus,
      candidates: candidates.map((c: any) => ({
        student: c.id,
        name: c.name,
        usn: c.usn
      }))
    });
    await newElection.save();
    
    // Broadcast election creation to all clients in real-time
    io.emit('election:created', {
      election: {
        id: (newElection._id as any).toString(),
        title: newElection.title,
        description: newElection.description,
        startTime: newElection.startTime,
        endTime: newElection.endTime,
        branch: newElection.branch,
        section: newElection.section,
        status: newElection.status,
        admissionYear: newElection.admissionYear
      }
    });
    console.log(`✓ Election created and broadcasted: ${newElection.title}`);
    
    if (candidates && candidates.length > 0) {
      const students = await Student.find({ branch, section, admissionYear });
      const studentEmails = students.map(student => student.email);

      if (studentEmails.length > 0) {
        try {
          await sendNewElectionNotification(studentEmails, title, new Date(startTime), new Date(endTime));
        } catch (emailError) {
          console.error('Failed to send new election notification emails:', emailError);
        }
      }
    }
    
    res.status(201).json(newElection);

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/student
// @desc    Get all elections for the logged-in student
// @access  Private (Student)
router.get('/student', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  try {
    const studentId = new mongoose.Types.ObjectId(req.user.id);

    const studentResult = await findStudentModelById(req.user.id);
    if (!studentResult) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const student = studentResult.student;

    const elections = await Election.aggregate([
      { $match: { branch: student.branch, section: student.section } },
      { $sort: { startTime: -1 } },
      { $lookup: { from: 'tickets', let: { electionId: '$_id' }, pipeline: [ { $match: { $expr: { $and: [ { $eq: ['$election', '$$electionId'] }, { $eq: ['$student', studentId] }, ], }, }, }, ], as: 'ticket', }, },
      { $unwind: { path: '$ticket', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teachers', localField: 'createdBy', foreignField: '_id', as: 'createdBy', }, },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, title: 1, description: 1, branch: 1, section: 1, startTime: 1, endTime: 1, candidates: 1, notaVotes: 1, createdBy: { name: '$createdBy.name' }, userVoted: { $ifNull: ['$ticket.used', false] }, userTicket: { $cond: { if: { $and: [ '$ticket', { $eq: ['$ticket.used', false] }, { $lt: [new Date(), '$endTime'] }, { $gt: [new Date(), '$startTime'] }, ], }, then: '$ticket.ticketString', else: '$$REMOVE', }, }, }, },
    ]);

    const electionsWithDetails = await Promise.all(
      elections.map(async (election) => {
        const remappedCandidates = await enrichCandidatesWithProfilePictures(election.candidates);

        const results = election.candidates.reduce((acc: any, c: any) => {
          acc[c.student.toString()] = c.votes;
          return acc;
        }, {} as { [candidateId: string]: number });

        if (election.notaVotes && election.notaVotes > 0) {
          results['NOTA'] = election.notaVotes;
        }

        return {
          ...election,
          id: election._id,
          candidates: remappedCandidates,
          results,
        };
      })
    );

    res.json(electionsWithDetails);

  } catch (err: any) {
    console.error('CRITICAL ERROR in /api/elections/student:', err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/teacher
// @desc    Get all elections for the logged-in teacher
// @access  Private (Teacher)
router.get('/teacher', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  try {
    const elections = await Election.find({ createdBy: req.user.id }).sort({ startTime: -1 });

    const electionsWithDetails = await Promise.all(
      elections.map(async (e) => {
        const remappedCandidates = await enrichCandidatesWithProfilePictures(e.candidates);
        
        const results = e.candidates.reduce((acc, c) => {
          acc[c.student.toString()] = c.votes;
          return acc;
        }, {} as { [candidateId: string]: number });
        
        if (e.notaVotes && e.notaVotes > 0) {
          results['NOTA'] = e.notaVotes;
        }
        
        return {
          ...e.toObject(),
          id: e._id,
          candidates: remappedCandidates,
          results: results,
          notaVotes: e.notaVotes || 0,
        };
      })
    );

    res.json(electionsWithDetails);
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/:id/timeline
// @desc    Get voting timeline data (votes per minute)
// @access  Private
router.get('/:id/timeline', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Election ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const transactions = await Transaction.find({ election: election._id }).sort({ timestamp: 1 });

    const timelineData: { [key: string]: number } = {};
    const startTime = new Date(election.startTime);
    const endTime = new Date(election.endTime);

    const getUTCTimeKey = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    for (let time = new Date(startTime); time <= endTime; time.setUTCMinutes(time.getUTCMinutes() + 1)) {
      const minuteKey = getUTCTimeKey(time);
      timelineData[minuteKey] = 0;
    }

    transactions.forEach(transaction => {
      const voteTime = new Date(transaction.timestamp);
      const minuteKey = getUTCTimeKey(voteTime);
      if (timelineData[minuteKey] !== undefined) {
        timelineData[minuteKey]++;
      }
    });

    const timeline = Object.entries(timelineData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeKey, votes]) => {
        const [datePart, timePart] = timeKey.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        
        return {
          time: utcDate.toISOString(),
          votes: votes,
          timestamp: timeKey
        };
      });

    res.json(timeline);
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/:id/turnout
// @desc    Get voter turnout analytics
// @access  Private
router.get('/:id/turnout', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Election ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const eligibleVoters = await Student.countDocuments({
      branch: election.branch,
      section: election.section,
      admissionYear: election.admissionYear
    });

    const totalVotes = await Transaction.countDocuments({ election: election._id });
    const turnoutPercentage = eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : '0.00';
    const remainingVoters = eligibleVoters - totalVotes;
    const transactions = await Transaction.find({ election: election._id }).sort({ timestamp: 1 });
    const startTime = new Date(election.startTime);
    const endTime = new Date(election.endTime);
    const turnoutTimeline: { time: string; votes: number; percentage: number }[] = [];
    let cumulativeVotes = 0;

    for (let time = new Date(startTime); time <= endTime; time.setUTCMinutes(time.getUTCMinutes() + 1)) {
      const votesInMinute = transactions.filter(t => {
        const voteTime = new Date(t.timestamp);
        return voteTime >= new Date(time.getTime() - 60000) && voteTime < time;
      }).length;
      
      cumulativeVotes += votesInMinute;
      const percentage = eligibleVoters > 0 ? ((cumulativeVotes / eligibleVoters) * 100) : 0;
      
      turnoutTimeline.push({
        time: time.toISOString(),
        votes: cumulativeVotes,
        percentage: parseFloat(percentage.toFixed(2))
      });
    }

    res.json({
      totalEligibleVoters: eligibleVoters,
      totalVotesCast: totalVotes,
      voterTurnoutPercentage: parseFloat(turnoutPercentage),
      remainingVoters: remainingVoters,
      timeline: turnoutTimeline
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/:id
// @desc    Get a single election by ID
// @access  Private
router.get('/:id', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Election ID' });
    }

    const election = await Election.findById(req.params.id).populate('createdBy', 'name');
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }
    
    let userTicket = null;
    if (req.user?.role === 'student') {
      userTicket = await Ticket.findOne({
        election: election._id,
        student: req.user.id,
      });

      const result = await findStudentModelById(req.user.id);
      if (!result) {
        return res.status(404).json({ message: 'Student not found' });
      }
      const student = result.student;
      if (student?.branch !== election.branch || student?.section !== election.section) {
        return res.status(403).json({ message: 'Not authorized for this election' });
      }

    } else if (req.user?.role === 'teacher') {
      const createdByTeacher = election.createdBy as any;

      if (createdByTeacher._id.toString() !== req.user.id) {
         return res.status(403).json({ message: 'Not authorized for this election' });
      }
    }
    
    const remappedCandidates = await enrichCandidatesWithProfilePictures(election.candidates);

    const results = election.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });
    
    if (election.notaVotes && election.notaVotes > 0) {
      results['NOTA'] = election.notaVotes;
    }

    res.json({
      ...election.toObject(),
      id: election._id,
      userVoted: userTicket ? userTicket.used : false,
      userTicket: (userTicket && !userTicket.used && new Date() < election.endTime && new Date() > election.startTime) ? userTicket.ticketString : undefined,
      candidates: remappedCandidates,
      results: results,
      notaVotes: election.notaVotes || 0,
    });
    
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});


// @route   POST api/elections/:id/stop
// @desc    Manually stop an election
// @access  Private (Teacher)
router.post('/:id/stop', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    const election = await Election.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $set: { endTime: new Date() } },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({ message: 'Election not found or you are not the creator' });
    }

    // Broadcast election stop to all clients in real-time
    io.emit('election:stopped', {
      electionId: req.params.id,
      stoppedAt: new Date().toISOString()
    });
    console.log(`✓ Election manually stopped and broadcasted: ${req.params.id}`);

    const fullElection = await Election.findById(election._id).populate('createdBy', 'name');
    if (fullElection) {
      const results: { [candidateId: string]: number } = fullElection.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
      }, {} as { [candidateId:string]: number });

      if (fullElection.notaVotes && fullElection.notaVotes > 0) {
        results['NOTA'] = fullElection.notaVotes;
      }

      const maxVotes = Math.max(...Object.values(results));
      const winners = fullElection.candidates.filter(c => results[c.student.toString()] === maxVotes);

      if (winners.length > 0) {
        const winnerStudentIds = winners.map(w => w.student.toString());
        const winnerStudents = await Student.find({ _id: { $in: winnerStudentIds } });
        
        const winnerEmails = winnerStudents.map(s => s.email);
        const winnerNames = winnerStudents.map(s => s.name);

        if (winnerEmails.length > 0) {
          try {
            const isTie = winners.length > 1;
            await sendWinnerNotification(winnerEmails, fullElection.title, isTie, winnerNames);
          } catch (emailError) {
            console.error('Failed to send winner notification email:', emailError);
          }
        }
      }
    
      const remappedCandidates = await enrichCandidatesWithProfilePictures(fullElection.candidates);
      const resultsWithNota = fullElection.candidates.reduce((acc, c) => {
          acc[c.student.toString()] = c.votes;
          return acc;
      }, {} as { [candidateId: string]: number });
      
      if (fullElection!.notaVotes && fullElection!.notaVotes > 0) {
        resultsWithNota['NOTA'] = fullElection!.notaVotes;
      }
      
      res.json({
        ...fullElection!.toObject(),
        id: fullElection!._id,
        userVoted: false,
        candidates: remappedCandidates,
        results: resultsWithNota,
        notaVotes: fullElection!.notaVotes || 0,
      });
    } else {
      res.json(election);
    }

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/:id/participants
// @desc    Get list of all participants (voters) in an election with details
// @access  Private (Teacher only)
router.get('/:id/participants', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized - Teachers only' });
  }

  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Ensure only the creator can access
    if (election.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view participants for this election.' });
    }

    // Get all used tickets for this election with student details
    const usedTickets = await Ticket.find({ 
      election: req.params.id, 
      used: true 
    }).populate('student', 'name usn email branch section admissionYear').lean();

    const participants = usedTickets.map((ticket: any) => ({
      name: ticket.student.name,
      usn: ticket.student.usn,
      email: ticket.student.email,
      branch: ticket.student.branch,
      section: ticket.student.section,
      admissionYear: ticket.student.admissionYear,
      votedAt: ticket.updatedAt,
    }));

    res.json(participants);
  } catch (err: any) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/elections/:id/participation
// @desc    Get voter participation lists (voted vs. did not vote)
// @access  Private (Teacher)
router.get('/:id/participation', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Election ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Ensure only the creator can access this
    if (election.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view participation for this election.' });
    }

    // 1. Get all eligible students
    const eligibleStudents = await Student.find({
      branch: election.branch,
      section: election.section,
      admissionYear: election.admissionYear
    }).select('name usn').lean();

    // 2. Get all used tickets for this election
    const usedTickets = await Ticket.find({ election: election._id, used: true }).select('student').lean();
    const votingStudentIds = new Set(usedTickets.map(t => t.student.toString()));

    // 3. Separate students into two lists
    const votedStudents: { name: string, usn: string }[] = [];
    const didNotVoteStudents: { name: string, usn: string }[] = [];

    for (const student of eligibleStudents) {
      if (votingStudentIds.has(student._id.toString())) {
        votedStudents.push({ name: student.name, usn: student.usn });
      } else {
        didNotVoteStudents.push({ name: student.name, usn: student.usn });
      }
    }

    res.json({
      votedStudents,
      didNotVoteStudents
    });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;
