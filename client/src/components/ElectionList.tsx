import React from 'react';
import { Election } from '../types';
import { motion } from 'framer-motion';
import { useState, useEffect } from "react";
import { useSocket } from '../contexts/SocketContext';
import { useAuth } from '../contexts/AuthContext';

interface ElectionListProps {
  elections: Election[];
  onSelectElection: (id: string) => void;
  userRole: 'student' | 'teacher';
  onBack?: () => void;
}

/* Reusable status util */
const getElectionStatus = (startTime: string, endTime: string) => {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return { text: 'Upcoming' as const, tone: 'amber' };
  if (now > end) return { text: 'Closed' as const, tone: 'rose' };
  return { text: 'Live' as const, tone: 'emerald' };
};

const StatusPill: React.FC<{ startTime: string; endTime: string }> = ({ startTime, endTime }) => {
  const s = getElectionStatus(startTime, endTime);
  const classes =
    s.text === 'Live'
      ? 'bg-emerald-500/10 text-emerald-300'
      : s.text === 'Upcoming'
      ? 'bg-yellow-500/10 text-yellow-300'
      : 'bg-rose-500/10 text-rose-300';
  return <span className={`px-3 py-1 rounded-full text-sm font-semibold ${classes}`}>{s.text}</span>;
};

/* Premium card for teacher + student unified */
const ElectionCard: React.FC<{ election: Election; onSelect: (id: string) => void; userRole: 'student' | 'teacher' }> = ({ election, onSelect, userRole }) => {
  const now = new Date();
  const status = getElectionStatus(election.startTime, election.endTime);
  const isClosed = status.text === 'Closed';

  // compute winner if closed
  let winnerName = '';
  let winnerVotes = 0;
  if (isClosed && election.results && Object.keys(election.results).length > 0) {
    try {
      const maxVotes = Math.max(...Object.values(election.results));
      const winners = Object.keys(election.results).filter(id => election.results[id] === maxVotes);
      if (winners.length > 1) {
        winnerName = 'Tie';
        winnerVotes = maxVotes;
      } else {
        const winnerId = winners[0];
        const w = election.candidates.find(c => c.id === winnerId);
        if (w) {
          winnerName = w.name;
          winnerVotes = maxVotes;
        }
      }
    } catch (e) {
      console.error('Winner calc error', e);
    }
  }

  return (
    <motion.article
      layout
      whileHover={{ scale: 1.03 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      onClick={() => onSelect(election.id)}
      className="cursor-pointer group"
    >
      <div
        className={`relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-2xl shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] p-5 h-full flex flex-col`}
      >
        {/* subtle glossy topper */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-white">{election.title}</h3>
            <p className="text-sm text-gray-400 mt-1 max-w-[36ch]">{election.description}</p>
          </div>
          <div className="ml-4">
            <StatusPill startTime={election.startTime} endTime={election.endTime} />
          </div>
        </div>

        <div className="mt-4 flex-1">
          <ul className="text-sm text-gray-400 space-y-2">
            <li>Starts: <span className="text-gray-300">{new Date(election.startTime).toLocaleString()}</span></li>
            <li>Ends: <span className="text-gray-300">{new Date(election.endTime).toLocaleString()}</span></li>
            <li>Candidates: <span className="text-gray-300">{election.candidates.length}</span></li>
          </ul>

          {isClosed && winnerName && (
            <div className="mt-4 bg-white/[0.03] border border-white/8 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Winner</p>
                <p className="font-semibold text-white">{winnerName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">{winnerVotes}</p>
                <p className="text-xs text-gray-400">Votes</p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-5">
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(election.id); }}
            className="w-full py-2 rounded-lg bg-gradient-to-r from-white to-gray-200 text-black font-semibold shadow hover:scale-[1.01] transition"
          >
            View Details →
          </button>
        </div>
      </div>
    </motion.article>
  );
};

const ElectionList: React.FC<ElectionListProps> = ({ elections: initialElections, onSelectElection, userRole }) => {
  const [elections, setElections] = useState(initialElections);
  const { socket } = useSocket();
  const { currentUser } = useAuth();

  useEffect(() => {
    setElections(initialElections);
  }, [initialElections]);

  useEffect(() => {
    if (userRole === 'student' && socket) {
      const handleElectionCreated = (data: any) => {
        const newElection = data.election;
        if (currentUser?.branch === newElection.branch && currentUser?.section === newElection.section) {
          setElections(prevElections => {
            if (!prevElections.find(e => e.id === newElection.id)) {
              return [newElection, ...prevElections];
            }
            return prevElections;
          });
        }
      };

      socket.on('election:created', handleElectionCreated);

      return () => {
        socket.off('election:created', handleElectionCreated);
      };
    }
  }, [userRole, currentUser, socket]);

  useEffect(() => {
    const interval = setInterval(() => {
      setElections(elections => [...elections]);
    }, 1000); // Rerender every second to update timers

    return () => clearInterval(interval);
  }, []);

  const title = userRole === 'student' ? 'Your Elections' : 'Manage Your Elections';
  const subtitle = userRole === 'student'
    ? 'Elections for your class are listed below. For live elections, use the ticket to vote.'
    : 'Here are the elections you have created. Click a card to view details and analytics.';

  if (elections.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-3xl font-bold text-white">No Elections Found</h2>
        <p className="text-gray-400 mt-3">{userRole === 'student' ? "There are currently no scheduled elections." : "You haven't created any elections yet."}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="text-4xl font-extrabold text-white text-center mb-2">{title}</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="text-lg text-gray-400 text-center mb-10 max-w-2xl mx-auto">{subtitle}</motion.p>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {elections.map(e => (
          <ElectionCard key={e.id} election={e} onSelect={onSelectElection} userRole={userRole} />
        ))}
      </motion.div>
    </div>
  );
};

export default ElectionList;
