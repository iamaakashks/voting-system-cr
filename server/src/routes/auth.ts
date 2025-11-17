import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import Teacher, { ITeacher } from '../models/Teacher';
import { protect, AuthRequest } from '../middleware/auth';
import { findStudentByEmailAndUSN, findStudentModelById, getStudentModel } from '../utils/getStudentModel';
import { tokenBlacklist } from '../utils/tokenBlacklist';
import { loginRateLimiter } from '../utils/rateLimiter';
import { securityLogger, SecurityEventType } from '../utils/logger';
import { 
  validateLoginCredentials, 
  validateRegistrationData,
  sanitizeString 
} from '../utils/validation';

const router = express.Router();

/**
 * Get client IP address from request
 */
const getClientIp = (req: Request): string => {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    req.socket.remoteAddress ||
    'unknown'
  );
};

/**
 * Helper to generate JWT with configurable expiration
 */
const generateToken = (
  id: string,
  role: 'student' | 'teacher',
  expiresIn: string = '24h'
) => {
  const jwtSecret = process.env.JWT_SECRET as string;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not set");
  }

  return jwt.sign(
    { user: { id, role } },
    jwtSecret as string,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || expiresIn
    }
  );
};

import Student from '../models/Student';
// ... imports

// @route   POST api/auth/register-student
// @desc    (DEV ONLY) Register a new student
router.post('/register-student', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  
  try {
    const { usn, name, email, password, admissionYear, branch, section, gender } = req.body;
    
    // Validate input
    const validation = validateRegistrationData({
      email,
      usn,
      password,
      name,
      branch,
      section,
      admissionYear,
    });

    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedUSN = usn.toUpperCase().trim();

    // Check if student already exists in the single collection
    let student = await Student.findOne({ 
      $or: [{ email: sanitizedEmail }, { usn: sanitizedUSN }]
    });
    
    if (student) {
      return res.status(400).json({ 
        message: student.email === sanitizedEmail 
          ? 'A student with this email already exists' 
          : 'A student with this USN already exists'
      });
    }

    // Hash password with higher cost factor for better security
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      usn: sanitizedUSN,
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      admissionYear,
      branch: branch.toLowerCase(),
      section: section.toLowerCase(),
      gender: gender?.toLowerCase(),
    });
    
    await newStudent.save();

    securityLogger.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId: newStudent.id,
      email: sanitizedEmail,
      ip,
      userAgent: req.header('User-Agent') || 'unknown',
      details: { action: 'student_registration' },
    });

    res.status(201).json({ 
      message: 'Student registered successfully',
      student: {
        id: newStudent.id,
        name: newStudent.name,
        email: newStudent.email,
        usn: newStudent.usn,
      }
    });
  } catch (err: any) {
    console.error('Student registration error:', err);
    securityLogger.log({
      type: SecurityEventType.LOGIN_FAILED,
      ip,
      userAgent: req.header('User-Agent') || 'unknown',
      details: { action: 'student_registration', error: err.message },
    });
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   POST api/auth/register-teacher
// @desc    (DEV ONLY) Register a new teacher
router.post('/register-teacher', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  
  try {
    const { teacherId, name, email, password, branch } = req.body;
    
    // Validate input
    const validation = validateRegistrationData({
      email,
      password,
      name,
      branch,
    });

    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedTeacherId = teacherId.toUpperCase().trim();
    
    // Check if teacher already exists
    let teacher = await Teacher.findOne({ 
      $or: [{ email: sanitizedEmail }, { teacherId: sanitizedTeacherId }]
    });
    
    if (teacher) {
      return res.status(400).json({ 
        message: teacher.email === sanitizedEmail 
          ? 'A teacher with this email already exists' 
          : 'A teacher with this ID already exists'
      });
    }

    // Hash password with higher cost factor
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newTeacher = new Teacher({
      teacherId: sanitizedTeacherId,
      name: sanitizedName,
      email: sanitizedEmail,
      password: hashedPassword,
      branch: branch.toLowerCase(),
    });
    
    await newTeacher.save();

    securityLogger.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId: newTeacher.id,
      email: sanitizedEmail,
      ip,
      userAgent: req.header('User-Agent') || 'unknown',
      details: { action: 'teacher_registration' },
    });

    res.status(201).json({ 
      message: 'Teacher registered successfully',
      teacher: {
        id: newTeacher.id,
        name: newTeacher.name,
        email: newTeacher.email,
        teacherId: newTeacher.teacherId,
      }
    });
  } catch (err: any) {
    console.error('Teacher registration error:', err);
    securityLogger.log({
      type: SecurityEventType.LOGIN_FAILED,
      ip,
      userAgent: req.header('User-Agent') || 'unknown',
      details: { action: 'teacher_registration', error: err.message },
    });
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

// @route   POST api/auth/login
// @desc    Unified Login for Students and Teachers with rate limiting
router.post('/login', async (req: Request, res: Response) => {
  const { email, usn, password, rememberMe } = req.body;
  const ip = getClientIp(req);
  const userAgent = req.header('User-Agent') || 'unknown';
  const identifier = email.toLowerCase(); // Use email as identifier for rate limiting

  try {
    // Validate input
    const validation = validateLoginCredentials(email, usn, password);
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validation.errors 
      });
    }

    // Check if account is locked due to too many failed attempts
    if (loginRateLimiter.isLockedOut(identifier)) {
      const remainingTime = loginRateLimiter.getRemainingLockoutTime(identifier);
      
      securityLogger.log({
        type: SecurityEventType.ACCOUNT_LOCKED,
        email: identifier,
        ip,
        userAgent,
        details: { remainingLockoutTime: remainingTime },
      });

      return res.status(429).json({ 
        message: `Account temporarily locked due to too many failed login attempts. Please try again in ${Math.ceil(remainingTime / 60)} minutes.`,
        code: 'ACCOUNT_LOCKED',
        remainingTime,
      });
    }

    let user: any | null = null;
    let role: 'student' | 'teacher' | null = null;
    
    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedUSN = usn ? usn.toUpperCase().trim() : 'N/A';
    
    // Student login (requires email AND usn)
    if (sanitizedUSN && sanitizedUSN !== 'N/A') {
      const result = await findStudentByEmailAndUSN(sanitizedEmail, sanitizedUSN);
      if (result) {
        user = result.student;
        role = 'student';
      }
      console.log('Attempting to log in user as a student.');
    } 
    // Teacher login (email only, USN is 'N/A' from form)
    else {
      user = await Teacher.findOne({ email: sanitizedEmail });
      role = 'teacher';
      console.log('Attempting to log in user as a teacher.');
    }

    // Check if user was found
    if (!user) {
      console.error('User not found with provided credentials.');
      
      // Record failed attempt
      loginRateLimiter.recordFailedAttempt(identifier);
      const attemptInfo = loginRateLimiter.getAttemptInfo(identifier);
      
      securityLogger.log({
        type: SecurityEventType.LOGIN_FAILED,
        email: identifier,
        ip,
        userAgent,
        details: { 
          reason: 'User not found',
          remainingAttempts: attemptInfo.remainingAttempts,
        },
      });

      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: attemptInfo.remainingAttempts,
      });
    }

    // Check if student account is still valid
    if (role === 'student' && user.isValidStudent && !user.isValidStudent()) {
      console.error('Student account is no longer valid.');
      
      securityLogger.log({
        type: SecurityEventType.LOGIN_FAILED,
        userId: user.id,
        email: sanitizedEmail,
        ip,
        userAgent,
        details: { reason: 'Account expired' },
      });

      return res.status(403).json({ 
        message: 'This student account is no longer valid.',
        code: 'ACCOUNT_EXPIRED',
      });
    }

    // Ensure role is not null
    if (!role) {
      console.error('Role is null, cannot generate token.');
      return res.status(400).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.error('Password does not match.');
      
      // Record failed attempt
      loginRateLimiter.recordFailedAttempt(identifier);
      const attemptInfo = loginRateLimiter.getAttemptInfo(identifier);
      
      securityLogger.log({
        type: SecurityEventType.LOGIN_FAILED,
        userId: user.id,
        email: sanitizedEmail,
        ip,
        userAgent,
        details: { 
          reason: 'Invalid password',
          remainingAttempts: attemptInfo.remainingAttempts,
        },
      });

      return res.status(401).json({ 
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        remainingAttempts: attemptInfo.remainingAttempts,
      });
    }

    // Successful login - reset failed attempts
    loginRateLimiter.resetAttempts(identifier);

    // Generate token with appropriate expiration
    const tokenExpiry = rememberMe ? '7d' : '24h';
    const token = generateToken(user.id, role, tokenExpiry);
    
    // Remove password from response
    const { password: _, ...userData } = user.toObject();

    securityLogger.log({
      type: SecurityEventType.LOGIN_SUCCESS,
      userId: user.id,
      email: sanitizedEmail,
      ip,
      userAgent,
      details: { role, rememberMe: !!rememberMe },
    });

    console.log(`User ${user.email} logged in successfully as a ${role}.`);
    
    res.json({ 
      token, 
      user: { ...userData, role },
      expiresIn: rememberMe ? '7 days' : '24 hours',
    });

  } catch (err: any) {
    console.error('Login error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });

    securityLogger.log({
      type: SecurityEventType.LOGIN_FAILED,
      email: identifier,
      ip,
      userAgent,
      details: { error: err.message, stack: err.stack },
    });

    const errorMessage = process.env.NODE_ENV === 'production' 
      ? 'An error occurred during login. Please try again.' 
      : err.message || 'Internal server error';
    
    res.status(500).json({ 
      message: 'Server Error: ' + errorMessage,
      code: 'SERVER_ERROR',
    });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user and blacklist token
// @access  Private
router.post('/logout', protect, async (req: AuthRequest, res: Response) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const ip = getClientIp(req);
  const userAgent = req.header('User-Agent') || 'unknown';

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (token) {
      // Decode token to get expiration
      const jwtSecret = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION';
      const decoded = jwt.decode(token) as { exp: number } | null;
      
      if (decoded && decoded.exp) {
        const expiresAt = new Date(decoded.exp * 1000);
        tokenBlacklist.add(token, expiresAt);
      }
    }

    securityLogger.log({
      type: SecurityEventType.LOGOUT,
      userId: req.user.id,
      ip,
      userAgent,
      details: { role: req.user.role },
    });

    res.json({ 
      message: 'Logged out successfully',
      code: 'LOGOUT_SUCCESS',
    });
  } catch (err: any) {
    console.error('Logout error:', err);
    res.status(500).json({ 
      message: 'Server Error: ' + err.message,
      code: 'SERVER_ERROR',
    });
  }
});

// @route   GET api/auth/me
// @desc    Get logged in user from token
// @access  Private
router.get('/me', protect, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    let user: any;
    if (req.user.role === 'student') {
      const result = await findStudentModelById(req.user.id);
      if (!result) {
        return res.status(404).json({ message: 'Student not found' });
      }
      user = result.student.toObject();
      delete user.password;
    } else {
      user = await Teacher.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ ...user, role: req.user?.role });
  } catch (err: any) {
    res.status(500).json({ message: 'Server Error: ' + err.message });
  }
});

export default router;
