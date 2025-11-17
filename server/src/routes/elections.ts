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

const router = express.Router();

// @route   POST api/elections
// @desc    Create a new election
// @access  Private (Teacher)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { title, description, branch, section, admissionYear, startTime, endTime, candidates } = req.body;

  try {
    const newElection = new Election({
      title,
      description: description || '',
      branch,
      section,
      admissionYear,
      startTime,
      endTime,
      createdBy: req.user.id,
      candidates: candidates.map((c: any) => ({
        student: c.id,
        name: c.name,
        usn: c.usn
      }))
    });
    await newElection.save();
    
    // Send email notification to students
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
      { $lookup: { from: 'transactions', let: { electionId: '$_id' }, pipeline: [ { $match: { $expr: { $and: [ { $eq: ['$election', '$$electionId'] }, { $eq: ['$student', studentId] }, ], }, }, }, { $sort: { timestamp: -1 } }, { $limit: 1 }, ], as: 'transaction', }, },
      { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'teachers', localField: 'createdBy', foreignField: '_id', as: 'createdBy', }, },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, title: 1, description: 1, branch: 1, section: 1, startTime: 1, endTime: 1, candidates: 1, notaVotes: 1, createdBy: { name: '$createdBy.name' }, userVoted: { $ifNull: ['$ticket.used', false] }, userVoteTxHash: '$transaction.txHash', userTicket: { $cond: { if: { $and: [ '$ticket', { $eq: ['$ticket.used', false] }, { $lt: [new Date(), '$endTime'] }, { $gt: [new Date(), '$startTime'] }, ], }, then: '$ticket.ticketString', else: '$$REMOVE', }, }, }, },
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

    const transactions = await Transaction.find({ election: election._id }).sort({ timestamp: 1 }).populate('student', 'gender');

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
      section: election.section
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

// @route   GET api/elections/:id/gender-stats
// @desc    Get gender-based vote statistics
// @access  Private
router.get('/:id/gender-stats', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Election ID' });
    }

    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const transactions = await Transaction.find({ election: election._id });
    const studentIds = [...new Set(transactions.map(tx => tx.student.toString()))];
    const students: IStudent[] = await Student.find({ _id: { $in: studentIds } }).select('gender');
    const studentGenderMap = new Map(students.map((s: IStudent) => [s._id.toString(), s.gender]));
    const genderStats: { [candidateId: string]: { male: number; female: number } } = {};

    election.candidates.forEach(candidate => {
      genderStats[candidate.student.toString()] = { male: 0, female: 0 };
    });
    genderStats['NOTA'] = { male: 0, female: 0 };

    for (const tx of transactions) {
      const gender = studentGenderMap.get(tx.student.toString()) as 'male' | 'female';
      if (!gender) continue;

      if (tx.candidateId && tx.candidateId !== 'NOTA') {
        const candidateId = tx.candidateId.toString();
        if (genderStats[candidateId]) {
          genderStats[candidateId][gender]++;
        }
      } else {
        genderStats['NOTA'][gender]++;
      }
    }

    res.json({
      candidates: election.candidates.map(c => ({
        candidateId: c.student.toString(),
        candidateName: c.name,
        maleVotes: genderStats[c.student.toString()]?.male || 0,
        femaleVotes: genderStats[c.student.toString()]?.female || 0
      })),
      nota: {
        maleVotes: genderStats['NOTA']?.male || 0,
        femaleVotes: genderStats['NOTA']?.female || 0
      }
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
    }

    if (req.user?.role === 'student') {
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

    let userVoteTxHash = undefined;
    if (userTicket && userTicket.used && req.user?.role === 'student') {
      const transaction = await Transaction.findOne({
        election: election._id,
        student: req.user.id
      }).sort({ timestamp: -1 });
      if (transaction) {
        userVoteTxHash = transaction.txHash;
      }
    }

    res.json({
      ...election.toObject(),
      id: election._id,
      userVoted: userTicket ? userTicket.used : false,
      userVoteTxHash: userVoteTxHash,
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
        // N+1 Query Fix: Fetch all winning students in one go
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

export default router;