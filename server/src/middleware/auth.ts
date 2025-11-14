import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { tokenBlacklist } from '../utils/tokenBlacklist';
import { securityLogger, SecurityEventType } from '../utils/logger';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: { id: string; role: 'student' | 'teacher' };
}

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
 * Authentication middleware - protects routes requiring authentication
 */
export const protect = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  const ip = getClientIp(req);
  const userAgent = req.header('User-Agent') || 'unknown';

  // Check if token is provided
  if (!token) {
    securityLogger.log({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      ip,
      userAgent,
      details: { reason: 'No token provided', path: req.path },
    });
    return res.status(401).json({ 
      message: 'No token, authorization denied',
      code: 'NO_TOKEN'
    });
  }

  // Check if token is blacklisted (logged out)
  if (tokenBlacklist.isBlacklisted(token)) {
    securityLogger.log({
      type: SecurityEventType.UNAUTHORIZED_ACCESS,
      ip,
      userAgent,
      details: { reason: 'Token blacklisted', path: req.path },
    });
    return res.status(401).json({ 
      message: 'Token has been invalidated. Please login again.',
      code: 'TOKEN_BLACKLISTED'
    });
  }

  try {
    // Verify JWT secret is set properly
    const jwtSecret = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION';
    if (jwtSecret === 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION') {
      if (process.env.NODE_ENV === 'production') {
        console.error('CRITICAL: Using default JWT secret in production!');
        throw new Error('Server configuration error');
      }
      console.warn('WARNING: Using default JWT secret in development');
    }

    // Verify and decode token
    const decoded = jwt.verify(token, jwtSecret) as { 
      user: { id: string; role: 'student' | 'teacher' };
      iat: number;
      exp: number;
    };

    // Check token expiration explicitly
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      securityLogger.log({
        type: SecurityEventType.TOKEN_EXPIRED,
        userId: decoded.user.id,
        ip,
        userAgent,
        details: { expiredAt: new Date(decoded.exp * 1000) },
      });
      return res.status(401).json({ 
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Attach user to request
    req.user = decoded.user;
    
    next();
  } catch (err: any) {
    // Handle different JWT errors
    let message = 'Token is not valid';
    let code = 'TOKEN_INVALID';

    if (err.name === 'TokenExpiredError') {
      message = 'Token has expired. Please login again.';
      code = 'TOKEN_EXPIRED';
      securityLogger.log({
        type: SecurityEventType.TOKEN_EXPIRED,
        ip,
        userAgent,
        details: { error: err.message },
      });
    } else if (err.name === 'JsonWebTokenError') {
      message = 'Invalid token. Please login again.';
      code = 'TOKEN_INVALID';
      securityLogger.log({
        type: SecurityEventType.TOKEN_INVALID,
        ip,
        userAgent,
        details: { error: err.message },
      });
    } else if (err.name === 'NotBeforeError') {
      message = 'Token not yet valid.';
      code = 'TOKEN_NOT_ACTIVE';
    } else {
      console.error('JWT verification error:', err);
      securityLogger.log({
        type: SecurityEventType.TOKEN_INVALID,
        ip,
        userAgent,
        details: { error: err.message, name: err.name },
      });
    }

    res.status(401).json({ message, code });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 * Useful for routes that work differently for authenticated vs unauthenticated users
 */
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return next();
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || 'YOUR_JWT_SECRET_CHANGE_IN_PRODUCTION';
    const decoded = jwt.verify(token, jwtSecret) as { 
      user: { id: string; role: 'student' | 'teacher' };
    };
    req.user = decoded.user;
  } catch (err) {
    // Silently fail for optional auth
    console.log('Optional auth failed, continuing without user');
  }

  next();
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: ('student' | 'teacher')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authorized',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      const ip = getClientIp(req);
      securityLogger.log({
        type: SecurityEventType.UNAUTHORIZED_ACCESS,
        userId: req.user.id,
        ip,
        userAgent: req.header('User-Agent') || 'unknown',
        details: { 
          requiredRoles: roles, 
          userRole: req.user.role,
          path: req.path 
        },
      });

      return res.status(403).json({ 
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};
