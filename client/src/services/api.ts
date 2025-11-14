import axios from 'axios';
import { Election, User, Transaction } from '../types';

// Define the shape of data from the new CreateElectionForm
interface CreateElectionData {
  title: string;
  description?: string; // Optional description
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

// Create an Axios instance
// Use environment variable for API URL, fallback to localhost for development
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error logging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.code
    });
    return Promise.reject(error);
  }
);

// Helper to set the auth token on all requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export interface LoginCredentials {
  email: string;
  usn: string;
  password?: string;
}

// --- API Functions ---

export const login = async (credentials: LoginCredentials): Promise<{token: string, user: User}> => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data; // { token, user }
  } catch (error: any) {
    // Log full error for debugging
    console.error('Login error:', error);
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      throw new Error('Cannot connect to server. Please check if the server is running and the API URL is correct.');
    }
    throw error;
  }
};

export const getMe = async (): Promise<User> => {
    const res = await api.get('/auth/me');
    return res.data;
};

export const getElectionsForUser = async (): Promise<Election[]> => {
  const res = await api.get('/elections/student');
  return res.data;
};

export const getElectionsForTeacher = async (): Promise<Election[]> => {
  const res = await api.get('/elections/teacher');
  return res.data;
};

export const getElectionById = async (id: string): Promise<Election> => {
    const res = await api.get(`/elections/${id}`);
    return res.data;
};

export const postVote = async (electionId: string, candidateId: string, ticket: string): Promise<{ message: string, txHash: string }> => {
    const res = await api.post('/vote', { electionId, candidateId, ticket });
    return res.data;
};

export const createElection = async (electionData: CreateElectionData): Promise<Election> => {
  const res = await api.post('/elections', electionData);
  return res.data;
};

export const stopElection = async (electionId: string): Promise<Election> => {
    const res = await api.post(`/elections/${electionId}/stop`);
    return res.data;
};

export const searchStudents = async (branch: string, section: string, name: string): Promise<{id: string, name: string, usn: string}[]> => {
  const res = await api.get(`/students/search?branch=${branch}&section=${section}&name=${name}`);
  return res.data.map((s: any) => ({ ...s, id: s._id })); // Ensure 'id' is present
};

export const getRecentTransactions = async (): Promise<Transaction[]> => {
  const res = await api.get('/transactions/recent');
  return res.data;
};

export const requestVotingTicket = async (electionId: string): Promise<{ message: string; expiresIn: number }> => {
  const res = await api.post('/tickets/request', { electionId });
  return res.data;
};

export const postVoteWithEmail = async (electionId: string, candidateId: string, ticket: string, email: string): Promise<{ message: string, txHash: string }> => {
  const res = await api.post('/vote', { electionId, candidateId, ticket, email });
  return res.data;
};

export interface TimelineData {
  time: string;
  votes: number;
  timestamp: string;
}

export interface TurnoutData {
  totalEligibleVoters: number;
  totalVotesCast: number;
  voterTurnoutPercentage: number;
  remainingVoters: number;
  timeline: { time: string; votes: number; percentage: number }[];
}

export interface GenderStats {
  candidates: {
    candidateId: string;
    candidateName: string;
    maleVotes: number;
    femaleVotes: number;
  }[];
  nota: {
    maleVotes: number;
    femaleVotes: number;
  };
}

export const getElectionTimeline = async (electionId: string): Promise<TimelineData[]> => {
  const res = await api.get(`/elections/${electionId}/timeline`);
  return res.data;
};

export const getElectionTurnout = async (electionId: string): Promise<TurnoutData> => {
  const res = await api.get(`/elections/${electionId}/turnout`);
  return res.data;
};

export const getElectionGenderStats = async (electionId: string): Promise<GenderStats> => {
  const res = await api.get(`/elections/${electionId}/gender-stats`);
  return res.data;
};