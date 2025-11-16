import React, { useState, useEffect } from 'react';
import { Election, Candidate, User } from '../types';
import ResultsChart from './ResultsChart';
import VotingTimelineChart from './VotingTimelineChart';
import VoterTurnoutAnalytics from './VoterTurnoutAnalytics';
import GenderVoteChart from './GenderVoteChart';
import { requestVotingTicket, getElectionTimeline, getElectionTurnout, getElectionGenderStats } from '../services/api';

interface ElectionDetailProps {
  election: Election;
  user: User | null;
  onVote: (electionId: string, candidateId: string, ticket: string, email: string) => void;
  onBack: () => void;
  onStopElection: (electionId: string) => void;
}

// Countdown timer hook
const useCountdown = (startTime: string, endTime: string) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = +new Date();
      const start = +new Date(startTime);
      const end = +new Date(endTime);

      let difference: number;
      if (now < start) {
        difference = start - now;
        setLabel('Time Until Start');
      } else if (now < end) {
        difference = end - now;
        setLabel('Time Remaining');
      } else {
        setTimeLeft('Election Closed');
        setLabel('Election Ended');
        return;
      }

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        // This case handles the moment the countdown reaches zero
        // and avoids showing a negative countdown.
        setTimeLeft('0d 0h 0m 0s');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return { timeLeft, label };
};

const getButtonState = (election: Election, user: User | null) => {
  const now = new Date();
  const startTime = new Date(election.startTime);
  const endTime = new Date(election.endTime);

  if (user?.role === 'teacher')
    return { text: 'Teachers Cannot Vote', disabled: true, className: 'bg-gray-600 cursor-not-allowed' };
  if (election.userVoted)
    return { text: 'You Have Voted', disabled: true, className: 'bg-green-700 cursor-not-allowed' };
  if (now < startTime)
    return { text: 'Voting Not Started', disabled: true, className: 'bg-yellow-700 cursor-not-allowed' };
  if (now > endTime)
    return { text: 'Voting Closed', disabled: true, className: 'bg-red-700 cursor-not-allowed' };

  return { text: 'Cast Vote', disabled: false, className: 'bg-white text-black hover:bg-gray-200' };
};

const CandidateCard: React.FC<{
  candidate: Candidate;
  onInitiateVote: (candidateId: string) => void;
  buttonState: ReturnType<typeof getButtonState>;
  userRole?: 'student' | 'teacher';
  isElectionOver: boolean;
}> = ({ candidate, onInitiateVote, buttonState, userRole, isElectionOver }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col items-center p-6 text-center">
    <img src={candidate.imageUrl} alt={candidate.name} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-700" />
    <h4 className="text-lg font-semibold text-white mb-4">{candidate.name}</h4>
    {userRole !== 'teacher' && !isElectionOver && (
      <button
        onClick={() => onInitiateVote(candidate.id)}
        disabled={buttonState.disabled}
        className={`w-full py-2 px-4 rounded-md font-bold text-white transition-colors duration-300 ${buttonState.className}`}
      >
        {buttonState.text}
      </button>
    )}
  </div>
);

const ThanksForVoting: React.FC = () => {
  return (
    <div className="bg-green-500/10 border border-green-500 text-green-300 rounded-lg p-12 text-center shadow-lg">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h4 className="text-3xl font-bold text-white mb-2">Thanks for Voting!</h4>
      <p className="text-lg text-gray-300">Your vote has been recorded successfully.</p>
    </div>
  );
};

const VoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: string, email: string) => void;
  candidateName: string;
  userEmail?: string;
}> = ({ isOpen, onClose, onSubmit, candidateName, userEmail }) => {
  const [ticket, setTicket] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  useEffect(() => {
    if (userEmail) {
      setEmail(userEmail);
    }
  }, [userEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket.trim() && email.trim()) {
      onSubmit(ticket.trim().toUpperCase(), email.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-white mb-2">Confirm Your Vote</h3>
        <p className="text-gray-400 mb-4">Voting for <span className="font-bold text-white">{candidateName}</span></p>
        <p className="text-sm text-gray-300 mb-4">Please enter the ticket sent to your email and your email address.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Your Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white"
              placeholder="your.email@nie.ac.in"
            />
          </div>
          <div>
            <label htmlFor="ticket" className="block text-sm font-medium text-gray-300 mb-1">
              Voting Ticket
            </label>
            <input
              id="ticket"
              type="text"
              value={ticket}
              onChange={e => setTicket(e.target.value.toUpperCase())}
              required
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white text-center font-mono text-lg"
              placeholder="Enter ticket from email"
            />
          </div>
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-white text-black hover:bg-gray-200 rounded-md font-semibold">Submit Vote</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ElectionDetail: React.FC<ElectionDetailProps> = ({ election, user, onVote, onBack, onStopElection }) => {
  const [modalState, setModalState] = useState({ isOpen: false, candidateId: null as string | null });
  const [isRequestingTicket, setIsRequestingTicket] = useState(false);
  const [ticketRequested, setTicketRequested] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [turnoutData, setTurnoutData] = useState<any>(null);
  const [genderStats, setGenderStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const buttonState = getButtonState(election, user);
  const { timeLeft, label } = useCountdown(election.startTime, election.endTime);

  const isElectionOver = new Date() > new Date(election.endTime);
  const isElectionLive = new Date() > new Date(election.startTime) && !isElectionOver;
  const showResults = isElectionOver || user?.role === 'teacher';

  // Fetch statistics when results are shown
  useEffect(() => {
    if (showResults) {
      const fetchStatistics = async () => {
        setLoadingStats(true);
        try {
          const [timeline, turnout, gender] = await Promise.all([
            getElectionTimeline(election.id),
            getElectionTurnout(election.id),
            getElectionGenderStats(election.id)
          ]);
          setTimelineData(timeline);
          setTurnoutData(turnout);
          setGenderStats(gender);
        } catch (error) {
          console.error('Error fetching statistics:', error);
        } finally {
          setLoadingStats(false);
        }
      };
      fetchStatistics();
    }
  }, [showResults, election.id]);

  let winners: Candidate[] = [];
  if (isElectionOver && election.results && Object.keys(election.results).length > 0) {
    const maxVotes = Math.max(...Object.values(election.results));
    const winnerIds = Object.keys(election.results).filter(id => election.results[id] === maxVotes);
    winners = election.candidates.filter(c => winnerIds.includes(c.id));
  }

  const handleInitiateVote = async (candidateId: string) => {
    // Request ticket via email first
    setIsRequestingTicket(true);
    setTicketError(null);
    try {
      await requestVotingTicket(election.id);
      setTicketRequested(true);
      setModalState({ isOpen: true, candidateId });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to request voting ticket.';
      setTicketError(message);
    } finally {
      setIsRequestingTicket(false);
    }
  };

  const handleConfirmVote = (ticket: string, email: string) => {
    if (modalState.candidateId) {
      onVote(election.id, modalState.candidateId, ticket, email);
      setModalState({ isOpen: false, candidateId: null });
      setTicketRequested(false);
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, candidateId: null });
    setTicketRequested(false);
    setTicketError(null);
  };

  return (
    <div className="space-y-12">
      <VoteModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        onSubmit={handleConfirmVote}
        candidateName={modalState.candidateId === 'NOTA' ? 'NOTA (None of the Above)' : election.candidates.find(c => c.id === modalState.candidateId)?.name || ''}
        userEmail={user?.email}
      />

      {isRequestingTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white">Sending voting ticket to your email...</p>
          </div>
        </div>
      )}

      {ticketError && (
        <div className="bg-red-500/10 border border-red-500 text-red-300 rounded-lg p-4 mb-4">
          <p className="font-bold">Error:</p>
          <p>{ticketError}</p>
          <button onClick={() => setTicketError(null)} className="mt-2 text-sm underline">Dismiss</button>
        </div>
      )}

      {ticketRequested && !modalState.isOpen && (
        <div className="bg-green-500/10 border border-green-500 text-green-300 rounded-lg p-4 mb-4">
          <p className="font-bold">✓ Voting ticket sent!</p>
          <p className="text-sm">Please check your email for the voting ticket. It is valid for 5 minutes.</p>
        </div>
      )}

      <button onClick={onBack} className="text-white font-semibold hover:text-gray-300 transition-colors">&larr; Back</button>

      <h2 className="text-4xl font-extrabold text-center text-white">{election.title}</h2>
      {election.description && <p className="text-center text-gray-400">{election.description}</p>}

      <div className="flex justify-center">
        <div className="p-4 rounded-lg bg-gray-700 text-center">
          <p className="text-gray-300">{label}</p>
          <p className="text-3xl font-bold text-white font-mono">{timeLeft}</p>
        </div>
      </div>

      {user?.role === 'teacher' && isElectionLive && (
        <div className="text-center">
          <button
            onClick={() => onStopElection(election.id)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
          >
            Stop Election Now
          </button>
        </div>
      )}

      <h3 className="text-2xl font-bold text-center">Candidates</h3>

      {election.userVoted && user?.role !== 'teacher' ? (
        <ThanksForVoting />
      ) : isElectionOver ? (
        <div className="text-center py-12">
          <h4 className="text-2xl font-bold text-white mb-2">Voting is Closed</h4>
          <p className="text-gray-400">The voting period for this election has ended.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {election.candidates.map(candidate => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onInitiateVote={handleInitiateVote}
                buttonState={buttonState}
                userRole={user?.role}
                isElectionOver={isElectionOver}
              />
            ))}
          </div>
          {user?.role !== 'teacher' && !isElectionOver && (
            <div className="flex justify-center mt-8">
              <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col items-center p-6 text-center w-full max-w-xs border-2 border-red-500/50">
                <div className="w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border-4 border-red-500/50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-white mb-4">None of the Above (NOTA)</h4>
                <button
                  onClick={() => handleInitiateVote('NOTA')}
                  disabled={buttonState.disabled}
                  className={`w-full py-2 px-4 rounded-md font-bold text-white transition-colors duration-300 ${buttonState.disabled ? buttonState.className : 'bg-red-600 hover:bg-red-700'}`}
                >
                  {buttonState.text}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <h3 className="text-2xl font-bold text-center">{showResults ? (isElectionOver ? 'Final Results' : 'Live Results') : 'Results Hidden'}</h3>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        {showResults ? (
          <>
            {winners.length > 0 && (
              <div className="text-center mb-6 bg-white/10 border border-white p-4 rounded-lg">
                <h4 className="text-lg font-bold text-white">{winners.length > 1 ? 'Winners (Tie)' : 'Winner'}</h4>
                {winners.map(winner => (
                  <div key={winner.id} className="mt-2">
                    <p className="text-2xl font-extrabold text-white">{winner.name}</p>
                    <p className="text-gray-400">Votes: {election.results[winner.id]}</p>
                  </div>
                ))}
              </div>
            )}
            <ResultsChart candidates={election.candidates} results={election.results} notaVotes={election.notaVotes || 0} />
            
            {/* Additional Statistics */}
            {loadingStats ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-gray-400">Loading statistics...</p>
              </div>
            ) : (
              <>
                {timelineData.length > 0 && (
                  <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <VotingTimelineChart data={timelineData} />
                  </div>
                )}
                
                {turnoutData && (
                  <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <VoterTurnoutAnalytics data={turnoutData} />
                  </div>
                )}
                
                {genderStats && (
                  <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-xl">
                    <GenderVoteChart data={genderStats} />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">Results will be revealed after {new Date(election.endTime).toLocaleString()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ElectionDetail;
