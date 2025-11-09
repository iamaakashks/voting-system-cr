import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Student from '../models/Student';

const router = express.Router();

// @route   GET api/students/search
// @desc    Search for students by branch, section, and name
// @access  Private (Teacher)
router.get('/search', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { branch, section, name } = req.query;

  if (!branch || !section) {
    return res.status(400).json({ message: 'Branch and section are required' });
  }

  try {
    const query: any = {
      branch: branch as string,
      section: section as string,
    };

    if (name) {
      // Search by name or USN
      query.$or = [
        { name: new RegExp(name as string, 'i') },
        { usn: new RegExp(name as string, 'i') }
      ];
    }

    const students = await Student.find(query).select('name usn').limit(10);
    res.json(students);
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;