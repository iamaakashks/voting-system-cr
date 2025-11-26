import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Notification from '../Notification';
import TransactionFeed from '../TransactionFeed';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTransactions } from '../../contexts/TransactionContext';
import { Vote, Github, Mail, Globe } from 'lucide-react';

const Layout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { notification, hideNotification } = useNotification();
  const { transactions } = useTransactions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-[#060606] dark:via-[#121212] dark:to-[#242424] font-sans transition-colors duration-300">
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
      
      {/* Modern Footer */}
      <footer className="border-t border-gray-300 dark:border-[#434546] py-8 bg-white/80 dark:bg-[#121212]/80 backdrop-blur-lg mt-auto">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8 mb-6">
            {/* Brand Section */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="bg-gradient-to-br from-[#b4a9e6] to-[#6d7382] p-2 rounded-lg shadow-lg">
                  <Vote className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-[#b4a9e6] to-[#6d7382] bg-clip-text text-transparent">VeriVote</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Secure, transparent, and decentralized voting for the modern era.
              </p>
            </div>
            
            {/* Quick Links */}
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><a href="/dashboard" className="hover:text-[#b4a9e6] transition-colors">Dashboard</a></li>
                <li><a href="/elections" className="hover:text-[#b4a9e6] transition-colors">Elections</a></li>
                <li><a href="/" className="hover:text-[#b4a9e6] transition-colors">Home</a></li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h3 className="font-bold mb-4 text-gray-900 dark:text-white">Contact</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">Built with ❤️ by NIE Students</p>
              <div className="flex space-x-3">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Mail className="w-5 h-5" />
                </a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#b4a9e6] transition-colors p-2 bg-gray-100 dark:bg-[#242424] rounded-lg hover:bg-[#b4a9e6]/10 dark:hover:bg-[#b4a9e6]/20">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-300 dark:border-[#434546] pt-6 text-center text-gray-600 dark:text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} VeriVote. All rights reserved. | A Blockchain-Powered Voting Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
