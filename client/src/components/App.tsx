import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSocket } from '../contexts/SocketContext';

import Layout from './layout/Layout';
import ProtectedRoute from './layout/ProtectedRoute';
import Dashboard from './Dashboard';
import ElectionDetailPage from '../pages/ElectionDetailPage';
import StudentLogin from './StudentLogin';
import TeacherLogin from './TeacherLogin';
import LandingPage from './LandingPageProfessional';
import CreateElectionForm from './CreateElectionForm';
import Spinner from './Spinner';

import {
  getElectionsForUser,
  getElectionsForTeacher,
  createElection,
  LoginCredentials
} from '../services/api';

import { Election } from '../types';

interface CreateElectionData {
  title: string;
  description: string;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id:string; name: string; usn: string }[];
}

const App: React.FC = () => {
  const { currentUser, isLoading, login } = useAuth();
  const { showNotification } = useNotification();
  const { socket } = useSocket();

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, navigate, location.pathname]);

  // Effect for handling real-time updates - MUST run only once per login session
  useEffect(() => {
    if (!currentUser || !socket) return;

    const handleUpdate = () => {
      console.log("✓ Election event received, refetching elections list...");
      if (currentUser.role === 'student') {
        getElectionsForUser().then(data => {
          console.log('✓ Student elections updated:', data.length);
          setElections(data);
        }).catch(err => console.error('Error fetching elections:', err));
      } else if (currentUser.role === 'teacher') {
        getElectionsForTeacher().then(data => {
          console.log('✓ Teacher elections updated:', data.length);
          setElections(data);
        }).catch(err => console.error('Error fetching elections:', err));
      }
    };

    socket.on('election:started', handleUpdate);
    socket.on('election:ended', handleUpdate);
    socket.on('election:created', handleUpdate);
    socket.on('election:stopped', handleUpdate);

    return () => {
      socket.off('election:started', handleUpdate);
      socket.off('election:ended', handleUpdate);
      socket.off('election:created', handleUpdate);
      socket.off('election:stopped', handleUpdate);
    };
  }, [currentUser, socket, fetchStudentData, fetchTeacherData]);

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
      throw error; // Re-throw to let the form handle the state
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Routes>
      {/* Public Routes - No Layout (no header/footer) */}
      <Route index element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage onNavigateToLogin={() => navigate('/')} onStudentLogin={() => navigate('/login/student')} onTeacherLogin={() => navigate('/login/teacher')} />} />
      <Route path="login/student" element={currentUser ? <Navigate to="/dashboard" /> : <StudentLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />
      <Route path="login/teacher" element={currentUser ? <Navigate to="/dashboard" /> : <TeacherLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />

      {/* Protected Routes - With Layout (header/footer) */}
      <Route path="/" element={<Layout />}>
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

export default App;
