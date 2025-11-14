import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const UserIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-800 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
           </svg>
           <h1 className="text-2xl font-bold text-white tracking-wider">VeriVote</h1>
        </div>
        {user && (
           <div className="flex items-center gap-4">
               <div className="flex items-center text-gray-300">
                    <UserIcon />
                    <span className="font-medium">{user.email}</span>
               </div>
               <button
                    onClick={onLogout}
                    className="px-4 py-2 rounded-md font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                >
                    Logout
                </button>
           </div>
        )}
      </div>
    </header>
  );
};

export default Header;