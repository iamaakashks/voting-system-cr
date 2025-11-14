import React from 'react';
import ElectionList from './ElectionList';
import { Election } from '../types';

interface TeacherDashboardProps {
    elections: Election[];
    onSelectElection: (id: string) => void;
    onCreateNew: () => void;
    onBack?: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ elections, onSelectElection, onCreateNew, onBack }) => {
    return (
        <div>
            {onBack && (
              <button onClick={onBack} className="mb-4 text-white font-semibold hover:text-gray-300 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <div className="flex justify-end mb-8">
                 <button 
                    onClick={onCreateNew}
                    className="px-6 py-3 bg-white text-black font-semibold rounded-lg shadow-md hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105"
                >
                    + Create New Election
                </button>
            </div>
            <ElectionList 
                elections={elections}
                onSelectElection={onSelectElection}
                userRole="teacher"
            />
        </div>
    );
};

export default TeacherDashboard;
