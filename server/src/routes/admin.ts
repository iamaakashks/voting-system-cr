/**
 * Admin Routes
 * 
 * Provides administrative functionality for teachers to manage:
 * - System statistics
 * - User management (students)
 * - Election oversight
 * - Bulk operations
 * 
 * Access: Teachers only (role: 'teacher')
 */

import express, { Response } from 'express';
import { protect, AuthRequest, authorize } from '../middleware/auth';
import Student from '../models/Student';
import Teacher from '../models/Teacher';
import Election from '../models/Election';
import Vote from '../models/Vote';
import Transaction from '../models/Transaction';
import Ticket from '../models/Ticket';
import mongoose from 'mongoose';

const router = express.Router();

// Middleware: All admin routes require teacher authentication
router.use(protect);
router.use(authorize('teacher'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get system-wide statistics
 * @access  Private (Teacher/Admin)
 */
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalStudents,
      totalTeachers,
      totalElections,
      activeElections,
      totalVotes,
      totalTransactions,
      recentVotes,
      recentElections,
    ] = await Promise.all([
      Student.countDocuments(),
      Teacher.countDocuments(),
      Election.countDocuments(),
      Election.countDocuments({ status: 'Ongoing' }),
      Vote.countDocuments(),
      Transaction.countDocuments(),
      Vote.find().sort({ timestamp: -1 }).limit(10).populate('election', 'title'),
      Election.find().sort({ createdAt: -1 }).limit(5).select('title status startTime endTime'),
    ]);

    // Calculate votes today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const votesToday = await Vote.countDocuments({ timestamp: { $gte: today } });

    // Get top elections by votes
    const topElections = await Vote.aggregate([
      { $group: { _id: '$election', voteCount: { $sum: 1 } } },
      { $sort: { voteCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'elections', localField: '_id', foreignField: '_id', as: 'election' } },
      { $unwind: '$election' },
      { $project: { title: '$election.title', voteCount: 1 } },
    ]);

    res.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalElections,
        activeElections,
        totalVotes,
        votesToday,
      },
      recentActivity: {
        recentVotes,
        recentElections,
        topElections,
      },
      systemHealth: {
        databaseStatus: 'connected',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   GET /api/admin/students
 * @desc    Get all students with pagination and search
 * @access  Private (Teacher/Admin)
 */
router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string || '';
    const branch = req.query.branch as string;
    const section = req.query.section as string;
    const admissionYear = req.query.admissionYear as string;

    // Build filter
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { usn: { $regex: search, $options: 'i' } },
      ];
    }
    if (branch) filter.branch = branch;
    if (section) filter.section = section;
    if (admissionYear) filter.admissionYear = parseInt(admissionYear);

    const students = await Student.find(filter)
      .select('-password -publicKey')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Student.countDocuments(filter);

    res.json({
      students,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   GET /api/admin/students/:id
 * @desc    Get student details
 * @access  Private (Teacher/Admin)
 */
router.get('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's voting history
    const votes = await Vote.find({ candidateId: student.id })
      .populate('election', 'title startTime endTime')
      .sort({ timestamp: -1 });

    // Get tickets issued
    const tickets = await Ticket.find({ student: student.id })
      .populate('election', 'title')
      .sort({ createdAt: -1 });

    res.json({
      student,
      votingHistory: votes,
      tickets,
    });
  } catch (error: any) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   DELETE /api/admin/students/:id
 * @desc    Delete a student
 * @access  Private (Teacher/Admin)
 */
router.delete('/students/:id', async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Check if student has voted (optional - you may want to prevent deletion if they have)
    const hasVoted = await Vote.exists({ candidateId: student.id });
    if (hasVoted) {
      return res.status(400).json({ 
        message: 'Cannot delete student who has participated in elections. Consider deactivating instead.' 
      });
    }

    await Student.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   POST /api/admin/students/bulk
 * @desc    Bulk create students from CSV data
 * @access  Private (Teacher/Admin)
 */
router.post('/students/bulk', async (req: AuthRequest, res: Response) => {
  try {
    const { students } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Students array is required' });
    }

    const results = {
      created: 0,
      failed: 0,
      errors: [] as any[],
    };

    for (const studentData of students) {
      try {
        // Check if student already exists
        const exists = await Student.findOne({
          $or: [{ email: studentData.email }, { usn: studentData.usn }],
        });

        if (exists) {
          results.failed++;
          results.errors.push({
            usn: studentData.usn,
            error: 'Student already exists',
          });
          continue;
        }

        // Create student (password will be hashed by pre-save hook)
        await Student.create({
          usn: studentData.usn.toUpperCase(),
          name: studentData.name,
          email: studentData.email.toLowerCase(),
          password: studentData.password || 'ChangeMe123', // Default password
          admissionYear: studentData.admissionYear,
          branch: studentData.branch.toLowerCase(),
          section: studentData.section.toLowerCase(),
          gender: studentData.gender?.toLowerCase(),
        });

        results.created++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          usn: studentData.usn,
          error: error.message,
        });
      }
    }

    res.json({
      message: `Bulk operation completed. Created: ${results.created}, Failed: ${results.failed}`,
      results,
    });
  } catch (error: any) {
    console.error('Error in bulk student creation:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   GET /api/admin/elections
 * @desc    Get all elections with detailed statistics
 * @access  Private (Teacher/Admin)
 */
router.get('/elections', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const filter: any = {};
    if (status) filter.status = status;

    const elections = await Election.find(filter)
      .populate('createdBy', 'name email teacherId')
      .sort({ createdAt: -1 });

    // Enhance with vote counts
    const enhancedElections = await Promise.all(
      elections.map(async (election) => {
        const voteCount = await Vote.countDocuments({ election: election._id });
        return {
          ...election.toObject(),
          voteCount,
        };
      })
    );

    res.json({ elections: enhancedElections });
  } catch (error: any) {
    console.error('Error fetching elections:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   DELETE /api/admin/elections/:id
 * @desc    Delete an election (admin override)
 * @access  Private (Teacher/Admin)
 */
router.delete('/elections/:id', async (req: AuthRequest, res: Response) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election is ongoing
    if (election.status === 'Ongoing') {
      return res.status(400).json({ 
        message: 'Cannot delete ongoing election. Stop it first.' 
      });
    }

    // Delete related data
    await Promise.all([
      Vote.deleteMany({ election: election._id }),
      Transaction.deleteMany({ election: election._id }),
      Ticket.deleteMany({ election: election._id }),
    ]);

    await Election.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Election and all related data deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting election:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs (transactions)
 * @access  Private (Teacher/Admin)
 */
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const electionId = req.query.electionId as string;

    const filter: any = {};
    if (electionId) filter.election = electionId;

    const logs = await Transaction.find(filter)
      .populate('election', 'title')
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

/**
 * @route   GET /api/admin/teachers
 * @desc    Get all teachers
 * @access  Private (Teacher/Admin)
 */
router.get('/teachers', async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await Teacher.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ teachers });
  } catch (error: any) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Server Error: ' + error.message });
  }
});

export default router;
