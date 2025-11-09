import React, { useEffect, useState } from 'react';

interface NotificationProps {
  message: React.ReactNode;
  type: 'success' | 'error';
  onClose: () => void;
}

const SuccessIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      // Allow time for fade-out animation before calling onClose
      setTimeout(onClose, 300);
    }, 7700); // Aligned with App's 8s timer
    
    return () => clearTimeout(timer);
  }, [message, type, onClose]);
  
  const baseClasses = 'fixed top-5 right-5 flex items-center p-4 rounded-lg shadow-lg text-white max-w-sm z-50 transition-all duration-300';
  const typeClasses = type === 'success' ? 'bg-green-600/90 border-green-500' : 'bg-red-600/90 border-red-500';
  const visibilityClasses = visible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform -translate-y-5';

  return (
    <div className={`${baseClasses} ${typeClasses} ${visibilityClasses} border-l-4`}>
        <div className="mr-3">
            {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
        </div>
        <div className="flex-grow">
            <p className="font-bold">{type === 'success' ? 'Success' : 'Error'}</p>
            <div className="text-sm">{message}</div>
        </div>
        <button onClick={onClose} className="ml-4 p-1 rounded-full hover:bg-white/20 transition-colors self-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    </div>
  );
};

export default Notification;