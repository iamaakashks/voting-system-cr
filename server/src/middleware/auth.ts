import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: { id: string; role: 'student' | 'teacher' };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION';
    if (jwtSecret === 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION' && process.env.NODE_ENV === 'production') {
      console.error('WARNING: Using default JWT secret in production!');
    }
    const decoded = jwt.verify(token, jwtSecret) as { user: { id: string, role: 'student' | 'teacher' } };
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error('JWT verification error:', err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};