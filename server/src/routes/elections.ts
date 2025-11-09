import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election, { IElection } from '../models/Election';
import Student from '../models/Student';
import Ticket from '../models/Ticket';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { ITeacher } from '../models/Teacher';

const router = express.Router();

interface Transaction {
  txHash: string;
  electionTitle: string;
  timestamp: string;
}

// @route   POST api/elections
// @desc    Create a new election
// @access  Private (Teacher)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { title, description, branch, section, startTime, endTime, candidates } = req.body;

  try {
    const newElection = new Election({
      title,
      description,
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

    const eligibleStudents = await Student.find({ branch, section });

    const ticketsToCreate = eligibleStudents.map(student => ({
      election: newElection._id,
      student: student._id,
      ticketString: Ticket.generateTicket(10),
      used: false
    }));
    
    if (ticketsToCreate.length > 0) {
      await Ticket.insertMany(ticketsToCreate);
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
    console.log('Fetching student data for user ID:', req.user.id);
    const student = await Student.findById(req.user.id);
    console.log('Found student:', student);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    console.log(`Finding elections for branch: ${student.branch}, section: ${student.section}`);
    const elections = await Election.find({
      branch: student.branch,
      section: student.section
    }).populate('createdBy', 'name').sort({ startTime: -1 });
    console.log('Found elections:', elections);


    const electionsWithTickets = await Promise.all(
      elections.map(async (election) => {
        const ticket = await Ticket.findOne({
          election: election._id,
          student: student._id
        });
        
        return {
          ...election.toObject(),
          id: election._id,
          userVoted: ticket ? ticket.used : false,
          userTicket: (ticket && !ticket.used && new Date() < election.endTime && new Date() > election.startTime) ? ticket.ticketString : undefined,
        };
      })
    );
    
    res.json(electionsWithTickets);
  } catch (err: any) {
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
    const elections = await Election.find({
      createdBy: req.user.id
    }).sort({ startTime: -1 });
    
    const electionsWithId = elections.map(e => ({
      ...e.toObject(),
      id: e._id
    }));

    res.json(electionsWithId);
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

    // Check if user is allowed to see this
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
    
    // Remap candidates to match old format
    const remappedCandidates = election.candidates.map(c => ({
        id: c.student.toString(),
        name: c.name,
        imageUrl: `https://picsum.photos/seed/${c.name.replace(/\s+/g, '')}/400`
    }));

    // Create results object
    const results = election.candidates.reduce((acc, c) => {
        acc[c.student.toString()] = c.votes;
        return acc;
    }, {} as { [candidateId: string]: number });

    res.json({
      ...election.toObject(),
      id: election._id,
      userVoted: userTicket ? userTicket.used : false,
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
        imageUrl: `https://picsum.photos/seed/${c.name.replace(/\s+/g, '')}/400`
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

// @route   POST api/elections/vote
// @desc    Cast a vote
// @access  Private (Student)
router.post('/vote', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { electionId, candidateId, ticket } = req.body;
  const studentId = req.user.id;

  try {
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    const now = new Date();
    if (now < election.startTime) return res.status(400).json({ message: 'Election has not started' });
    if (now > election.endTime) return res.status(400).json({ message: 'Election has ended' });

    const userTicket = await Ticket.findOne({
      election: electionId,
      student: studentId,
      ticketString: ticket
    });
    
    if (!userTicket) return res.status(400).json({ message: 'Invalid ticket' });
    if (userTicket.used) return res.status(400).json({ message: 'This ticket has already been used' });

    userTicket.used = true;
    
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    await Election.updateOne(
        { _id: electionId, "candidates.student": candidateId },
        { $inc: { "candidates.$.votes": 1 } }
    );
    
    await userTicket.save();
    
    res.json({ message: 'Vote cast successfully!', txHash: mockTxHash });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/transactions/recent
// @desc    Get recent transactions
// @access  Private
router.get('/transactions/recent', protect, async (req: AuthRequest, res: Response) => {
    const mockTransactions: Transaction[] = [
    ];
    res.json(mockTransactions);
});

export default router;