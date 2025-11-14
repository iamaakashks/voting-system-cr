/**
 * Password Strength Checker
 * Evaluates password strength and provides feedback
 */

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string[];
  isValid: boolean;
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
}

/**
 * Check password strength
 */
export const checkPasswordStrength = (password: string): PasswordStrength => {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return {
      score: 0,
      feedback: ['Password is required'],
      isValid: false,
      label: 'Very Weak',
      color: '#ef4444',
    };
  }

  // Length check
  if (password.length >= 8) {
    score++;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }

  if (password.length >= 12) {
    score++;
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add lowercase letters');
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score++;
  } else {
    feedback.push('Add uppercase letters');
  }

  // Number check
  if (/[0-9]/.test(password)) {
    score++;
  } else {
    feedback.push('Add numbers');
  }

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score++;
  } else {
    feedback.push('Add special characters (!@#$%^&*)');
  }

  // Common patterns check
  const commonPatterns = [
    /^123456/,
    /^password/i,
    /^qwerty/i,
    /^abc123/i,
    /^111111/,
    /^letmein/i,
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    feedback.push('Avoid common passwords');
  }

  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Avoid repeating characters');
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.floor(score / 1.5));

  // Determine label and color
  let label: PasswordStrength['label'];
  let color: string;
  let isValid: boolean;

  switch (normalizedScore) {
    case 0:
      label = 'Very Weak';
      color = '#ef4444'; // red
      isValid = false;
      break;
    case 1:
      label = 'Weak';
      color = '#f97316'; // orange
      isValid = false;
      break;
    case 2:
      label = 'Fair';
      color = '#eab308'; // yellow
      isValid = true;
      break;
    case 3:
      label = 'Good';
      color = '#84cc16'; // lime
      isValid = true;
      break;
    case 4:
      label = 'Strong';
      color = '#22c55e'; // green
      isValid = true;
      break;
    default:
      label = 'Very Weak';
      color = '#ef4444';
      isValid = false;
  }

  return {
    score: normalizedScore,
    feedback: feedback.length > 0 ? feedback : ['Password looks good!'],
    isValid,
    label,
    color,
  };
};

/**
 * Get password requirements
 */
export const getPasswordRequirements = (): string[] => {
  return [
    'At least 8 characters long',
    'Contains uppercase letters (A-Z)',
    'Contains lowercase letters (a-z)',
    'Contains numbers (0-9)',
    'Contains special characters (!@#$%^&*)',
  ];
};
