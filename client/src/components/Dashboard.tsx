import React from 'react';
import { User } from '../types';
import TeacherDashboard from './TeacherDashboard';
import ElectionList from './ElectionList';
import { Election } from '../types';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
    user: User;
    elections: Election[];
    onCreateNew: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, elections, onCreateNew }) => {
    const navigate = useNavigate();

    const handleSelectElection = (electionId: string) => {
        navigate(`/elections/${electionId}`);
    };

    if (user.role === 'teacher') {
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
