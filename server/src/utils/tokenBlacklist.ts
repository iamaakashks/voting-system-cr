/**
 * Token Blacklist for handling logout and token invalidation
 * In production, use Redis or a database for persistence
 */

interface BlacklistedToken {
  token: string;
  expiresAt: Date;
}

class TokenBlacklist {
  private blacklist: Map<string, Date>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.blacklist = new Map();
    // Clean up expired tokens every hour
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  /**
   * Add a token to the blacklist
   */
  add(token: string, expiresAt: Date): void {
    this.blacklist.set(token, expiresAt);
  }

  /**
   * Check if a token is blacklisted
   */
  isBlacklisted(token: string): boolean {
    const expiresAt = this.blacklist.get(token);
    if (!expiresAt) return false;

    // If token has expired, remove it and return false
    if (new Date() > expiresAt) {
      this.blacklist.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Remove expired tokens from blacklist
   */
  private cleanup(): void {
    const now = new Date();
    const expiredTokens: string[] = [];

    this.blacklist.forEach((expiresAt, token) => {
      if (now > expiresAt) {
        expiredTokens.push(token);
      }
    });

    expiredTokens.forEach(token => this.blacklist.delete(token));
    
    if (expiredTokens.length > 0) {
      console.log(`Cleaned up ${expiredTokens.length} expired tokens from blacklist`);
    }
  }

  /**
   * Get the size of the blacklist
   */
  size(): number {
    return this.blacklist.size;
  }

  /**
   * Clear all tokens (for testing purposes)
   */
  clear(): void {
    this.blacklist.clear();
  }

  /**
   * Stop the cleanup interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

// Export singleton instance
export const tokenBlacklist = new TokenBlacklist();
