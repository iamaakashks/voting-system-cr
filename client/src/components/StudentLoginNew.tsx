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
  <div className="relative min-h-screen flex items-center justify-center px-4 py-10 bg-[#0B0E14]">
    
    {/* Ambient background glow */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute -top-40 left-10 h-72 w-72 bg-white/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 right-10 h-80 w-80 bg-gray-500/10 rounded-full blur-[140px]" />
    </div>

    {/* Back Button */}
    <button
      onClick={onBack}
      className="absolute top-6 left-6 flex items-center gap-2 text-gray-300 hover:text-white transition"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </button>

    {/* Login Card */}
    <div className="w-full max-w-md bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-10 relative z-10">
      
      {/* Header */}
      <div className="text-center mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white mx-auto opacity-90" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zm13 8a2 2 0 11-4 0 2 2 0 014 0zM16 11a1 1 0 100 2h4a1 1 0 100-2h-4zm-1-4a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1zM6 12a1 1 0 011-1h2a1 1 0 110 2H7a1 1 0 01-1-1z" />
        </svg>

        <h1 className="text-3xl font-semibold text-white mt-4">Student Login</h1>
        <p className="text-gray-400 text-sm mt-1">Use your official college credentials</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">College Email ID</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            placeholder="2023cs_name_a@nie.ac.in"
            className={`w-full px-4 py-3 rounded-lg bg-white/[0.08] 
            text-white placeholder-gray-500 border 
            ${errors.email ? "border-red-500" : "border-white/10"} 
            focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition`}
          />
          {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
        </div>

        {/* USN */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">College USN</label>
          <input
            id="usn"
            type="text"
            value={formData.usn}
            onChange={(e) => handleInputChange("usn", e.target.value.toUpperCase())}
            placeholder="4NI23CS001"
            className={`w-full px-4 py-3 rounded-lg bg-white/[0.08] 
            text-white placeholder-gray-500 border 
            ${errors.usn ? "border-red-500" : "border-white/10"} 
            focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition`}
          />
          {errors.usn && <p className="text-red-400 text-xs mt-1">{errors.usn}</p>}
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange("password", e.target.value)}
              placeholder="••••••••"
              className={`w-full px-4 py-3 pr-10 rounded-lg bg-white/[0.08] 
              text-white placeholder-gray-500 border 
              ${errors.password ? "border-red-500" : "border-white/10"} 
              focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition`}
            />

            {/* Show/Hide */}
            {formData.password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            )}
          </div>

          {/* Password Strength */}
          {formData.password && (
            <div className="mt-2 flex items-center space-x-2">
              <div className="flex-1 bg-gray-700 h-2 rounded-full">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${(passwordStrength.score / 4) * 100}%`,
                    backgroundColor: passwordStrength.color,
                  }}
                />
              </div>
              <span className="text-xs text-gray-400">{passwordStrength.label}</span>
            </div>
          )}

          {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2 mt-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange("rememberMe", e.target.checked)}
            className="h-4 w-4 rounded bg-gray-700 border-gray-500 focus:ring-white"
          />
          <label className="text-sm text-gray-300">Remember me for 7 days</label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 mt-3 rounded-lg bg-white text-black font-semibold 
          hover:bg-gray-200 transition disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Login as Student"}
        </button>

      </form>
    </div>
  </div>
);

};

export default StudentLogin;
