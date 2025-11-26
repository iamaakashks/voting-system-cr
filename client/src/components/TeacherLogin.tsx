import React, { useState } from 'react';
import { LoginCredentials } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { GraduationCap, Eye, EyeOff, ArrowLeft, LogIn, Sparkles } from 'lucide-react';

interface TeacherLoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  onBack: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin, onBack }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoading(true);
      try {
        await onLogin({ email, usn: 'N/A', password });
      } catch (error) {
        // Error handling is done in parent
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleQuickLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    onLogin({ email, usn: 'N/A', password: pass });
  }

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

      <div className="text-center mb-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-white mx-auto opacity-90" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>

        <h1 className="text-3xl font-semibold text-white mt-4 tracking-tight">Teacher Login</h1>
        <p className="text-gray-400 text-sm mt-1">Use your official teacher credentials</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Teacher Email ID</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teacher_cs@nie.ac.in"
            className="w-full px-4 py-3 rounded-lg bg-white/[0.08] text-white placeholder-gray-500 
            border border-white/10 focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition"
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-300 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-10 rounded-lg bg-white/[0.08] text-white placeholder-gray-500 
              border border-white/10 focus:border-white focus:ring-1 focus:ring-white/50 outline-none transition"
            />
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            )}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-200 transition"
        >
          Login as Teacher
        </button>
      </form>

      {/* Quick Login Section */}
      <div className="mt-10">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white/[0.04] text-gray-400 rounded-md backdrop-blur-lg">
              Quick login for demo (pass: password123)
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => handleQuickLogin('teacher_cs@nie.ac.in', 'password123')}
            className="py-2 text-center rounded-lg bg-white/[0.06] border border-white/10 text-gray-200 text-sm hover:bg-white/[0.1] transition"
          >
            Teacher (CS)
          </button>

          <button
            onClick={() => handleQuickLogin('teacher_ci@nie.ac.in', 'password123')}
            className="py-2 text-center rounded-lg bg-white/[0.06] border border-white/10 text-gray-200 text-sm hover:bg-white/[0.1] transition"
          >
            Teacher (AI&ML)
          </button>

        </div>
      </div>

    </div>
  </div>
);

};

export default TeacherLogin;
