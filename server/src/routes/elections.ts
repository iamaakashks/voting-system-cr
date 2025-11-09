import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election, { IElection } from '../models/Election';
import Student from '../models/Student';
import Ticket from '../models/Ticket';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';
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
    // --- ADDED LOG 1 ---
    console.log(`[LOG 1/5] Fetching student: ${req.user.id}`);
    const student = await Student.findById(req.user.id);
    if (!student) {
      console.error('[ERROR] Student not found in DB');
      return res.status(404).json({ message: 'Student not found' });
    }

    // --- ADDED LOG 2 ---
    console.log(`[LOG 2/5] Finding elections for: ${student.branch} - ${student.section}`);
    const elections = await Election.find({
      branch: student.branch,
      section: student.section
    }).populate('createdBy', 'name').sort({ startTime: -1 });

    // --- ADDED LOG 3 ---
    console.log(`[LOG 3/5] Found ${elections.length} elections. Starting processing...`);

    const electionsWithDetails = await Promise.all(
      elections.map(async (election) => {
        const ticket = await Ticket.findOne({
          election: election._id,
          student: student._id
        });

        // Get transaction hash if user has voted
        let userVoteTxHash = undefined;
        if (ticket && ticket.used) {
          const transaction = await Transaction.findOne({
            election: election._id,
            student: student._id
          }).sort({ timestamp: -1 });
          if (transaction) {
            userVoteTxHash = transaction.txHash;
          }
        }

        const remappedCandidates = election.candidates.map(c => ({
            id: c.student.toString(),
            name: c.name,
            imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563eb&color=fff&size=200&bold=true&font-size=0.5`
        }));
        const results = election.candidates.reduce((acc, c) => {
            acc[c.student.toString()] = c.votes;
            return acc;
        }, {} as { [candidateId: string]: number });
        
        return {
          ...election.toObject(),
          id: election._id,
          userVoted: ticket ? ticket.used : false,
          userVoteTxHash: userVoteTxHash,
          userTicket: (ticket && !ticket.used && new Date() < election.endTime && new Date() > election.startTime) ? ticket.ticketString : undefined,
          candidates: remappedCandidates,
          results: results,
        };
      })
    );
    
    // --- ADDED LOG 4 ---
    console.log('[LOG 4/5] Successfully processed all elections.');
    res.json(electionsWithDetails);

  } catch (err: any) {
    // --- ADDED LOG 5 ---
    console.error('[LOG 5/5] CRITICAL ERROR in /api/elections/student:', err);
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
    
    const electionsWithDetails = elections.map(e => {
      const remappedCandidates = e.candidates.map(c => ({
        id: c.student.toString(),
        name: c.name,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563eb&color=fff&size=200&bold=true&font-size=0.5`
      }));
      
      const results = e.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
      }, {} as { [candidateId: string]: number });
      
      return {
        ...e.toObject(),
        id: e._id,
        candidates: remappedCandidates,
        results: results,
      };
    });

    res.json(electionsWithDetails);
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
      const student = await Student.findById(req.user.id);
      if (student?.branch !== election.branch || student?.section !== election.section) {
        return res.status(403).json({ message: 'Not authorized for this election' });
      }
    } else if (req.user?.role === 'teacher') {
      const createdByTeacher = election.createdBy as any;

      if (createdByTeacher._id.toString() !== req.user.id) {
         return res.status(403).json({ message: 'Not authorized for this election' });
      }
    }
    
    const remappedCandidates = election.candidates.map(c => ({
        id: c.student.toString(),
        name: c.name,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563eb&color=fff&size=200&bold=true&font-size=0.5`
    }));

    const results = election.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });

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
    
    const remappedCandidates = fullElection!.candidates.map(c => ({
        id: c.student.toString(),
        name: c.name,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=2563eb&color=fff&size=200&bold=true&font-size=0.5`
    }));
    const results = fullElection!.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });
    
    res.json({
      ...fullElection!.toObject(),
      id: fullElection!._id,
      userVoted: false,
      candidates: remappedCandidates,
      results: results,
    });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;