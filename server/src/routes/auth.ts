import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Student, { IStudent } from '../models/Student';
import Teacher, { ITeacher } from '../models/Teacher';
import { protect, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id: string, role: 'student' | 'teacher') => {
  return jwt.sign({ user: { id, role } }, 'YOUR_JWT_SECRET', { expiresIn: '1d' });
};

// @route   POST api/auth/register-student
// @desc    (DEV ONLY) Register a new student
router.post('/register-student', async (req: Request, res: Response) => {
  try {
    const { usn, name, email, password, admissionYear, branch, section } = req.body;
    
    let student = await Student.findOne({ email });
    if (student) return res.status(400).json({ message: 'Student already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      usn, name, email, password: hashedPassword, admissionYear, branch, section
    });
    
    await newStudent.save();
    res.status(201).send('Student registered successfully');
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   POST api/auth/register-teacher
// @desc    (DEV ONLY) Register a new teacher
router.post('/register-teacher', async (req: Request, res: Response) => {
  try {
    const { teacherId, name, email, password, branch } = req.body;
    
    let teacher = await Teacher.findOne({ email });
    if (teacher) return res.status(400).json({ message: 'Teacher already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTeacher = new Teacher({
      teacherId, name, email, password: hashedPassword, branch
    });
    
    await newTeacher.save();
    res.status(201).send('Teacher registered successfully');
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   POST api/auth/login
// @desc    Unified Login for Students and Teachers
router.post('/login', async (req: Request, res: Response) => {
  const { email, usn, password } = req.body;

  try {
    let user: IStudent | ITeacher | null = null;
    let role: 'student' | 'teacher' | null = null;
    
    // Student login (requires email AND usn)
    if (usn && usn !== 'N/A') {
      user = await Student.findOne({ email: email.toLowerCase(), usn: usn.toUpperCase() });
      role = 'student';
      console.log('Attempting to log in user as a student.');
    } 
    // Teacher login (email only, USN is 'N/A' from form)
    else {
      user = await Teacher.findOne({ email: email.toLowerCase() });
      role = 'teacher';
      console.log('Attempting to log in user as a teacher.');
    }

    // --- FIX 1: Moved validation to after user is found ---
    // First, check if a user was found at all
    if (!user) {
      console.error('User not found with provided credentials.');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Now, if it's a student, check their validity
    if (role === 'student' && !(user as IStudent).isValidStudent()) {
        console.error('Student account is no longer valid.');
        return res.status(403).json({ message: 'This student account is no longer valid.' });
    }
    // --- End of Fix 1 ---

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Password does not match.');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id, role);
    
    const { password: _, ...userData } = user.toObject();

    console.log(`User ${user.email} logged in successfully as a ${role}.`);
    res.json({ token, user: { ...userData, role } });

  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   GET api/auth/me
// @desc    Get logged in user from token
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    // --- FIX 2: Add a guard for req.user ---
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // --- End of Fix 2 ---

    let user: any;
    if (req.user.role === 'student') {
      user = await Student.findById(req.user.id).select('-password');
    } else {
      user = await Teacher.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ ...user.toObject(), role: req.user?.role });
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;