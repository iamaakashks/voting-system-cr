import {
  validateEmail,
  validateUSN,
  validatePassword,
  validateBranch,
  validateSection,
  validateAdmissionYear,
  sanitizeString,
  validateLoginCredentials,
  validateRegistrationData,
} from './validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return valid for a correct NIE email', () => {
      const result = validateEmail('test@nie.ac.in');
      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should return invalid for an email outside the nie.ac.in domain', () => {
      const result = validateEmail('test@gmail.com');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email must be from nie.ac.in domain');
    });

    it('should return invalid for an invalid email format', () => {
      const result = validateEmail('test');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should return invalid for an empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });
  });

  describe('validateUSN', () => {
    it('should return valid for a correct USN', () => {
      const result = validateUSN('4NI23CS001');
      expect(result.isValid).toBe(true);
    });

    it('should return valid for "N/A"', () => {
      const result = validateUSN('N/A');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for an incorrect USN format', () => {
      const result = validateUSN('4NI23CS1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid USN format. Expected format: 4NI23CS001');
    });
  });

  describe('validatePassword', () => {
    it('should return valid for a strong password', () => {
      const result = validatePassword('Password@123');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for a password less than 8 characters', () => {
      const result = validatePassword('Pass@12');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should return invalid for a password without a lowercase letter', () => {
        const result = validatePassword('PASSWORD@123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should return invalid for a password without an uppercase letter', () => {
        const result = validatePassword('password@123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should return invalid for a password without a number', () => {
        const result = validatePassword('Password@');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should return invalid for a password without a special character', () => {
        const result = validatePassword('Password123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

    describe('validateBranch', () => {
        it('should return valid for "cs"', () => {
            const result = validateBranch('cs');
            expect(result.isValid).toBe(true);
        });

        it('should return invalid for an invalid branch', () => {
            const result = validateBranch('mech');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid branch. Must be one of: cs, ci, is');
        });
    });

    describe('validateSection', () => {
        it('should return valid for "a"', () => {
            const result = validateSection('a');
            expect(result.isValid).toBe(true);
        });

        it('should return invalid for a multi-character section', () => {
            const result = validateSection('ab');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Section must be a single letter (a-z)');
        });
    });

    describe('validateAdmissionYear', () => {
        it('should return valid for 2023', () => {
            const result = validateAdmissionYear(2023);
            expect(result.isValid).toBe(true);
        });

        it('should return invalid for an invalid year', () => {
            const result = validateAdmissionYear(2021);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Invalid admission year. Must be one of: 2022, 2023, 2024, 2025');
        });
    });

    describe('sanitizeString', () => {
        it('should remove HTML tags', () => {
            const result = sanitizeString('<p>hello</p>');
            expect(result).toBe('hello');
        });

        it('should trim whitespace', () => {
            const result = sanitizeString('  hello  ');
            expect(result).toBe('hello');
        });
    });

    describe('validateLoginCredentials', () => {
        it('should return valid for correct credentials', () => {
            const result = validateLoginCredentials('test@nie.ac.in', '4NI23CS001', 'Password@123');
            expect(result.isValid).toBe(true);
        });

        it('should return invalid for incorrect credentials', () => {
            const result = validateLoginCredentials('test@gmail.com', '4NI23CS1', '');
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBe(3);
        });
    });

    describe('validateRegistrationData', () => {
        it('should return valid for correct registration data', () => {
            const data = {
                email: 'test@nie.ac.in',
                usn: '4NI23CS001',
                password: 'Password@123',
                name: 'Test User',
                branch: 'cs',
                section: 'a',
                admissionYear: 2023
            };
            const result = validateRegistrationData(data);
            expect(result.isValid).toBe(true);
        });

        it('should return invalid for incorrect registration data', () => {
            const data = {
                email: 'test@gmail.com',
                usn: '4NI23CS1',
                password: 'pass',
                name: 'T',
                branch: 'mech',
                section: 'ab',
                admissionYear: 2021
            };
            const result = validateRegistrationData(data);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });
    });
});
