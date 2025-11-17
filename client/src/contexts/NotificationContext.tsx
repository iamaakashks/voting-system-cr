import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';

// Define the shape of a notification
export interface NotificationState {
  message: React.ReactNode;
  type: 'success' | 'error';
}

// Define the shape of the context
interface NotificationContextType {
  notification: NotificationState | null;
  showNotification: (message: React.ReactNode, type: 'success' | 'error') => void;
  hideNotification: () => void;
}

// Create the context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Create the provider component
interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationState | null>(null);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showNotification = useCallback((message: React.ReactNode, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => {
      hideNotification();
    }, 8000); // Auto-hide after 8 seconds
  }, [hideNotification]);

  const value = {
    notification,
    showNotification,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
