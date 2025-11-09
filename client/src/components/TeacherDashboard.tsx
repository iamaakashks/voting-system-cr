import React from 'react';
import ElectionList from './ElectionList';
import { Election } from '../types';

interface TeacherDashboardProps {
    elections: Election[];
    onSelectElection: (id: string) => void;
    onCreateNew: () => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ elections, onSelectElection, onCreateNew }) => {
    return (
        <div>
            <div className="flex justify-end mb-8">
                 <button 
                    onClick={onCreateNew}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-300 transform hover:scale-105"
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
