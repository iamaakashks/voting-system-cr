import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election from '../models/Election';
import Ticket from '../models/Ticket';
import Transaction from '../models/Transaction';
import { findStudentModelById } from '../utils/getStudentModel';
import crypto from 'crypto';

const router = express.Router();

// @route   POST api/vote
// @desc    Cast a vote
// @access  Private (Student)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  
  const { electionId, candidateId, ticket, email } = req.body;
  const studentId = req.user.id;

  try {
    // Get student info
    const result = await findStudentModelById(studentId);
    if (!result) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const student = result.student;

    // Validate email matches logged-in student
    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      return res.status(400).json({ message: 'Email does not match your account' });
    }

    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    const now = new Date();
    if (now < election.startTime) return res.status(400).json({ message: 'Election has not started' });
    if (now > election.endTime) return res.status(400).json({ message: 'Election has ended' });

    // Find ticket by email and ticket string
    const userTicket = await Ticket.findOne({
      election: electionId,
      student: studentId,
      ticketString: ticket.toUpperCase(),
      email: student.email.toLowerCase()
    });
    
    if (!userTicket) {
      return res.status(400).json({ message: 'Invalid ticket or email. Please request a new ticket.' });
    }
    
    if (userTicket.used) {
      return res.status(400).json({ message: 'This ticket has already been used' });
    }

    // Check if ticket has expired
    if (now > userTicket.expiresAt) {
      return res.status(400).json({ message: 'Ticket has expired. Please request a new ticket.' });
    }

    // Mark ticket as used
    userTicket.used = true;
    
    const mockTxHash = '0x' + crypto.randomBytes(32).toString('hex');
    
    // Update vote count - handle NOTA votes separately
    if (candidateId === 'NOTA') {
      await Election.updateOne(
        { _id: electionId },
        { $inc: { notaVotes: 1 } }
      );
    } else {
      await Election.updateOne(
        { _id: electionId, "candidates.student": candidateId },
        { $inc: { "candidates.$.votes": 1 } }
      );
    }
    
    await userTicket.save();
    
    // Save the transaction to the database
    await Transaction.create({
      txHash: mockTxHash,
      election: electionId,
      student: studentId,
      candidateId: candidateId, // Store which candidate was voted for
      timestamp: new Date()
    });

    res.json({ message: 'Vote cast successfully!', txHash: mockTxHash });

  } catch (err: any) {
    console.error('Error casting vote:', err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;