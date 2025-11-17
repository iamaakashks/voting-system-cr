import React, { useState, useEffect, useCallback } from 'react';
import { LoginCredentials } from '../services/api';
import { validateEmail, validateUSN, validatePassword, validateLoginForm } from '../utils/validation';
import { checkPasswordStrength } from '../utils/passwordStrength';

interface StudentLoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  onBack: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin, onBack }) => {
  const [formData, setFormData] = useState({
    email: '',
    usn: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [passwordStrength, setPasswordStrength] = useState(checkPasswordStrength(''));

  // Real-time validation
  useEffect(() => {
    const newErrors: { [key: string]: string } = {};

    if (touched.email) {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.isValid && emailValidation.error) {
        newErrors.email = emailValidation.error;
      }
    }

    if (touched.usn) {
      const usnValidation = validateUSN(formData.usn);
      if (!usnValidation.isValid && usnValidation.error) {
        newErrors.usn = usnValidation.error;
      }
    }

    if (touched.password) {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid && passwordValidation.error) {
        newErrors.password = passwordValidation.error;
      }
    }

    setErrors(newErrors);
  }, [formData, touched]);

  // Update password strength
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!touched[field]) {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  }, [touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched for validation
    setTouched({ email: true, usn: true, password: true });

    // Validate all fields
    const validation = validateLoginForm(formData.email, formData.usn, formData.password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsLoading(true);
    try {
      await onLogin({
        email: formData.email,
        usn: formData.usn,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = useCallback((email: string, usn: string, pass: string) => {
    setFormData({ email, usn, password: pass, rememberMe: false });
    setTouched({ email: true, usn: true, password: true });
    setErrors({});
    onLogin({ email, usn, password: pass });
  }, [onLogin]);

  return (
    <div className="flex flex-col items-center justify-center -mt-8">
      <button onClick={onBack} className="self-start mb-4 text-white font-semibold hover:text-gray-300 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zm13 8a2 2 0 11-4 0 2 2 0 014 0zM16 11a1 1 0 100 2h4a1 1 0 100-2h-4zm-1-4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM6 12a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1z" />
            </svg>
           <h1 className="text-3xl font-bold text-white mt-4">Student Login</h1>
           <p className="text-gray-400 mt-2">Login with your college credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              College Email ID
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="2023cs_yourname_a@nie.ac.in"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>
          
           <div>
            <label htmlFor="usn" className="block text-sm font-medium text-gray-300">
              College USN
            </label>
            <div className="mt-1">
              <input
                id="usn"
                name="usn"
                type="text"
                autoComplete="off"
                required
                value={formData.usn}
                onChange={(e) => handleInputChange('usn', e.target.value.toUpperCase())}
                placeholder="4NI23CS001"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>
          
           <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-white focus:border-white sm:text-sm bg-gray-700 text-white"
              />
              {password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m13.42 13.42L21 21M12 12l.01.01" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
            >
              Login as Student
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
};

export default StudentLogin;



