import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

import Layout from './layout/Layout';
import ProtectedRoute from './layout/ProtectedRoute';
import Dashboard from './Dashboard';
import ElectionDetailPage from '../pages/ElectionDetailPage';
import StudentLogin from './StudentLoginNew';
import TeacherLogin from './TeacherLogin';
import LandingPage from './LandingPage';
import CreateElectionForm from './CreateElectionForm';
import Spinner from './Spinner';

import {
  getElectionsForUser,
  getElectionsForTeacher,
  createElection,
  LoginCredentials
} from '../services/api';

import { Election, User } from '../types';

interface CreateElectionData {
  title: string;
  description: string;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id:string; name: string; usn: string }[];
}

import { useSocket } from '../contexts/SocketContext';

const AppContent: React.FC = () => {
  const { currentUser, isLoading, login } = useAuth();
  const { showNotification } = useNotification();
  const socket = useSocket();

  const [elections, setElections] = useState<Election[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  const fetchStudentData = useCallback(async () => {
    try {
      const electionsData = await getElectionsForUser();
      setElections(electionsData);
    } catch (error: any) {
      console.error('Error loading student dashboard:', error);
      showNotification(error.response?.data?.message || 'Failed to load student dashboard.', 'error');
    }
  }, [showNotification]);

  const fetchTeacherData = useCallback(async () => {
    try {
      const electionsData = await getElectionsForTeacher();
      setElections(electionsData);
    } catch (error: any) {
      console.error('Error loading teacher dashboard:', error);
      showNotification(error.response?.data?.message || 'Failed to load teacher dashboard.', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'student') {
        fetchStudentData();
      } else if (currentUser.role === 'teacher') {
        fetchTeacherData();
      }
      const justLoggedOut = sessionStorage.getItem('justLoggedOut');
      if (!justLoggedOut && location.pathname.startsWith('/login')) {
          navigate('/dashboard');
      }
      if (justLoggedOut) {
          sessionStorage.removeItem('justLoggedOut');
      }
    } else {
      // User is logged out, clear local data
      setElections([]);
    }
  }, [currentUser, fetchStudentData, fetchTeacherData, navigate, location.pathname]);

  useEffect(() => {
    if (socket) {
      socket.on('new-election', (newElection: Election) => {
        if (currentUser && currentUser.role === 'student' && newElection.branch === currentUser.branch && newElection.section === currentUser.section) {
          setElections((prevElections) => [newElection, ...prevElections]);
          showNotification(`A new election has been created: ${newElection.title}`, 'success');
        } else if (currentUser && currentUser.role === 'teacher') {
          setElections((prevElections) => [newElection, ...prevElections]);
          showNotification(`A new election has been created: ${newElection.title}`, 'success');
        }
      });

      socket.on('election-stopped', (data: { electionId: string, election: Election }) => {
        setElections((prevElections) =>
          prevElections.map((election) =>
            election.id === data.electionId ? data.election : election
          )
        );
      });

      return () => {
        socket.off('new-election');
        socket.off('election-stopped');
      };
    }
  }, [socket, currentUser, showNotification]);

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      const user = await login(credentials);
      showNotification(`Welcome, ${user.name}!`, 'success');
    } catch (error: any) {
      console.error('Login error details:', error);
      let message = 'An unknown error occurred.';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Cannot connect to server. Please check your connection.';
      } else {
        message = 'Invalid credentials. Please try again.';
      }
      showNotification(message, 'error');
      throw error; // Re-throw to be caught in the component
    }
  };

  const handleCreateElection = async (electionData: CreateElectionData) => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    try {
      await createElection(electionData);
      showNotification('Election created successfully!', 'success');
      navigate('/dashboard');
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'An unknown error occurred.', 'error');
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage onNavigateToLogin={() => navigate('/')} onStudentLogin={() => navigate('/login/student')} onTeacherLogin={() => navigate('/login/teacher')} />} />
        <Route path="login/student" element={currentUser ? <Navigate to="/dashboard" /> : <StudentLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />
        <Route path="login/teacher" element={currentUser ? <Navigate to="/dashboard" /> : <TeacherLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<Dashboard elections={elections} onCreateNew={() => navigate('/elections/create')} />} />
          <Route path="elections/create" element={<CreateElectionForm onSubmit={handleCreateElection} onCancel={() => navigate('/dashboard')} />} />
          <Route path="elections/:id" element={<ElectionDetailPage />} />
        </Route>
        
        {/* Not Found */}
        <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
      </Route>
    </Routes>
  );
};

import { SocketProvider } from '../contexts/SocketContext';

const App: React.FC = () => (
  <SocketProvider>
    <AppContent />
  </SocketProvider>
);

export default App;


