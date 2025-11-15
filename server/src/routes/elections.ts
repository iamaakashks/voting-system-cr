import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election, { IElection } from '../models/Election';
import { findStudentModelById, getStudentModel } from '../utils/getStudentModel';
import Student2022 from '../models/Student2022';
import Student2023 from '../models/Student2023';
import Student2024 from '../models/Student2024';
import Student2025 from '../models/Student2025';
import Ticket from '../models/Ticket';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';
import { sendNewElectionNotification } from '../utils/emailService';
import crypto from 'crypto';
import { ITeacher } from '../models/Teacher';

const router = express.Router();

// @route   POST api/elections
// @desc    Create a new election
// @access  Private (Teacher)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  // ... (this route is fine)
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { title, description, branch, section, startTime, endTime, candidates } = req.body;

  try {
    const newElection = new Election({
      title,
      description: description || '',
      branch,
      section,
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

    // Tickets will be generated on-demand when students request to vote
    // This ensures tickets are sent via email and have expiration times
    
    // Send email notification to students
    if (candidates && candidates.length > 0) {
      const firstCandidateId = candidates[0].id;
      const result = await findStudentModelById(firstCandidateId);

      if (result && result.student) {
        const student = result.student;
        const admissionYear = student.admissionYear;
        const StudentModel = getStudentModel(admissionYear);
        const students = await StudentModel.find({ branch, section, admissionYear });
        const studentEmails = students.map(student => student.email);

        if (studentEmails.length > 0) {
          try {
            await sendNewElectionNotification(studentEmails, title, new Date(startTime), new Date(endTime));
          } catch (emailError) {
            console.error('Failed to send new election notification emails:', emailError);
            // Don't block the response for email errors, just log it
          }
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
      {
        $match: {
          branch: student.branch,
          section: student.section,
        },
      },
      { $sort: { startTime: -1 } },
      {
        $lookup: {
          from: 'tickets',
          let: { electionId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$election', '$$electionId'] },
                    { $eq: ['$student', studentId] },
                  ],
                },
              },
            },
          ],
          as: 'ticket',
        },
      },
      { $unwind: { path: '$ticket', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'transactions',
          let: { electionId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$election', '$$electionId'] },
                    { $eq: ['$student', studentId] },
                  ],
                },
              },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
          as: 'transaction',
        },
      },
      { $unwind: { path: '$transaction', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'teachers',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy',
        },
      },
      { $unwind: { path: '$createdBy', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          branch: 1,
          section: 1,
          startTime: 1,
          endTime: 1,
          candidates: 1,
          notaVotes: 1,
          createdBy: { name: '$createdBy.name' },
          userVoted: { $ifNull: ['$ticket.used', false] },
          userVoteTxHash: '$transaction.txHash',
          userTicket: {
            $cond: {
              if: {
                $and: [
                  '$ticket',
                  { $eq: ['$ticket.used', false] },
                  { $lt: [new Date(), '$endTime'] },
                  { $gt: [new Date(), '$startTime'] },
                ],
              },
              then: '$ticket.ticketString',
              else: '$$REMOVE',
            },
          },
        },
      },
    ]);

    const electionsWithDetails = await Promise.all(
      elections.map(async (election) => {
        const getProfilePicture = async (candidateId: string, candidateName: string) => {
          try {
            const result = await findStudentModelById(candidateId);
            const gender = result?.student?.gender || 'male';
            const username = candidateName.split(' ')[0];
            const genderPath = gender === 'female' ? 'girl' : 'boy';
            return `https://avatar.iran.liara.run/public/${genderPath}?username=${encodeURIComponent(username)}`;
          } catch (error) {
            const username = candidateName.split(' ')[0];
            return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
          }
        };

        const remappedCandidates = await Promise.all(
          election.candidates.map(async (c: any) => {
            const imageUrl = await getProfilePicture(c.student.toString(), c.name);
            return {
              id: c.student.toString(),
              name: c.name,
              imageUrl,
            };
          })
        );

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
  // ... (this route is fine)
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  try {
    const elections = await Election.find({
      createdBy: req.user.id
    }).sort({ startTime: -1 });
    
        // Generate gender-specific profile picture using avatar placeholder API
        const getProfilePicture = async (studentId: string, candidateName: string) => {
          try {
            const result = await findStudentModelById(studentId);
            if (!result) {
              const username = candidateName.split(' ')[0];
              return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
            }
            const student = result.student;
            const gender = student?.gender || 'male'; // Default to male if not set
            // Use avatar placeholder API with gender-specific endpoints
            const genderPath = gender === 'female' ? 'girl' : 'boy';
            const username = candidateName.split(' ')[0]; // Use first name as username
            return `https://avatar.iran.liara.run/public/${genderPath}?username=${encodeURIComponent(username)}`;
          } catch (error) {
            // Fallback to default male avatar
            const username = candidateName.split(' ')[0];
            return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
          }
        };

    const electionsWithDetails = await Promise.all(
      elections.map(async (e) => {
        const remappedCandidates = await Promise.all(
          e.candidates.map(async (c) => {
            const imageUrl = await getProfilePicture(c.student.toString(), c.name);
            return {
              id: c.student.toString(),
              name: c.name,
              imageUrl
            };
          })
        );
        
        const results = e.candidates.reduce((acc, c) => {
          acc[c.student.toString()] = c.votes;
          return acc;
        }, {} as { [candidateId: string]: number });
        
        // Include NOTA votes in results
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

    // Get all transactions for this election
    const transactions = await Transaction.find({ election: election._id })
      .sort({ timestamp: 1 })
      .populate('student', 'gender');

    // Group votes by minute using UTC to avoid timezone issues
    const timelineData: { [key: string]: number } = {};
    const startTime = new Date(election.startTime);
    const endTime = new Date(election.endTime);

    // Helper function to get UTC time key (YYYY-MM-DDTHH:mm in UTC)
    const getUTCTimeKey = (date: Date): string => {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const day = String(date.getUTCDate()).padStart(2, '0');
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Initialize all minutes with 0 votes (using UTC)
    for (let time = new Date(startTime); time <= endTime; time.setUTCMinutes(time.getUTCMinutes() + 1)) {
      const minuteKey = getUTCTimeKey(time);
      timelineData[minuteKey] = 0;
    }

    // Count votes per minute (using UTC)
    transactions.forEach(transaction => {
      const voteTime = new Date(transaction.timestamp);
      const minuteKey = getUTCTimeKey(voteTime);
      if (timelineData[minuteKey] !== undefined) {
        timelineData[minuteKey]++;
      }
    });

    // Convert to array format for chart - send ISO timestamps
    const timeline = Object.entries(timelineData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([timeKey, votes]) => {
        // Parse the UTC time key and create a proper UTC date
        const [datePart, timePart] = timeKey.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);
        // Create date in UTC
        const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        
        return {
          time: utcDate.toISOString(), // Send ISO string for frontend conversion
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

    // Get total eligible voters (all students in branch and section across all years)
    let eligibleVoters = 0;
    const models = [Student2022, Student2023, Student2024, Student2025];
    for (const StudentModel of models) {
      const count = await StudentModel.countDocuments({
        branch: election.branch,
        section: election.section
      });
      eligibleVoters += count;
    }

    // Get total votes cast
    const totalVotes = await Transaction.countDocuments({ election: election._id });

    // Calculate turnout percentage
    const turnoutPercentage = eligibleVoters > 0 ? ((totalVotes / eligibleVoters) * 100).toFixed(2) : '0.00';
    const remainingVoters = eligibleVoters - totalVotes;

    // Get live turnout data (votes over time)
    const transactions = await Transaction.find({ election: election._id })
      .sort({ timestamp: 1 });

    const startTime = new Date(election.startTime);
    const now = new Date();
    const turnoutTimeline: { time: string; votes: number; percentage: number }[] = [];
    let cumulativeVotes = 0;

    // Create timeline with cumulative votes (using UTC to avoid timezone issues)
    for (let time = new Date(startTime); time <= now; time.setUTCMinutes(time.getUTCMinutes() + 1)) {
      const votesInMinute = transactions.filter(t => {
        const voteTime = new Date(t.timestamp);
        return voteTime >= new Date(time.getTime() - 60000) && voteTime < time;
      }).length;
      
      cumulativeVotes += votesInMinute;
      const percentage = eligibleVoters > 0 ? ((cumulativeVotes / eligibleVoters) * 100) : 0;
      
      turnoutTimeline.push({
        time: time.toISOString(), // Send ISO string for frontend conversion
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

    // Get all transactions with student gender info and candidateId
    const transactions = await Transaction.find({ election: election._id })
      .populate('student', 'gender');

    const genderStats: { [candidateId: string]: { male: number; female: number } } = {};
    
    // Initialize all candidates
    election.candidates.forEach(candidate => {
      genderStats[candidate.student.toString()] = { male: 0, female: 0 };
    });
    genderStats['NOTA'] = { male: 0, female: 0 };

    // Count votes by gender for each candidate
    transactions.forEach((tx: any) => {
      if (tx.candidateId && tx.student && tx.student.gender) {
        const candidateId = tx.candidateId.toString();
        const gender = tx.student.gender as 'male' | 'female';
        
        if (genderStats[candidateId]) {
          genderStats[candidateId][gender]++;
        }
      }
    });
    
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
  // ... (this route is fine)
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
    
        // Generate gender-specific profile picture using avatar placeholder API
        const getProfilePicture = async (studentId: string, candidateName: string) => {
          try {
            const result = await findStudentModelById(studentId);
            if (!result) {
              const username = candidateName.split(' ')[0];
              return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
            }
            const student = result.student;
            const gender = student?.gender || 'male'; // Default to male if not set
            // Use avatar placeholder API with gender-specific endpoints
            const genderPath = gender === 'female' ? 'girl' : 'boy';
            const username = candidateName.split(' ')[0]; // Use first name as username
            return `https://avatar.iran.liara.run/public/${genderPath}?username=${encodeURIComponent(username)}`;
          } catch (error) {
            // Fallback to default male avatar
            const username = candidateName.split(' ')[0];
            return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
          }
        };

    const remappedCandidates = await Promise.all(
      election.candidates.map(async (c) => {
        const imageUrl = await getProfilePicture(c.student.toString(), c.name);
        return {
          id: c.student.toString(),
          name: c.name,
          imageUrl
        };
      })
    );

    const results = election.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });
    
    // Include NOTA votes in results
    if (election.notaVotes && election.notaVotes > 0) {
      results['NOTA'] = election.notaVotes;
    }

    // Get transaction hash if user has voted
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
  // ... (this route is fine)
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
    
        // Generate gender-specific profile picture using avatar placeholder API
        const getProfilePicture = async (studentId: string, candidateName: string) => {
          try {
            const result = await findStudentModelById(studentId);
            if (!result) {
              const username = candidateName.split(' ')[0];
              return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
            }
            const student = result.student;
            const gender = student?.gender || 'male'; // Default to male if not set
            // Use avatar placeholder API with gender-specific endpoints
            const genderPath = gender === 'female' ? 'girl' : 'boy';
            const username = candidateName.split(' ')[0]; // Use first name as username
            return `https://avatar.iran.liara.run/public/${genderPath}?username=${encodeURIComponent(username)}`;
          } catch (error) {
            // Fallback to default male avatar
            const username = candidateName.split(' ')[0];
            return `https://avatar.iran.liara.run/public/boy?username=${encodeURIComponent(username)}`;
          }
        };

    const remappedCandidates = await Promise.all(
      fullElection!.candidates.map(async (c) => {
        const imageUrl = await getProfilePicture(c.student.toString(), c.name);
        return {
          id: c.student.toString(),
          name: c.name,
          imageUrl
        };
      })
    );
    const results = fullElection!.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });
    
    // Include NOTA votes in results
    if (fullElection!.notaVotes && fullElection!.notaVotes > 0) {
      results['NOTA'] = fullElection!.notaVotes;
    }
    
    res.json({
      ...fullElection!.toObject(),
      id: fullElection!._id,
      userVoted: false,
      candidates: remappedCandidates,
      results: results,
      notaVotes: fullElection!.notaVotes || 0,
    });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;