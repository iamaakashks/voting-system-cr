import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Notification from '../Notification';
import TransactionFeed from '../TransactionFeed';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTransactions } from '../../contexts/TransactionContext';

const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { notification, hideNotification } = useNotification();
  const { transactions } = useTransactions();

  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header user={currentUser} onLogout={logout} />
      <div className="flex flex-col md:flex-row">
        <main className="container mx-auto px-4 py-8 flex-grow">
          {notification && <Notification message={notification.message} type={notification.type} onClose={hideNotification} />}
          <Outlet />
        </main>
        {currentUser && (
          <aside className="w-full md:w-80 lg:w-96 flex-shrink-0 p-4">
            <TransactionFeed transactions={transactions} />
          </aside>
        )}
      </div>
      <footer className="text-center py-4 text-gray-500 border-t border-gray-700 mt-8">
        VeriVote &copy; {new Date().getFullYear()} - A Transparent Voting Platform
      </footer>
    </div>
  );
};

export default Layout;
