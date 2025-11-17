import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import TeacherDashboard from './TeacherDashboard';
import ElectionList from './ElectionList';
import { Election } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="min-h-screen bg-[#0B0E14] p-6"
    >
      {currentUser.role === 'teacher' ? (
        <TeacherDashboard
          elections={elections}
          onSelectElection={handleSelectElection}
          onCreateNew={onCreateNew}
        />
      ) : (
        <div className="max-w-7xl mx-auto">
          <ElectionList
            elections={elections}
            onSelectElection={handleSelectElection}
            userRole="student"
          />
        </div>
      )}
    </motion.div>
  );
};

export default Dashboard;
