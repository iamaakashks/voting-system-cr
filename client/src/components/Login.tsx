import React, { useState } from 'react';
import { LoginCredentials } from '../services/api';

interface LoginProps {
  onLogin: (credentials: LoginCredentials) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [usn, setUsn] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && usn && password) {
      onLogin({ email, usn, password });
    }
  };
  
  const handleQuickLogin = (email: string, usn: string, pass: string) => {
    setEmail(email);
    setUsn(usn);
    setPassword(pass);
    onLogin({ email, usn, password: pass });
  }

  return (
    <div className="flex flex-col items-center justify-center -mt-8">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-400 mx-auto" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
           <h1 className="text-3xl font-bold text-white mt-4">Login to VeriVote</h1>
           <p className="text-gray-400 mt-2">NIE's Secure CR Election Platform</p>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="2025cs_yourname_c@nie.ac.in"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
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
                value={usn}
                onChange={(e) => setUsn(e.target.value)}
                placeholder="4NI25CS001"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>
          
           <div>
            <label htmlFor="password"className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>


          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500"
            >
              Login
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
                        Or quick login for demo (pass: password123)
                    </span>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => handleQuickLogin('2025cs_aarav_c@nie.ac.in', '4NI25CS001', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Student (CS-C)
                </button>
                 <button onClick={() => handleQuickLogin('teacher_cs@nie.ac.in', 'N/A', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Teacher (CS)
                </button>
                 <button onClick={() => handleQuickLogin('2024ise_ananya_b@nie.ac.in', '4NI24IS007', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Student (ISE-B)
                </button>
                 <button onClick={() => handleQuickLogin('teacher_ec@nie.ac.in', 'N/A', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Teacher (EC)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;