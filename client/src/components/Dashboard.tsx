import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import ElectionList from './ElectionList';
import { Election } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
    elections: Election[];
    onCreateNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ elections, onCreateNew }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    const handleSelectElection = (electionId: string) => {
        navigate(`/elections/${electionId}`);
    };

    if (!currentUser) {
        return null; // Or a loading indicator/error
    }

    if (currentUser.role === 'teacher') {
        return (
            <TeacherDashboard
                elections={elections}
                onSelectElection={handleSelectElection}
                onCreateNew={onCreateNew}
            />
        );
    }

    return (
        <ElectionList
            elections={elections}
            onSelectElection={handleSelectElection}
            userRole="student"
        />
    );
};

export default Dashboard;
