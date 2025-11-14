/**
 * Client-side Input Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Check for NIE email format
  const nieEmailRegex = /@nie\.ac\.in$/i;
  if (!nieEmailRegex.test(email)) {
    return { isValid: false, error: 'Email must be from nie.ac.in domain' };
  }

  return { isValid: true };
};

/**
 * Validate USN format
 */
export const validateUSN = (usn: string): ValidationResult => {
  if (!usn || usn === 'N/A') {
    return { isValid: true }; // USN is optional for teachers
  }

  // USN format: 4NI23CS001 (4 + NI + YY + BRANCH + NUMBER)
  const usnRegex = /^4NI\d{2}(CS|IS|CI)\d{3}$/i;
  if (!usnRegex.test(usn)) {
    return { isValid: false, error: 'Invalid USN format (e.g., 4NI23CS001)' };
  }

  return { isValid: true };
};

/**
 * Validate password (basic check)
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }

  return { isValid: true };
};

/**
 * Sanitize string input (remove HTML tags and trim)
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove any HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Validate name
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' };
  }

  // Check for valid characters (letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name)) {
    return { isValid: false, error: 'Name contains invalid characters' };
  }

  return { isValid: true };
};

/**
 * Check if input contains potentially dangerous content
 */
export const containsDangerousContent = (input: string): boolean => {
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  return dangerousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validate all login fields
 */
export const validateLoginForm = (
  email: string,
  usn: string,
  password: string
): { isValid: boolean; errors: { [key: string]: string } } => {
  const errors: { [key: string]: string } = {};

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid && emailValidation.error) {
    errors.email = emailValidation.error;
  }

  const usnValidation = validateUSN(usn);
  if (!usnValidation.isValid && usnValidation.error) {
    errors.usn = usnValidation.error;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid && passwordValidation.error) {
    errors.password = passwordValidation.error;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
