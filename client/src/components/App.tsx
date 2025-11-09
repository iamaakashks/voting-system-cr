import React, { useState, useEffect, useCallback } from 'react';
import Header from './Header';
import ElectionList from './ElectionList';
import ElectionDetail from './ElectionDetail';
import Notification from './Notification';
import Spinner from './Spinner';
import Login from './Login';
import TeacherDashboard from './TeacherDashboard';
import TransactionFeed from './TransactionFeed';
import LandingPage from './LandingPage';
import CreateElectionForm from './CreateElectionForm'; // Import the new component

// Import ALL functions from your new API file
import { 
  login, 
  getMe, 
  setAuthToken,
  getElectionsForUser, 
  getElectionsForTeacher,
  getElectionById, 
  postVote, 
  createElection, 
  stopElection,
  getRecentTransactions,
  LoginCredentials 
} from '../services/api';

import { Election, User, Transaction } from '../types';

// Define the shape of data from the new CreateElectionForm
interface CreateElectionData {
  title: string;
  description: string;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'student_dashboard' | 'teacher_dashboard' | 'election_detail' | 'create_election'>('landing');
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading to check for token
  const [notification, setNotification] = useState<{ message: React.ReactNode; type: 'success' | 'error' } | null>(null);
  const [transactionFeed, setTransactionFeed] = useState<Transaction[]>([]);

  // Show notifications
  const showNotification = (message: React.ReactNode, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 8000);
  };

  // Log out user, clear token, reset state
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    setAuthToken(null);
    setCurrentUser(null);
    setElections([]);
    setSelectedElection(null);
    setTransactionFeed([]);
    setView('landing');
    showNotification('You have been logged out.', 'success');
  }, []); // Empty dependencies

  // Split data fetching for different roles
  const fetchStudentData = useCallback(async () => {
    try {
      const [electionsData, transactionsData] = await Promise.all([
        getElectionsForUser(),
        getRecentTransactions()
      ]);
      setElections(electionsData);
      setTransactionFeed(transactionsData);
      setView('student_dashboard');
    } catch (error) {
      showNotification('Failed to load student dashboard.', 'error');
    }
  }, []);

  const fetchTeacherData = useCallback(async () => {
    try {
      const [electionsData, transactionsData] = await Promise.all([
        getElectionsForTeacher(),
        getRecentTransactions()
      ]);
      setElections(electionsData);
      setTransactionFeed(transactionsData);
      setView('teacher_dashboard');
    } catch (error) {
      showNotification('Failed to load teacher dashboard.', 'error');
    }
  }, []);

  // Check for an existing token on app load
  useEffect(() => {
    const checkLoggedInUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        setAuthToken(token);
        try {
          const user = await getMe(); // New API call: get user from token
          setCurrentUser(user);
          
          if (user.role === 'student') {
            await fetchStudentData();
          } else {
            await fetchTeacherData();
          }
        } catch (error) {
          handleLogout(); // Token is invalid or expired
        }
      } else {
        setView('landing'); // No token, show landing page
      }
      setIsLoading(false); // Done with initial load
    };
    checkLoggedInUser();
  }, [handleLogout, fetchStudentData, fetchTeacherData]); // Add all dependencies

  // Fetch just the transaction feed (e.g., after a vote)
  const fetchRecentTransactions = useCallback(async () => {
    try {
      const transactions = await getRecentTransactions();
      setTransactionFeed(transactions);
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
    }
  }, []);

  // Handle user login
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const { token, user } = await login(credentials);
      localStorage.setItem('token', token);
      setAuthToken(token);
      setCurrentUser(user);
      showNotification(`Welcome, ${user.name}!`, 'success');

      if (user.role === 'student') {
        await fetchStudentData();
      } else {
        await fetchTeacherData();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'An unknown error occurred.';
      showNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle selecting an election
  const handleSelectElection = async (electionId: string) => {
    setIsLoading(true);
    try {
      const electionData = await getElectionById(electionId); // No user needed (token)
      setSelectedElection(electionData);
      setView('election_detail');
    } catch (error) {
      showNotification('Failed to load election details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle new election creation
  const handleCreateElection = async (electionData: CreateElectionData) => {
     if (!currentUser || currentUser.role !== 'teacher') return;
     setIsLoading(true);
     try {
       await createElection(electionData); // No user needed (token)
       showNotification('Election created and tickets generated successfully!', 'success');
       await fetchTeacherData(); // Refresh the teacher's list
     } catch (error: any) {
        const message = error.response?.data?.message || 'An unknown error occurred.';
        showNotification(`Creation failed: ${message}`, 'error');
        setView('teacher_dashboard');
     } finally {
       setIsLoading(false);
     }
  };

  // Go back from detail view
  const handleBackToList = () => {
    setSelectedElection(null);
    setView(currentUser?.role === 'student' ? 'student_dashboard' : 'teacher_dashboard');
  };

  // Handle casting a vote
  const handleVote = useCallback(async (electionId: string, candidateId: string, ticket: string) => {
    if (!currentUser) {
      showNotification('You must be logged in to vote.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      // API call changed, no user needed (token)
      const { txHash } = await postVote(electionId, candidateId, ticket);
      
      // API doesn't return updated election, so we re-fetch it
      const updatedElection = await getElectionById(electionId);

      setSelectedElection(updatedElection);
      setElections(prevElections => 
        prevElections.map(e => e.id === electionId ? updatedElection : e)
      );
      
      const explorerUrl = `https://sepolia.etherscan.io/tx/${txHash}`;
      
      showNotification(
        <>
          Vote cast successfully!
          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold ml-2 hover:text-blue-200">
            Verify on Etherscan
          </a>
        </>, 
        'success'
      );
      
      await fetchRecentTransactions();

    } catch (error: any) {
      const message = error.response?.data?.message || 'An unknown error occurred.';
      showNotification(`Vote failed: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, fetchRecentTransactions]);

  // NEW: Handle teacher stopping an election
  const handleStopElection = async (electionId: string) => {
    if (!window.confirm("Are you sure you want to stop this election now?")) return;
    setIsLoading(true);
    try {
      const updatedElection = await stopElection(electionId);
      setSelectedElection(updatedElection);
      setElections(prevElections =>
        prevElections.map(e => (e.id === electionId ? updatedElection : e))
      );
      showNotification('Election has been stopped.', 'success');
    } catch (error: any) {
      const message = error.response?.data?.message || 'An unknown error occurred.';
      showNotification(`Failed to stop election: ${message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the correct view based on state
  const renderContent = () => {
    if (isLoading && view !== 'landing') return <Spinner />;
    
    switch (view) {
      case 'landing':
          // Show spinner on landing page only on initial load
        return isLoading ? <Spinner /> : <LandingPage onNavigateToLogin={() => setView('login')} />;
      case 'login':
        return <Login onLogin={handleLogin} />;
      case 'student_dashboard':
        return <ElectionList elections={elections} onSelectElection={handleSelectElection} userRole='student' />;
      case 'teacher_dashboard':
        return <TeacherDashboard elections={elections} onSelectElection={handleSelectElection} onCreateNew={() => setView('create_election')} />;
      case 'create_election':
        return <CreateElectionForm onSubmit={handleCreateElection} onCancel={() => setView('teacher_dashboard')} />;
      case 'election_detail':
        if (selectedElection) {
          return <ElectionDetail 
            election={selectedElection} 
            onVote={handleVote}
            onBack={handleBackToList}
            user={currentUser}
            onStopElection={handleStopElection} // Pass new prop
          />
        }
        return null; 
      default:
        return <LandingPage onNavigateToLogin={() => setView('login')} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header user={currentUser} onLogout={handleLogout} />
       {view !== 'landing' ? (
         <div className="flex flex-col md:flex-row">
            <main className="container mx-auto px-4 py-8 flex-grow">
              {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
                        {renderContent()}
            </main>
            {currentUser && (
                <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 p-4">
                 <TransactionFeed transactions={transactionFeed} />
              </aside>
            )}
          </div>
       ) : (
          <main>
             {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
             {renderContent()}
          </main>
       )}
      <footer className="text-center py-4 text-gray-500 border-t border-gray-700 mt-8">
        VeriVote &copy; {new Date().getFullYear()} - A Transparent Voting Platform
      </footer>
    </div>
  );
};

export default App;