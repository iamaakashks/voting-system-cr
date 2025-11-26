import React, { useState, useEffect, useCallback } from 'react';
import { LoginCredentials } from '../services/api';
import { validateEmail, validateUSN, validatePassword, validateLoginForm } from '../utils/validation';
import { checkPasswordStrength } from '../utils/passwordStrength';
import { useTheme } from '../contexts/ThemeContext';
import { User, Eye, EyeOff, ArrowLeft, LogIn, Sparkles } from 'lucide-react';

interface StudentLoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  onBack: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin, onBack }) => {
  const { theme } = useTheme();
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-[#060606] dark:via-[#121212] dark:to-[#242424] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <button 
          onClick={onBack} 
          className="mb-6 text-gray-700 dark:text-gray-300 font-semibold hover:text-[#b4a9e6] dark:hover:text-[#b4a9e6] transition-colors flex items-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        
        <div className="bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-[#434546]">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] rounded-2xl shadow-lg mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent mb-2">
              Student Login
            </h1>
            <p className="text-gray-600 dark:text-gray-400">Login with your college credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                College Email ID
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="2023cs_yourname_a@nie.ac.in"
                className={`appearance-none block w-full px-4 py-3 border ${
                  errors.email ? 'border-red-500' : 'border-gray-300 dark:border-[#434546]'
                } rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 
                focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent 
                bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            
            {/* USN Field */}
            <div>
              <label htmlFor="usn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                College USN
              </label>
              <input
                id="usn"
                name="usn"
                type="text"
                autoComplete="off"
                required
                value={formData.usn}
                onChange={(e) => handleInputChange('usn', e.target.value.toUpperCase())}
                placeholder="4NI23CS001"
                className={`appearance-none block w-full px-4 py-3 border ${
                  errors.usn ? 'border-red-500' : 'border-gray-300 dark:border-[#434546]'
                } rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 
                focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent 
                bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all uppercase`}
              />
              {errors.usn && (
                <p className="mt-1 text-sm text-red-500">{errors.usn}</p>
              )}
            </div>
            
            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`appearance-none block w-full px-4 py-3 pr-12 border ${
                    errors.password ? 'border-red-500' : 'border-gray-300 dark:border-[#434546]'
                  } rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 
                  focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent 
                  bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all`}
                />
                {formData.password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#b4a9e6] transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 text-[#b4a9e6] focus:ring-[#b4a9e6] border-gray-300 dark:border-[#434546] rounded"
              />
              <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-lg text-base font-semibold text-white bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] hover:from-[#6d7382] hover:to-[#b4a9e6] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#b4a9e6] disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Login as Student
                </>
              )}
            </button>
          </form>
          
          {/* Quick Login Demo Buttons */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-[#434546]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-4 h-4" />
                  Quick Demo Login
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleQuickLogin('2023cs_myrajoshi_a@nie.ac.in', '4NI23CS001', 'password123')} 
                className="text-center py-2 px-3 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
              >
                CS-A Student
              </button>
              <button 
                onClick={() => handleQuickLogin('2023is_lavanyanaidu_a@nie.ac.in', '4NI23IS001', 'password123')} 
                className="text-center py-2 px-3 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
              >
                IS-A Student
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
