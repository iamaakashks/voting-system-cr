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
