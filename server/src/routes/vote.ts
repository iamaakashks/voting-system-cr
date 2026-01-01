import express, { Response } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, AuthRequest } from '../middleware/auth';
import Election from '../models/Election';
import Ticket from '../models/Ticket';
import Transaction from '../models/Transaction';
import Student from '../models/Student';
import Vote from '../models/Vote';
import crypto from 'crypto';
import nacl from 'tweetnacl';
import { Buffer } from 'buffer';
import { io } from '../index';

const router = express.Router();

// Rate limiter for vote casting - prevents spam/flooding
const voteRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 10, // Max 10 vote attempts per minute per IP
  message: 'Too many vote attempts from this IP, please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// @route   POST api/vote
// @desc    Cast a vote with a digital signature
// @access  Private (Student)
router.post('/', voteRateLimiter, protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { ballot, signature } = req.body;
  const { electionId, candidateId, ticketId, timestamp } = ballot;
  const studentId = req.user.id;

  try {
    // 1. Get student and public key
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(400).json({ message: 'Student not found.' });
    }
    if (!student.publicKey) {
      return res.status(400).json({ message: 'Public key not found for student. Please re-login to generate a key.' });
    }
    
    console.log('Student found:', student.name, 'USN:', student.usn);
    console.log('Public key exists:', !!student.publicKey);
    console.log('Public key length:', student.publicKey.length);

    // 2. Validate election
    const election = await Election.findById(electionId);
    if (!election) return res.status(404).json({ message: 'Election not found' });
    
    const now = new Date();
    if (now < election.startTime) return res.status(400).json({ message: 'Election has not started' });
    if (now > election.endTime) return res.status(400).json({ message: 'Election has ended' });

    // 3. Validate ticket
    const userTicket = await Ticket.findOne({ ticketString: ticketId.toUpperCase(), student: studentId });

    if (!userTicket) {
      return res.status(400).json({ message: 'Invalid ticket.' });
    }
    if (userTicket.student.toString() !== studentId) {
      return res.status(403).json({ message: 'This ticket does not belong to you.'});
    }
    if (userTicket.used) {
      return res.status(400).json({ message: 'This ticket has already been used' });
    }
    if (now > userTicket.expiresAt) {
      return res.status(400).json({ message: 'Ticket has expired. Please request a new ticket.' });
    }

    // 4. Verify signature
    const message = JSON.stringify(ballot);
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = Buffer.from(signature, 'base64');
    const publicKeyBytes = Buffer.from(student.publicKey, 'hex');

    console.log('=== Signature Verification Debug ===');
    console.log('Ballot received:', ballot);
    console.log('Ballot stringified:', message);
    console.log('Message bytes length:', messageBytes.length);
    console.log('Signature bytes length:', signatureBytes.length);
    console.log('Public key bytes length:', publicKeyBytes.length);
    console.log('Public key (hex):', student.publicKey);

    const isVerified = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

    console.log('Signature verification result:', isVerified);
    console.log('====================================');

    if (!isVerified) {
      return res.status(400).json({ message: 'Invalid signature. Vote rejected.' });
    }

    // 5. Signature is valid, proceed with anonymous vote
    const ballotHash = crypto.createHash('sha256').update(message).digest('hex');

    // Create anonymous vote record
    await Vote.create({
      election: electionId,
      candidateId: candidateId,
      ballotHash: ballotHash,
      timestamp: new Date(timestamp)
    });

    // Update vote count
    if (candidateId === 'NOTA') {
      await Election.updateOne({ _id: electionId }, { $inc: { notaVotes: 1 } });
    } else {
      await Election.updateOne({ _id: electionId, "candidates.student": candidateId }, { $inc: { "candidates.$.votes": 1 } });
    }

    // Mark ticket as used
    userTicket.used = true;
    await userTicket.save();

    // Create anonymous transaction record for audit trail
    const transaction = await Transaction.create({
      ballotHash: ballotHash,
      election: electionId,
      candidateId: candidateId,
      timestamp: new Date(timestamp)
    });
    
    console.log('Transaction created:', transaction._id, 'with ballot hash:', ballotHash.substring(0, 16) + '...');

    // Broadcast only to clients viewing this specific election (room-based)
    io.to(`election:${electionId}`).emit('vote:new', { electionId: electionId });
    io.to(`election:${electionId}`).emit('election:results:updated', { electionId: electionId });

    console.log(`Vote cast successfully for election ${electionId}, ballot hash: ${ballotHash}`);
    
    res.json({ message: 'Vote cast successfully!', ballotHash: ballotHash });

  } catch (err: any) {
    console.error('Error casting vote:', err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;
