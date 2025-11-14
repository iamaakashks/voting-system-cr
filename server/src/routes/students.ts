import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { getStudentModel } from '../utils/getStudentModel';
import Student2022 from '../models/Student2022';
import Student2023 from '../models/Student2023';
import Student2024 from '../models/Student2024';
import Student2025 from '../models/Student2025';

const router = express.Router();

// @route   GET api/students/search
// @desc    Search for students by branch, section, and name
// @access  Private (Teacher)
router.get('/search', protect, async (req: AuthRequest, res: Response) => {
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { branch, section, name, admissionYear } = req.query;

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

    // If admissionYear is provided, search only that collection
    // Otherwise, search all collections and combine results
    if (admissionYear && [2022, 2023, 2024, 2025].includes(Number(admissionYear))) {
      const StudentModel = getStudentModel(Number(admissionYear));
      const students = await StudentModel.find(query).select('name usn').limit(10);
      return res.json(students);
    }

    // Search all collections
    const allStudents: any[] = [];
    const models = [Student2022, Student2023, Student2024, Student2025];
    
    for (const StudentModel of models) {
      const students = await StudentModel.find(query).select('name usn').limit(10);
      allStudents.push(...students);
    }

    // Sort and limit to 10 total
    const uniqueStudents = Array.from(
      new Map(allStudents.map(s => [s.usn, s])).values()
    ).slice(0, 10);

    res.json(uniqueStudents);
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;