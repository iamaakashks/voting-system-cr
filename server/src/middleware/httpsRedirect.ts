/**
 * HTTPS Redirect Middleware
 * 
 * Redirects HTTP requests to HTTPS in production environment.
 * This ensures all traffic is encrypted.
 * 
 * Usage: app.use(enforceHTTPS);
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to enforce HTTPS in production
 */
export const enforceHTTPS = (req: Request, res: Response, next: NextFunction) => {
  // Only enforce HTTPS in production
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already secure
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    return next();
  }

  // Redirect to HTTPS
  const httpsUrl = `https://${req.headers.host}${req.url}`;
  console.log(`🔒 Redirecting to HTTPS: ${httpsUrl}`);
  res.redirect(301, httpsUrl);
};

/**
 * Middleware to set Strict-Transport-Security header
 * (Already handled by helmet HSTS, but can be used independently)
 */
export const setHSTSHeader = (req: Request, res: Response, next: NextFunction) => {
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};
