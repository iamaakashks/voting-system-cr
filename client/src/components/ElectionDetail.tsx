import React, { useState, useEffect } from 'react';
import { Election, Candidate, User } from '../types';
import ResultsChart from './ResultsChart';

interface ElectionDetailProps {
  election: Election;
  user: User | null;
  onVote: (electionId: string, candidateId: string, ticket: string) => void;
  onBack: () => void;
  onStopElection: (electionId: string) => void;
}

// Countdown timer hook
const useCountdown = (endTime: string) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(endTime) - +new Date();
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }
      return 'Election Closed';
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return timeLeft;
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

  return { text: 'Cast Vote', disabled: false, className: 'bg-blue-600 hover:bg-blue-700' };
};

const CandidateCard: React.FC<{
  candidate: Candidate;
  onInitiateVote: (candidateId: string) => void;
  buttonState: ReturnType<typeof getButtonState>;
}> = ({ candidate, onInitiateVote, buttonState }) => (
  <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col items-center p-6 text-center">
    <img src={candidate.imageUrl} alt={candidate.name} className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-700" />
    <h4 className="text-lg font-semibold text-white mb-4">{candidate.name}</h4>
    <button
      onClick={() => onInitiateVote(candidate.id)}
      disabled={buttonState.disabled}
      className={`w-full py-2 px-4 rounded-md font-bold text-white transition-colors duration-300 ${buttonState.className}`}
    >
      {buttonState.text}
    </button>
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
  onSubmit: (ticket: string) => void;
  candidateName: string;
}> = ({ isOpen, onClose, onSubmit, candidateName }) => {
  const [ticket, setTicket] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket.trim()) onSubmit(ticket.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-white mb-2">Confirm Your Vote</h3>
        <p className="text-gray-400 mb-6">Voting for <span className="font-bold text-blue-300">{candidateName}</span></p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={ticket}
            onChange={e => setTicket(e.target.value.toUpperCase())}
            required
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-3 mt-1 text-white text-center font-mono text-lg"
            placeholder="ABC-123-XYZ"
          />
          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">Submit Vote</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ElectionDetail: React.FC<ElectionDetailProps> = ({ election, user, onVote, onBack, onStopElection }) => {
  const [modalState, setModalState] = useState({ isOpen: false, candidateId: null as string | null });
  const buttonState = getButtonState(election, user);
  const timeLeft = useCountdown(election.endTime);

  const isElectionOver = new Date() > new Date(election.endTime);
  const isElectionLive = new Date() > new Date(election.startTime) && !isElectionOver;
  const showResults = isElectionOver || user?.role === 'teacher';

  let winner: Candidate | null = null;
  if (isElectionOver && Object.keys(election.results).length > 0) {
    const winnerId = Object.keys(election.results).reduce((a, b) =>
      election.results[a] > election.results[b] ? a : b
    );
    winner = election.candidates.find(c => c.id === winnerId) || null;
  }

  const handleInitiateVote = (candidateId: string) => setModalState({ isOpen: true, candidateId });
  const handleConfirmVote = (ticket: string) => {
    if (modalState.candidateId) onVote(election.id, modalState.candidateId, ticket);
    setModalState({ isOpen: false, candidateId: null });
  };

  return (
    <div className="space-y-12">
      <VoteModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, candidateId: null })}
        onSubmit={handleConfirmVote}
        candidateName={election.candidates.find(c => c.id === modalState.candidateId)?.name || ''}
      />

      <button onClick={onBack} className="text-blue-400 font-semibold">&larr; Back</button>

      <h2 className="text-4xl font-extrabold text-center text-white">{election.title}</h2>
      {election.description && <p className="text-center text-gray-400">{election.description}</p>}

      <div className="flex justify-center">
        <div className="p-4 rounded-lg bg-gray-700 text-center">
          <p className="text-gray-300">{isElectionLive ? 'Time Remaining' : isElectionOver ? 'Election Ended' : 'Time Until Start'}</p>
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

      {election.userVoted ? (
        <ThanksForVoting />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {election.candidates.map(candidate => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onInitiateVote={handleInitiateVote}
              buttonState={buttonState}
            />
          ))}
        </div>
      )}

      <h3 className="text-2xl font-bold text-center">{showResults ? (isElectionOver ? 'Final Results' : 'Live Results') : 'Results Hidden'}</h3>

      <div className="bg-gray-800 p-6 rounded-lg shadow-xl">
        {showResults ? (
          <>
            {winner && (
              <div className="text-center mb-6 bg-yellow-500/10 border border-yellow-500 p-4 rounded-lg">
                <h4 className="text-lg font-bold text-yellow-300">Winner</h4>
                <p className="text-2xl font-extrabold text-white">{winner.name}</p>
                <p className="text-gray-400">Votes: {election.results[winner.id]}</p>
              </div>
            )}
            <ResultsChart candidates={election.candidates} results={election.results} />
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
