export interface Candidate {
  id: string;
  name: string;
  imageUrl: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  usn: string;
  password?: string; // Should only exist in mock DB, not sent to client
  role: 'student' | 'teacher';
  branch: string;
  section: string;
  admissionYear: string;
}

export interface Election {
  id:string;
  title: string;
  description?: string; // Optional description
  branch: string; // e.g., 'cs', 'ec'
  section: string; // e.g., 'a', 'b'
  startTime: string; // ISO 8601 format
  endTime: string; // ISO 8601 format
  status: 'Pending' | 'Ongoing' | 'Finished';
  createdBy: string; // teacher's email
  candidates: Candidate[];
  results: { [candidateId: string]: number };
  userVoted?: boolean; // Optional because it's context-dependent on the logged-in user
  userTicket?: string; // The user's ticket for this specific election
  notaVotes?: number; // NOTA (None of the Above) votes
}

export interface Transaction {
  ballotHash: string;
  electionTitle: string;
  timestamp: string;
}

export interface LoginCredentials {
  email: string;
  usn: string;
  password?: string;
}
