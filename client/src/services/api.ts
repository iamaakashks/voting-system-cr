import axios from 'axios';
import { Election, User, Transaction } from '../types';

// Define the shape of data from the new CreateElectionForm
interface CreateElectionData {
  title: string;
  description: string;
  branch: string;
  section: string;
  startTime: string;
  endTime: string;
  candidates: { id: string; name: string; usn: string }[];
}

// Create an Axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Your server URL
});

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
  const res = await api.post('/auth/login', credentials);
  return res.data; // { token, user }
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
  // This route is still pointing to a mock, but it's wired up
  const res = await api.get('/transactions/recent');
  return res.data;
};