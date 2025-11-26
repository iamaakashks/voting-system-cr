import React, { useState } from 'react';
import { LoginCredentials } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';
import { Vote, Eye, EyeOff, LogIn, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && usn && password) {
      setIsLoading(true);
      try {
        await onLogin({ email, usn, password });
      } catch (error) {
        // Error handling is done in parent
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleQuickLogin = (email: string, usn: string, pass: string) => {
    setEmail(email);
    setUsn(usn);
    setPassword(pass);
    onLogin({ email, usn, password: pass });
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-[#434546]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] rounded-2xl shadow-lg mb-4">
            <Vote className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent mb-2">
            Login to VeriVote
          </h1>
          <p className="text-gray-600 dark:text-gray-400">NIE's Secure CR Election Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="2023cs_myrajoshi_a@nie.ac.in"
              className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all"
            />
          </div>
          
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
              value={usn}
              onChange={(e) => setUsn(e.target.value)}
              placeholder="4NI25CS001"
              className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all"
            />
          </div>
          
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-4 py-3 pr-12 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#b4a9e6] focus:border-transparent bg-white dark:bg-[#242424] text-gray-900 dark:text-white transition-all"
              />
              {password.length > 0 && (
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
          </div>

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
                Login
              </>
            )}
          </button>
        </form>
        
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-[#434546]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                Quick Demo Login (pass: password123)
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleQuickLogin('2023cs_myrajoshi_a@nie.ac.in', '4NI23CS001', 'password123')} 
              className="text-center py-2 px-2 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
            >
              Student (CS-A)
            </button>
            <button 
              onClick={() => handleQuickLogin('teacher_cs@nie.ac.in', 'N/A', 'password123')} 
              className="text-center py-2 px-2 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
            >
              Teacher (CS)
            </button>
            <button 
              onClick={() => handleQuickLogin('2023is_lavanyanaidu_a@nie.ac.in', '4NI23IS001', 'password123')} 
              className="text-center py-2 px-2 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
            >
              Student (IS-A)
            </button>
            <button 
              onClick={() => handleQuickLogin('teacher_ci@nie.ac.in', 'N/A', 'password123')} 
              className="text-center py-2 px-2 border border-gray-300 dark:border-[#434546] rounded-lg shadow-sm text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-[#242424] hover:bg-gray-100 dark:hover:bg-[#434546] transition-all"
            >
              Teacher (AI&ML)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
