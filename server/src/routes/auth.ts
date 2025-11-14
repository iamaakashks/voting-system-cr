import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Teacher, { ITeacher } from '../models/Teacher';
import { protect, AuthRequest } from '../middleware/auth';
import { findStudentByEmailAndUSN, findStudentModelById, getStudentModel } from '../utils/getStudentModel';

const router = express.Router();

// Helper to generate JWT
const generateToken = (id: string, role: 'student' | 'teacher') => {
  const jwtSecret = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION';
  if (jwtSecret === 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION' && process.env.NODE_ENV === 'production') {
    console.error('WARNING: Using default JWT secret in production!');
  }
  return jwt.sign({ user: { id, role } }, jwtSecret, { expiresIn: '1d' });
};

// @route   POST api/auth/register-student
// @desc    (DEV ONLY) Register a new student
router.post('/register-student', async (req: Request, res: Response) => {
  try {
    const { usn, name, email, password, admissionYear, branch, section } = req.body;
    
    if (!admissionYear || ![2022, 2023, 2024, 2025].includes(admissionYear)) {
      return res.status(400).json({ message: 'Invalid admission year. Must be 2022, 2023, 2024, or 2025.' });
    }

    const StudentModel = getStudentModel(admissionYear);
    
    let student = await StudentModel.findOne({ email });
    if (student) return res.status(400).json({ message: 'Student already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new StudentModel({
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
    let user: any | null = null;
    let role: 'student' | 'teacher' | null = null;
    
    // Student login (requires email AND usn)
    if (usn && usn !== 'N/A') {
      const result = await findStudentByEmailAndUSN(email, usn);
      if (result) {
        user = result.student;
        role = 'student';
      }
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
    if (role === 'student' && user.isValidStudent && !user.isValidStudent()) {
        console.error('Student account is no longer valid.');
        return res.status(403).json({ message: 'This student account is no longer valid.' });
    }
    // --- End of Fix 1 ---

    // Ensure role is not null before proceeding
    if (!role) {
      console.error('Role is null, cannot generate token.');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

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
    console.error('Login error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'An error occurred during login. Please try again.' 
      : err.message || 'Internal server error';
    res.status(500).json({ message: 'Server Error: ' + errorMessage });
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
      const result = await findStudentModelById(req.user.id);
      if (!result) {
        return res.status(404).json({ message: 'Student not found' });
      }
      user = result.student;
      // Remove password from user object
      const userObj = user.toObject();
      delete userObj.password;
      user = userObj;
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