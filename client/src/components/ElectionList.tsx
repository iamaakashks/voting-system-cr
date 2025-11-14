import React from 'react';
import { Election } from '../types';

interface ElectionListProps {
  elections: Election[];
  onSelectElection: (id: string) => void;
  userRole: 'student' | 'teacher';
  onBack?: () => void;
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
            const voteCounts = Object.values(election.results);
            const maxVotes = Math.max(...voteCounts);
            const winners = Object.keys(election.results).filter(id => election.results[id] === maxVotes);

            if (winners.length > 1) {
                winnerName = 'Tie';
                winnerVotes = maxVotes;
            } else {
                const winnerId = winners[0];
                const winner = election.candidates.find(c => c.id === winnerId);
                if (winner) {
                    winnerName = winner.name;
                    winnerVotes = maxVotes;
                }
            }
        } catch(e) {
            console.error("Could not determine winner", e);
        }
    }


    const handleCardClick = () => {
        onSelect(election.id);
    };


    // Different styling for teacher vs student cards
    if (userRole === 'teacher') {
      return (
        <div 
          className={`${isClosed ? 'bg-gray-800' : 'bg-gradient-to-br from-gray-900 via-gray-800 to-black'} border border-gray-600 rounded-lg shadow-2xl overflow-hidden transform transition-all duration-300 flex flex-col ${isClosed ? 'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]' : 'hover:border-gray-500 hover:shadow-white/20'}`}
        >
          {/* Header with border accent */}
          <div className={`border-b border-gray-700 ${isClosed ? 'bg-gray-800' : 'bg-gradient-to-r from-gray-800 to-gray-900'} px-6 py-4`}>
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">{election.title}</h3>
              <ElectionStatusBadge startTime={election.startTime} endTime={election.endTime} />
            </div>
          </div>

          <div className="p-6 flex-grow cursor-pointer" onClick={handleCardClick}>
            {election.description && (
              <p className="text-gray-300 mb-4 text-sm leading-relaxed">{election.description}</p>
            )}
            
            {/* Election Info */}
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400">Start: {new Date(election.startTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-400">End: {new Date(election.endTime).toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-gray-400">Candidates: {election.candidates.length}</span>
              </div>
            </div>

            {/* Winner section for closed elections */}
            {isClosed && winnerName && (
              <div className="bg-gray-800/50 border border-gray-700 rounded p-3 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Winner:</p>
                    <p className="font-bold text-base text-white">{winnerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-base text-white">{winnerVotes}</p>
                    <p className="text-xs text-gray-400">Votes</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with action button */}
          <div className={`border-t border-gray-700 ${isClosed ? 'bg-gray-800' : 'bg-gradient-to-r from-gray-800 to-gray-900'} px-6 py-4 cursor-pointer`} onClick={handleCardClick}>
            <button className="w-full py-2 px-4 bg-white text-black font-semibold rounded hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
              <span>View Details</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      );
    }

    // Student card design (original)
    return (
      <div 
        className={`bg-gray-800 rounded-lg shadow-xl overflow-hidden transform transition-all duration-300 flex flex-col ${isClosed ? 'hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]' : 'hover:scale-105 hover:shadow-2xl hover:shadow-white/20'}`}
      >
        <div className="p-6 flex-grow cursor-pointer" onClick={handleCardClick}>
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-bold text-white">{election.title}</h3>
            <ElectionStatusBadge startTime={election.startTime} endTime={election.endTime} />
          </div>
          {election.description && <p className="text-gray-400 mb-6 h-20 overflow-hidden">{election.description}</p>}
        </div>
        
        {/* Tickets are now sent via email when user requests to vote */}
        
        {isClosed && winnerName && (
             <div className="bg-white/10 px-6 py-4 border-t border-white/30">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-400 mb-1">Winner Declared:</p>
                        <p className="font-bold text-lg text-white">{winnerName}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg text-white">{winnerVotes}</p>
                        <p className="text-xs text-gray-400">Votes</p>
                    </div>
                </div>
            </div>
        )}

        <div className="p-6 pt-4 mt-auto cursor-pointer" onClick={handleCardClick}>
          <div className="flex justify-end">
             <button className="text-white font-semibold hover:text-gray-300 transition-colors">
                View Details &rarr;
              </button>
          </div>
        </div>
      </div>
    );
}

const ElectionList: React.FC<ElectionListProps> = ({ elections, onSelectElection, userRole, onBack }) => {
  const title = userRole === 'student' ? "Your Elections" : "Manage Your Elections";
  const subtitle = userRole === 'student'
    ? "Elections for your class are listed below. For live elections, your secret ticket is shown on the card."
    : "Here are the elections you have created. Click to view details and results.";
    
  if (elections.length === 0) {
      return (
          <div>
            {onBack && (
              <button onClick={onBack} className="mb-4 text-white font-semibold hover:text-gray-300 transition-colors flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
            )}
            <div className="text-center py-16">
              <h2 className="text-3xl font-bold text-white">No Elections Found</h2>
              <p className="text-lg text-gray-400 mt-4">
                  {userRole === 'student' 
                      ? "There are currently no elections scheduled for your branch and section."
                      : "You haven't created any elections yet."}
              </p>
            </div>
          </div>
      );
  }

  return (
    <div>
      {onBack && (
        <button onClick={onBack} className="mb-4 text-white font-semibold hover:text-gray-300 transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      )}
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