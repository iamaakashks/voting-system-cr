import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Notification from '../Notification';
import TransactionFeed from '../TransactionFeed';
import { User, Transaction } from '../../types';

interface LayoutProps {
  user: User | null;
  onLogout: () => void;
  notification: { message: React.ReactNode; type: 'success' | 'error' } | null;
  setNotification: (notification: { message: React.ReactNode; type: 'success' | 'error' } | null) => void;
  transactions: Transaction[];
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, notification, setNotification, transactions }) => {
  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      <Header user={user} onLogout={onLogout} />
      <div className="flex flex-col md:flex-row">
        <main className="container mx-auto px-4 py-8 flex-grow">
          {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
          <Outlet />
        </main>
        {user && (
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
