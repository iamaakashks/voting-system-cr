import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

interface SocketContextType {
  socket: Socket;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually
  transports: ['websocket', 'polling']
});

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {

  useEffect(() => {
    console.log('Connecting socket...');
    socket.connect();

    socket.on('connect', () => {
      console.log('✓ Socket connected successfully:', socket.id);
    });
    socket.on('connect_error', (err) => {
      console.error('✗ Socket connection error:', err.message);
    });
    socket.on('disconnect', () => {
      console.log('✗ Socket disconnected');
    });
    socket.on('reconnect', () => {
      console.log('✓ Socket reconnected');
    });

    return () => {
      console.log('Disconnecting socket on provider unmount...');
      socket.disconnect();
    };
  }, []);

  const value = {
    socket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

