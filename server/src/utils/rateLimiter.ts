/**
 * Rate Limiter for Login Attempts
 * Tracks failed login attempts and implements account lockout
 */

interface LoginAttempt {
  count: number;
  firstAttempt: Date;
  lastAttempt: Date;
  lockedUntil?: Date;
}

class RateLimiter {
  private attempts: Map<string, LoginAttempt>;
  private maxAttempts: number;
  private windowMs: number; // Time window in milliseconds
  private lockoutDurationMs: number; // Lockout duration in milliseconds
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000, // 15 minutes
    lockoutDurationMs: number = 30 * 60 * 1000 // 30 minutes
  ) {
    this.attempts = new Map();
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
    this.lockoutDurationMs = lockoutDurationMs;

    // Clean up old attempts every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Record a failed login attempt
   */
  recordFailedAttempt(identifier: string): void {
    const now = new Date();
    const attempt = this.attempts.get(identifier);

    if (!attempt) {
      // First failed attempt
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      });
    } else {
      // Check if we're still within the time window
      const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
      
      if (timeSinceFirst > this.windowMs) {
        // Reset the counter if outside the window
        this.attempts.set(identifier, {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
        });
      } else {
        // Increment the counter
        attempt.count++;
        attempt.lastAttempt = now;

        // Lock the account if max attempts exceeded
        if (attempt.count >= this.maxAttempts) {
          attempt.lockedUntil = new Date(now.getTime() + this.lockoutDurationMs);
        }

        this.attempts.set(identifier, attempt);
      }
    }
  }

  /**
   * Reset attempts for an identifier (e.g., after successful login)
   */
  resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Check if an identifier is currently locked out
   */
  isLockedOut(identifier: string): boolean {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || !attempt.lockedUntil) {
      return false;
    }

    const now = new Date();
    
    // Check if lockout period has expired
    if (now > attempt.lockedUntil) {
      // Reset the attempts
      this.resetAttempts(identifier);
      return false;
    }

    return true;
  }

  /**
   * Get remaining lockout time in seconds
   */
  getRemainingLockoutTime(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt || !attempt.lockedUntil) {
      return 0;
    }

    const now = new Date();
    const remaining = attempt.lockedUntil.getTime() - now.getTime();
    
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  }

  /**
   * Get number of remaining attempts before lockout
   */
  getRemainingAttempts(identifier: string): number {
    const attempt = this.attempts.get(identifier);
    
    if (!attempt) {
      return this.maxAttempts;
    }

    const now = new Date();
    const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
    
    // If outside the window, return max attempts
    if (timeSinceFirst > this.windowMs) {
      return this.maxAttempts;
    }

    return Math.max(0, this.maxAttempts - attempt.count);
  }

  /**
   * Get attempt info for an identifier
   */
  getAttemptInfo(identifier: string): {
    attempts: number;
    remainingAttempts: number;
    isLockedOut: boolean;
    lockoutTimeRemaining: number;
  } {
    return {
      attempts: this.attempts.get(identifier)?.count || 0,
      remainingAttempts: this.getRemainingAttempts(identifier),
      isLockedOut: this.isLockedOut(identifier),
      lockoutTimeRemaining: this.getRemainingLockoutTime(identifier),
    };
  }

  /**
   * Clean up expired attempts
   */
  private cleanup(): void {
    const now = new Date();
    const expiredIdentifiers: string[] = [];

    this.attempts.forEach((attempt, identifier) => {
      const timeSinceFirst = now.getTime() - attempt.firstAttempt.getTime();
      
      // Remove if outside window and not locked, or if lockout has expired
      if (timeSinceFirst > this.windowMs && !attempt.lockedUntil) {
        expiredIdentifiers.push(identifier);
      } else if (attempt.lockedUntil && now > attempt.lockedUntil) {
        expiredIdentifiers.push(identifier);
      }
    });

    expiredIdentifiers.forEach(identifier => this.attempts.delete(identifier));
    
    if (expiredIdentifiers.length > 0) {
      console.log(`Cleaned up ${expiredIdentifiers.length} expired rate limit entries`);
    }
  }

  /**
   * Get total number of tracked identifiers
   */
  size(): number {
    return this.attempts.size;
  }

  /**
   * Clear all attempts (for testing)
   */
  clear(): void {
    this.attempts.clear();
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Export singleton instance
export const loginRateLimiter = new RateLimiter();
