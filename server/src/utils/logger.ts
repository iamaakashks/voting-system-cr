/**
 * Security Event Logger
 * Logs authentication and security-related events
 */

export enum SecurityEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  email?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
  details?: any;
}

class SecurityLogger {
  private events: SecurityEvent[] = [];
  private maxEvents: number = 1000; // Keep last 1000 events in memory

  /**
   * Log a security event
   */
  log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const fullEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Console log for development
    const logLevel = this.getLogLevel(event.type);
    const message = this.formatLogMessage(fullEvent);

    switch (logLevel) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      default:
        console.log(message);
    }

    // In production, you would send this to a logging service
    // e.g., Winston, Sentry, CloudWatch, etc.
  }

  /**
   * Get log level based on event type
   */
  private getLogLevel(type: SecurityEventType): 'info' | 'warn' | 'error' {
    switch (type) {
      case SecurityEventType.LOGIN_FAILED:
      case SecurityEventType.TOKEN_INVALID:
      case SecurityEventType.UNAUTHORIZED_ACCESS:
      case SecurityEventType.ACCOUNT_LOCKED:
        return 'error';
      case SecurityEventType.RATE_LIMIT_EXCEEDED:
      case SecurityEventType.TOKEN_EXPIRED:
        return 'warn';
      default:
        return 'info';
    }
  }

  /**
   * Format log message
   */
  private formatLogMessage(event: SecurityEvent): string {
    const parts = [
      `[SECURITY]`,
      `[${event.type}]`,
      event.email ? `Email: ${event.email}` : '',
      event.userId ? `UserID: ${event.userId}` : '',
      event.ip ? `IP: ${event.ip}` : '',
      event.details ? `Details: ${JSON.stringify(event.details)}` : '',
    ].filter(Boolean);

    return parts.join(' | ');
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): SecurityEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: SecurityEventType, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string, limit: number = 100): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  /**
   * Clear all events (for testing)
   */
  clear(): void {
    this.events = [];
  }
}

// Export singleton instance
export const securityLogger = new SecurityLogger();
