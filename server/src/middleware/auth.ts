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
    // IMPORTANT: Use a strong, secret string
    const decoded = jwt.verify(token, 'YOUR_JWT_SECRET') as { user: { id: string, role: 'student' | 'teacher' } };
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};