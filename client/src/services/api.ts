import axios, { AxiosError } from 'axios';
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

// Enhanced error interface
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  remainingAttempts?: number;
  remainingTime?: number;
}

// Connection status
export interface ConnectionStatus {
  isOnline: boolean;
  lastChecked: Date;
  retryCount: number;
}

// Create an Axios instance
// Use environment variable for API URL, fallback to localhost for development
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 second timeout
});

// Connection status tracking
let connectionStatus: ConnectionStatus = {
  isOnline: true,
  lastChecked: new Date(),
  retryCount: 0,
};

// Max retry attempts for failed requests
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second

// Add request interceptor for debugging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);

    // Add timestamp to prevent caching issues
    config.headers['X-Request-Time'] = new Date().toISOString();

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Reset connection status on successful response
    connectionStatus.isOnline = true;
    connectionStatus.lastChecked = new Date();
    connectionStatus.retryCount = 0;

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    console.error('API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      code: error.code
    });

    // Handle network errors
    if (!error.response) {
      connectionStatus.isOnline = false;
      connectionStatus.lastChecked = new Date();

      const enhancedError: ApiError = {
        message: 'Network connection failed. Please check your internet connection.',
        code: 'NETWORK_ERROR',
        status: 0,
      };
      return Promise.reject(enhancedError);
    }

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response.status === 401) {
      const errorData = error.response.data as any;

      // If token is expired or invalid, clear it and redirect to login
      if (errorData.code === 'TOKEN_EXPIRED' || errorData.code === 'TOKEN_INVALID' || errorData.code === 'TOKEN_BLACKLISTED') {
        console.warn('Token expired or invalid, clearing auth');
        setAuthToken(null);
        localStorage.removeItem('token');

        // Dispatch custom event for app to handle logout
        window.dispatchEvent(new CustomEvent('auth:tokenExpired', {
          detail: { reason: errorData.code }
        }));

        const enhancedError: ApiError = {
          message: errorData.message || 'Session expired. Please login again.',
          code: errorData.code || 'TOKEN_EXPIRED',
          status: 401,
        };
        return Promise.reject(enhancedError);
      }
    }

    // Handle rate limiting
    if (error.response.status === 429) {
      const errorData = error.response.data as any;
      const enhancedError: ApiError = {
        message: errorData.message || 'Too many requests. Please try again later.',
        code: errorData.code || 'RATE_LIMITED',
        status: 429,
        remainingTime: errorData.remainingTime,
      };
      return Promise.reject(enhancedError);
    }

    // Handle account locked
    if (error.response.status === 429) {
      const errorData = error.response.data as any;
      if (errorData.code === 'ACCOUNT_LOCKED') {
        const enhancedError: ApiError = {
          message: errorData.message,
          code: 'ACCOUNT_LOCKED',
          status: 429,
          remainingTime: errorData.remainingTime,
        };
        return Promise.reject(enhancedError);
      }
    }

    // Handle validation errors
    if (error.response.status === 400) {
      const errorData = error.response.data as any;
      if (errorData.errors) {
        const enhancedError: ApiError = {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          status: 400,
        };
        return Promise.reject(enhancedError);
      }
    }

    // Handle server errors
    if (error.response.status >= 500) {
      const enhancedError: ApiError = {
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR',
        status: error.response.status,
      };
      return Promise.reject(enhancedError);
    }

    // For other errors, return the original error data
    const errorData = error.response.data as any;
    const enhancedError: ApiError = {
      message: errorData.message || 'An unexpected error occurred',
      code: errorData.code || 'UNKNOWN_ERROR',
      status: error.response.status,
      remainingAttempts: errorData.remainingAttempts,
    };

    return Promise.reject(enhancedError);
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

// Get current connection status
export const getConnectionStatus = (): ConnectionStatus => {
  return { ...connectionStatus };
};

// Check server connectivity
export const checkServerConnection = async (): Promise<boolean> => {
  try {
    await api.get('/auth/me', { timeout: 5000 });
    connectionStatus.isOnline = true;
    connectionStatus.lastChecked = new Date();
    connectionStatus.retryCount = 0;
    return true;
  } catch (error) {
    connectionStatus.isOnline = false;
    connectionStatus.lastChecked = new Date();
    connectionStatus.retryCount++;
    return false;
  }
};

export interface LoginCredentials {
  email: string;
  usn: string;
  password?: string;
}

// --- API Functions ---

export const login = async (credentials: LoginCredentials): Promise<{token: string, user: User, expiresIn: string}> => {
  try {
    const res = await api.post('/auth/login', credentials);
    return res.data; // { token, user, expiresIn }
  } catch (error: any) {
    // Log full error for debugging
    console.error('Login error:', error);
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      throw new Error('Cannot connect to server. Please check if the server is running and the API URL is correct.');
    }
    throw error;
  }
};

export const logout = async (): Promise<{message: string, code: string}> => {
  try {
    const res = await api.post('/auth/logout');
    return res.data;
  } catch (error: any) {
    // Even if logout fails on server, we should clear local auth
    console.warn('Logout request failed, but clearing local auth anyway:', error);
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