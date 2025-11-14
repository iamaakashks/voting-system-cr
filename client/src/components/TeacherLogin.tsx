import React, { useState } from 'react';
import { LoginCredentials } from '../services/api';

interface TeacherLoginProps {
  onLogin: (credentials: LoginCredentials) => void;
  onBack: () => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin({ email, usn: 'N/A', password });
    }
  };
  
  const handleQuickLogin = (email: string, pass: string) => {
    setEmail(email);
    setPassword(pass);
    onLogin({ email, usn: 'N/A', password: pass });
  }

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
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
           <h1 className="text-3xl font-bold text-white mt-4">Teacher Login</h1>
           <p className="text-gray-400 mt-2">Login with your teacher credentials</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300">
              Teacher Email ID
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="teacher_cs@nie.ac.in"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              Login as Teacher
            </button>
          </div>
        </form>
        
        <div className="mt-6">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-800 text-gray-400">
                        Quick login for demo (pass: password123)
                    </span>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleQuickLogin('teacher_cs@nie.ac.in', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Teacher (CS)
                </button>
                 <button onClick={() => handleQuickLogin('teacher_ci@nie.ac.in', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Teacher (AI&ML)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherLogin;



