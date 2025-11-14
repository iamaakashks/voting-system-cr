/**
 * Input Validation Schemas and Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  // Check for NIE email format
  const nieEmailRegex = /@nie\.ac\.in$/i;
  if (!nieEmailRegex.test(email)) {
    errors.push('Email must be from nie.ac.in domain');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate USN format
 */
export const validateUSN = (usn: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!usn || usn === 'N/A') {
    return { isValid: true, errors }; // USN is optional for teachers
  }

  // USN format: 4NI23CS001 (4 + NI + YY + BRANCH + NUMBER)
  const usnRegex = /^4NI\d{2}(CS|IS|CI)\d{3}$/i;
  if (!usnRegex.test(usn)) {
    errors.push('Invalid USN format. Expected format: 4NI23CS001');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate branch
 */
export const validateBranch = (branch: string): ValidationResult => {
  const errors: string[] = [];
  const validBranches = ['cs', 'ci', 'is'];
  
  if (!branch) {
    errors.push('Branch is required');
    return { isValid: false, errors };
  }

  if (!validBranches.includes(branch.toLowerCase())) {
    errors.push('Invalid branch. Must be one of: cs, ci, is');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate section
 */
export const validateSection = (section: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!section) {
    errors.push('Section is required');
    return { isValid: false, errors };
  }

  const sectionRegex = /^[a-z]$/i;
  if (!sectionRegex.test(section)) {
    errors.push('Section must be a single letter (a-z)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate admission year
 */
export const validateAdmissionYear = (year: number): ValidationResult => {
  const errors: string[] = [];
  const validYears = [2022, 2023, 2024, 2025];
  
  if (!year) {
    errors.push('Admission year is required');
    return { isValid: false, errors };
  }

  if (!validYears.includes(year)) {
    errors.push('Invalid admission year. Must be one of: 2022, 2023, 2024, 2025');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Validate login credentials
 */
export const validateLoginCredentials = (
  email: string,
  usn: string,
  password: string
): ValidationResult => {
  const errors: string[] = [];

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  const usnValidation = validateUSN(usn);
  if (!usnValidation.isValid) {
    errors.push(...usnValidation.errors);
  }

  if (!password) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate registration data
 */
export const validateRegistrationData = (data: {
  email: string;
  usn?: string;
  password: string;
  name: string;
  branch: string;
  section?: string;
  admissionYear?: number;
}): ValidationResult => {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.push(...emailValidation.errors);
  }

  if (data.usn) {
    const usnValidation = validateUSN(data.usn);
    if (!usnValidation.isValid) {
      errors.push(...usnValidation.errors);
    }
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.push(...passwordValidation.errors);
  }

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  const branchValidation = validateBranch(data.branch);
  if (!branchValidation.isValid) {
    errors.push(...branchValidation.errors);
  }

  if (data.section) {
    const sectionValidation = validateSection(data.section);
    if (!sectionValidation.isValid) {
      errors.push(...sectionValidation.errors);
    }
  }

  if (data.admissionYear) {
    const yearValidation = validateAdmissionYear(data.admissionYear);
    if (!yearValidation.isValid) {
      errors.push(...yearValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
