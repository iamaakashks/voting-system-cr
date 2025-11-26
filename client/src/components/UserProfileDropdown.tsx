import React from 'react';
import { User } from '../types';

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  return (
    <div
      className="absolute top-full right-0 mt-2 w-72 bg-[#111827] rounded-xl shadow-xl border border-[#4deeea55] transition-all duration-300 z-50"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">User Profile</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-400">Name</label>
            <p className="text-base text-white">{user.name}</p>
          </div>
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-400">Email</label>
            <p className="text-base text-white break-words">{user.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400">Role</label>
            <p className="text-base text-white capitalize">{user.role}</p>
          </div>
          {user.role === 'student' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-400">USN</label>
                <p className="text-base text-white">{user.usn}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">Branch</label>
                <p className="text-base text-white">{user.branch}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">Section</label>
                <p className="text-base text-white">{user.section}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400">Admission Year</label>
                <p className="text-base text-white">{user.admissionYear}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileDropdown;
