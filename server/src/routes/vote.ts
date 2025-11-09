import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election from '../models/Election';
import Ticket from '../models/Ticket';
import crypto from 'crypto';

const router = express.Router();

// @route   POST api/vote
// @desc    Cast a vote
// @access  Private (Student)
router.post('/', protect, async (req: AuthRequest, res: Response) => {
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
    
    // You should save the txHash to a new 'Transaction' collection here

    res.json({ message: 'Vote cast successfully!', txHash: mockTxHash });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;