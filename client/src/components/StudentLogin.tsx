import React, { useState } from 'react';
import { LoginCredentials } from '../services/api';

interface StudentLoginProps {
  onLogin: (credentials: LoginCredentials) => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin }) => {
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="2023cs_yourname_a@nie.ac.in"
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
                onChange={(e) => setUsn(e.target.value.toUpperCase())}
                placeholder="4NI23CS001"
                className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-gray-700 text-white"
              />
            </div>
          </div>
          
           <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
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
              Login as Student
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
                <button onClick={() => handleQuickLogin('2023cs_demostudentcs_a@nie.ac.in', '4NI23CS001', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Student (CS-A)
                </button>
                 <button onClick={() => handleQuickLogin('2023ise_demostudentise_b@nie.ac.in', '4NI23IS001', 'password123')} className="w-full text-center py-2 px-2 border border-gray-600 rounded-md shadow-sm text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600">
                    Student (ISE-B)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;


