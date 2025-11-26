import React from 'react';
import { User } from '../types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ThemeToggle from './ThemeToggle';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  // Get proper display name and initials
  const getDisplayName = () => {
    if (!user) return 'User';
    if (user.name && user.name.trim()) return user.name;
    if (user.role === 'teacher') return 'Teacher';
    if (user.role === 'student') return 'Student';
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="bg-white/80 dark:bg-[#121212]/80 border-b border-gray-200 dark:border-[#434546] sticky top-0 z-50 backdrop-blur-lg">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="flex items-center space-x-3 group cursor-pointer">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#b4a9e6] transform group-hover:scale-110 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="absolute inset-0 bg-[#b4a9e6] rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent">VeriVote</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Secure Voting</p>
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          {user && (
            <>
              <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-[#242424] rounded-lg border border-gray-200 dark:border-[#434546]">
                <div className="w-10 h-10 bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {getInitials()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{getDisplayName()}</p>
                  <Badge variant="secondary" className="text-xs bg-[#b4a9e6]/20 text-[#b4a9e6] dark:text-white border-[#b4a9e6]/30">
                    {user.role || 'user'}
                  </Badge>
                </div>
              </div>
              
              <Button onClick={onLogout} variant="destructive" size="sm" className="bg-red-500 hover:bg-red-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;