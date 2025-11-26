import React, { createContext, useState, useContext, useCallback, ReactNode, useEffect } from 'react';
import { Transaction } from '../types';
import { getRecentTransactions } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

// Define the shape of the context
interface TransactionContextType {
  transactions: Transaction[];
  fetchTransactions: () => Promise<void>;
}

// Create the context
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Create the provider component
interface TransactionProviderProps {
  children: ReactNode;
}

export const TransactionProvider: React.FC<TransactionProviderProps> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { currentUser } = useAuth();
  const { socket } = useSocket();

  const fetchTransactions = useCallback(async () => {
    try {
      const transactionsData = await getRecentTransactions();
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
      // Silently fail for now, as this is a non-critical feed
    }
  }, []);

  useEffect(() => {
    if (currentUser && socket) {
      fetchTransactions();
      
      const handleNewVote = () => {
        console.log('New vote detected, refreshing transaction feed...');
        fetchTransactions();
      };

      socket.on('vote:new', handleNewVote);

      return () => {
        socket.off('vote:new', handleNewVote);
      };
    } else {
      // Clear transactions when user logs out
      setTransactions([]);
    }
  }, [currentUser, socket, fetchTransactions]);

  const value = {
    transactions,
    fetchTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};
