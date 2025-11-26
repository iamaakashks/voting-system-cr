import { io, Socket } from 'socket.io-client';

// Remove /api suffix from API_URL for socket connection
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = API_URL.replace('/api', '');

let socket: Socket;

export const connectSocket = () => {
  // Disconnect any existing socket
  if (socket) {
    socket.disconnect();
  }
  
  console.log('Connecting to socket server at:', SOCKET_URL);
  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'] // Explicitly specify transports
  });

  socket.on('connect', () => {
    console.log('✓ Socket connected successfully:', socket.id);
    console.log('✓ Connected to:', SOCKET_URL);
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
};

export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket...');
    socket.disconnect();
  }
};

export const onNewVote = (callback: (data: { electionId: string }) => void) => {
  if (!socket) return;
  
  socket.off('vote:new');
  socket.on('vote:new', (data) => {
    console.log('New vote received for election:', data.electionId);
    callback(data);
  });
};

export const onElectionStarted = (callback: (data: { electionId: string }) => void) => {
  if (!socket) return;
  
  socket.off('election:started');
  socket.on('election:started', (data) => {
    console.log('Election started:', data.electionId);
    callback(data);
  });
};

export const onElectionEnded = (callback: (data: { electionId: string }) => void) => {
  if (!socket) return;

  socket.off('election:ended');
  socket.on('election:ended', (data) => {
    console.log('Election ended:', data.electionId);
    callback(data);
  });
};

// Election Created - Real-time notification when new election is created
export const onElectionCreated = (callback: (data: any) => void) => {
  if (!socket) return;
  
  socket.off('election:created');
  socket.on('election:created', (data) => {
    console.log('New election created:', data.election.title);
    callback(data);
  });
};

// Election Stopped - Real-time notification when election is manually stopped
export const onElectionStopped = (callback: (data: { electionId: string }) => void) => {
  if (!socket) return;
  
  socket.off('election:stopped');
  socket.on('election:stopped', (data) => {
    console.log('Election stopped:', data.electionId);
    callback(data);
  });
};

// Election Results Updated - Real-time update for charts/graphs when vote is cast
export const onElectionResultsUpdated = (callback: (data: { electionId: string }) => void) => {
  if (!socket) return;
  
  socket.off('election:results:updated');
  socket.on('election:results:updated', (data) => {
    console.log('Election results updated:', data.electionId);
    callback(data);
  });
};
