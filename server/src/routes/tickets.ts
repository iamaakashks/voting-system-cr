import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Election from '../models/Election';
import Ticket from '../models/Ticket';
import Student from '../models/Student';
import { sendVotingTicket } from '../utils/emailService';

const router = express.Router();

// @route   POST api/tickets/request
// @desc    Request a voting ticket for an election (sends ticket via email)
// @access  Private (Student)
router.post('/request', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'student') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { electionId } = req.body;
  const studentId = req.user.id;

  try {
    // Get student info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get election
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if student is eligible for this election
    if (student.branch !== election.branch || student.section !== election.section) {
      return res.status(403).json({ message: 'You are not eligible for this election' });
    }

    // Check if election is live
    const now = new Date();
    if (now < election.startTime) {
      return res.status(400).json({ message: 'Election has not started yet' });
    }
    if (now > election.endTime) {
      return res.status(400).json({ message: 'Election has ended' });
    }

    // Check if student has already voted
    const existingTicket = await Ticket.findOne({
      election: electionId,
      student: studentId,
      used: true
    });

    if (existingTicket) {
      return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Delete any existing unused tickets for this student and election
    await Ticket.deleteMany({
      election: electionId,
      student: studentId,
      used: false
    });

    // Generate new ticket with 5-minute expiration
    const ticketString = Ticket.generateTicket(12);
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    // Create new ticket
    const newTicket = new Ticket({
      election: electionId,
      student: studentId,
      ticketString,
      used: false,
      expiresAt,
      email: student.email.toLowerCase()
    });

    await newTicket.save();

    // Send ticket via email
    try {
      await sendVotingTicket(student.email, ticketString, election.title);
      res.json({ 
        message: 'Voting ticket sent to your email. Please check your inbox.',
        expiresIn: 5 * 60 * 1000 // 5 minutes in milliseconds
      });
    } catch (emailError) {
      // If email fails, delete the ticket and return error
      await Ticket.deleteOne({ _id: newTicket._id });
      console.error('Error sending email:', emailError);
      return res.status(500).json({ 
        message: 'Failed to send ticket email. Please try again later.' 
      });
    }

  } catch (err: any) {
    console.error('Error requesting ticket:', err);
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;

