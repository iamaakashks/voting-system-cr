import React from 'react';
import { Election } from '../types';

interface ElectionListProps {
  elections: Election[];
  onSelectElection: (id: string) => void;
  userRole: 'student' | 'teacher';
}

const getElectionStatus = (startTime: string, endTime: string): { text: 'Live' | 'Upcoming' | 'Closed'; className: string } => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) {
    return { text: 'Upcoming', className: 'bg-yellow-500/20 text-yellow-300' };
  }
  if (now > end) {
    return { text: 'Closed', className: 'bg-red-500/20 text-red-300' };
  }
  return { text: 'Live', className: 'bg-green-500/20 text-green-300 animate-pulse' };
};

const ElectionStatusBadge: React.FC<{ startTime: string; endTime: string }> = ({ startTime, endTime }) => {
  const status = getElectionStatus(startTime, endTime);
  const baseClasses = 'px-3 py-1 text-sm font-semibold rounded-full';
  return <span className={`${baseClasses} ${status.className}`}>{status.text}</span>;
};

const ElectionCard: React.FC<{ election: Election; onSelect: (id: string) => void, userRole: 'student' | 'teacher' }> = ({ election, onSelect, userRole }) => {
    const status = getElectionStatus(election.startTime, election.endTime);
    const isClosed = status.text === 'Closed';

    let winnerName = '';
    let winnerVotes = 0;
    if (isClosed && election.candidates.length > 0 && election.results && Object.keys(election.results).length > 0) {
        try {
            const winnerId = Object.keys(election.results).reduce((a, b) => election.results[a] > election.results[b] ? a : b);
            const winner = election.candidates.find(c => c.id === winnerId);
            if (winner) {
                winnerName = winner.name;
                winnerVotes = election.results[winnerId];
            }
        } catch(e) {
            console.error("Could not determine winner", e);
        }
    }


    const handleCardClick = () => {
        onSelect(election.id);
    };

    const copyTicket = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click when copying
        if (election.userTicket) {
            navigator.clipboard.writeText(election.userTicket);
            // In a real app, you'd show a toast notification here
            alert('Ticket copied to clipboard!');
        }
    }

    return (
      <div 
        className="bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 flex flex-col"
      >
        <div className="p-6 flex-grow cursor-pointer" onClick={handleCardClick}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-blue-300">{election.title}</h3>
            <ElectionStatusBadge startTime={election.startTime} endTime={election.endTime} />
          </div>
          <p className="text-gray-400 mb-6 h-20 overflow-hidden">{election.description}</p>
        </div>
        
        {userRole === 'student' && status.text === 'Live' && election.userTicket && !election.userVoted && (
            <div className="bg-gray-900/50 px-6 py-4 border-t border-blue-500/30">
                <p className="text-xs text-gray-400 mb-1">Your Voting Ticket:</p>
                <div className="flex items-center justify-between gap-2">
                    <code className="text-blue-300 font-mono font-bold text-lg tracking-widest">{election.userTicket}</code>
                    <button onClick={copyTicket} className="p-2 rounded-md hover:bg-gray-700 transition-colors" title="Copy ticket">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                </div>
            </div>
        )}
        
        {isClosed && winnerName && (
             <div className="bg-yellow-900/50 px-6 py-4 border-t border-yellow-500/30">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-yellow-400 mb-1">Winner Declared:</p>
                        <p className="font-bold text-lg text-yellow-300">{winnerName}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-white">{winnerVotes}</p>
                        <p className="text-xs text-yellow-400">Votes</p>
                    </div>
                </div>
            </div>
        )}

        <div className="p-6 pt-4 mt-auto cursor-pointer" onClick={handleCardClick}>
          <div className="flex justify-end">
             <button className="text-blue-400 font-semibold hover:text-blue-300 transition-colors">
                View Details &rarr;
              </button>
          </div>
        </div>
      </div>
    );
}

const ElectionList: React.FC<ElectionListProps> = ({ elections, onSelectElection, userRole }) => {
  const title = userRole === 'student' ? "Your Elections" : "Manage Your Elections";
  const subtitle = userRole === 'student'
    ? "Elections for your class are listed below. For live elections, your secret ticket is shown on the card."
    : "Here are the elections you have created. Click to view details and results.";
    
  if (elections.length === 0) {
      return (
          <div className="text-center py-16">
            <h2 className="text-3xl font-bold text-white">No Elections Found</h2>
            <p className="text-lg text-gray-400 mt-4">
                {userRole === 'student' 
                    ? "There are currently no elections scheduled for your branch and section."
                    : "You haven't created any elections yet."}
            </p>
          </div>
      );
  }

  return (
    <div>
      <h2 className="text-4xl font-extrabold text-center mb-2 text-white">{title}</h2>
      <p className="text-lg text-gray-400 text-center mb-12 max-w-2xl mx-auto">{subtitle}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {elections.map(election => (
          <ElectionCard key={election.id} election={election} onSelect={onSelectElection} userRole={userRole} />
        ))}
      </div>
    </div>
  );
};

export default ElectionList;