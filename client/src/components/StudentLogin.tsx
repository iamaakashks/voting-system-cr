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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-4 bg-[#0B0E14] overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-10 h-72 w-72 bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-10 h-80 w-80 bg-gray-500/10 rounded-full blur-[140px]" />
      </div>

      {/* Back Button */}
      <button 
        onClick={onBack} 
        className="absolute top-6 left-6 text-sm text-gray-300 hover:text-white transition group"
      >
        ← Back
      </button>
      
      <div className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white mx-auto opacity-90" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
          </svg>
          <h1 className="text-2xl font-bold text-white mt-3 tracking-tight">
            Student Login
          </h1>
          <p className="text-gray-400 text-xs mt-1">Login with your college credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1.5">
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
              className={`block w-full px-4 py-2.5 rounded-lg bg-white/[0.08] text-white text-sm placeholder-gray-500 
              border ${errors.email ? 'border-red-500' : 'border-white/10'} 
              focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition`}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email}</p>
            )}
          </div>
          
          {/* USN Field */}
          <div>
            <label htmlFor="usn" className="block text-xs font-medium text-gray-300 mb-1.5">
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
              className={`block w-full px-4 py-2.5 rounded-lg bg-white/[0.08] text-white text-sm placeholder-gray-500 
              border ${errors.usn ? 'border-red-500' : 'border-white/10'} 
              focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition uppercase`}
            />
            {errors.usn && (
              <p className="mt-1 text-xs text-red-500">{errors.usn}</p>
            )}
          </div>
          
          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1.5">
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
                className={`block w-full px-4 py-2.5 pr-12 rounded-lg bg-white/[0.08] text-white text-sm placeholder-gray-500 
                border ${errors.password ? 'border-red-500' : 'border-white/10'} 
                focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition`}
              />
              {formData.password.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
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
              className="h-3.5 w-3.5 text-[#b4a9e6] focus:ring-[#b4a9e6] border-gray-600 rounded bg-white/[0.1]"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-xs text-gray-300">
              Remember me
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-2.5 rounded-lg bg-white text-black font-bold text-sm hover:bg-gray-200 transition shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.01]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Login as Student
              </>
            )}
          </button>
        </form>
        
        {/* Quick Login Demo Buttons */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-transparent text-gray-500 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Quick Demo Login
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleQuickLogin('2023cs_myrajoshi_a@nie.ac.in', '4NI23CS001', 'password123')} 
              className="py-2 text-center rounded-lg bg-white/[0.06] border border-white/10 text-gray-300 text-xs font-medium hover:bg-white/[0.1] transition"
            >
              CS-A Student
            </button>
            <button 
              onClick={() => handleQuickLogin('2023is_lavanyanaidu_a@nie.ac.in', '4NI23IS001', 'password123')} 
              className="py-2 text-center rounded-lg bg-white/[0.06] border border-white/10 text-gray-300 text-xs font-medium hover:bg-white/[0.1] transition"
            >
              IS-A Student
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
