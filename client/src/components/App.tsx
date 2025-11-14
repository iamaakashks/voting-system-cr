import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';

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
  login,
  getMe,
  setAuthToken,
  getElectionsForUser,
  getElectionsForTeacher,
  getElectionById,
  postVoteWithEmail,
  createElection,
  stopElection,
  getRecentTransactions,
  LoginCredentials
} from '../services/api';

import { Election, User, Transaction } from '../types';

interface CreateElectionData {
  title: string;
  description: string;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: React.ReactNode; type: 'success' | 'error' } | null>(null);
  const [transactionFeed, setTransactionFeed] = useState<Transaction[]>([]);
  
  const navigate = useNavigate();
  const location = useLocation();

  const showNotification = useCallback((message: React.ReactNode, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setCurrentUser(null);
    setElections([]);
    setTransactionFeed([]);
    showNotification('You have been logged out.', 'success');
    navigate('/');
  }, [navigate, showNotification]);

  const fetchStudentData = useCallback(async () => {
    try {
      const electionsData = await getElectionsForUser();
      setElections(electionsData);
      const transactionsData = await getRecentTransactions();
      setTransactionFeed(transactionsData);
    } catch (error: any) {
      console.error('Error loading student dashboard:', error);
      showNotification(error.response?.data?.message || 'Failed to load student dashboard.', 'error');
    }
  }, [showNotification]);

  const fetchTeacherData = useCallback(async () => {
    try {
      const electionsData = await getElectionsForTeacher();
      setElections(electionsData);
      const transactionsData = await getRecentTransactions();
      setTransactionFeed(transactionsData);
    } catch (error: any) {
      console.error('Error loading teacher dashboard:', error);
      showNotification(error.response?.data?.message || 'Failed to load teacher dashboard.', 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const user = await getMe();
          setCurrentUser(user);
        } catch {
          handleLogout();
        }
      }
      setIsLoading(false);
    };
    checkLoggedInUser();
  }, [handleLogout]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'student') {
        fetchStudentData();
        if (location.pathname.startsWith('/login')) {
            navigate('/dashboard');
        }
      } else if (currentUser.role === 'teacher') {
        fetchTeacherData();
        if (location.pathname.startsWith('/login')) {
            navigate('/dashboard');
        }
      }
    }
  }, [currentUser, fetchStudentData, fetchTeacherData, navigate, location.pathname]);

  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { token, user } = await login(credentials);
      localStorage.setItem('token', token);
      setAuthToken(token);
      setCurrentUser(user); // This will trigger the useEffect above
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateElection = async (electionData: CreateElectionData) => {
    if (!currentUser || currentUser.role !== 'teacher') return;
    setIsLoading(true);
    try {
      await createElection(electionData);
      showNotification('Election created successfully!', 'success');
      await fetchTeacherData(); // Refresh data
      navigate('/dashboard');
    } catch (error: any) {
      showNotification(error.response?.data?.message || 'An unknown error occurred.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <Routes>
      <Route path="/" element={<Layout user={currentUser} onLogout={handleLogout} notification={notification} setNotification={setNotification} transactions={transactionFeed} />}>
        {/* Public Routes */}
        <Route index element={currentUser ? <Navigate to="/dashboard" /> : <LandingPage onNavigateToLogin={() => navigate('/login/student')} onStudentLogin={() => navigate('/login/student')} onTeacherLogin={() => navigate('/login/teacher')} />} />
        <Route path="login/student" element={currentUser ? <Navigate to="/dashboard" /> : <StudentLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />
        <Route path="login/teacher" element={currentUser ? <Navigate to="/dashboard" /> : <TeacherLogin onLogin={handleLogin} onBack={() => navigate('/')} />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute user={currentUser} />}>
          <Route path="dashboard" element={<Dashboard user={currentUser!} elections={elections} onCreateNew={() => navigate('/elections/create')} />} />
          <Route path="elections/create" element={<CreateElectionForm onSubmit={handleCreateElection} onCancel={() => navigate('/dashboard')} />} />
          <Route path="elections/:id" element={<ElectionDetailPage user={currentUser} showNotification={showNotification} />} />
        </Route>
        
        {/* Not Found */}
        <Route path="*" element={<div><h2>404 Not Found</h2></div>} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => <AppContent />;

export default App;

