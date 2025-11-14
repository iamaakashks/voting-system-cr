import React, { useState, useEffect } from 'react';
import { getConnectionStatus, checkServerConnection } from '../services/api';

const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState(getConnectionStatus());
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Update status every 30 seconds
    const interval = setInterval(() => {
      setStatus(getConnectionStatus());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await checkServerConnection();
      setStatus(getConnectionStatus());
    } catch (error) {
      console.error('Manual connection check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Don't show anything if connected and no recent issues
  if (status.isOnline && status.retryCount === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-40">
      <div
        className={`px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 text-sm font-medium ${
          status.isOnline
            ? 'bg-green-100 text-green-800 border border-green-200'
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full ${
            status.isOnline ? 'bg-green-500' : 'bg-red-500'
          }`}
        />

        <span>
          {status.isOnline ? 'Connected' : 'Connection Lost'}
        </span>

        {status.retryCount > 0 && (
          <span className="text-xs opacity-75">
            (Retry: {status.retryCount})
          </span>
        )}

        <button
          onClick={handleManualCheck}
          disabled={isChecking}
          className={`ml-2 p-1 rounded hover:bg-opacity-20 ${
            status.isOnline ? 'hover:bg-green-200' : 'hover:bg-red-200'
          }`}
          title="Check connection"
        >
          {isChecking ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConnectionStatus;
