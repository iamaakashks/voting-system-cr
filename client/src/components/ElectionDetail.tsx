// ===========================
//  ElectionDetail.tsx
//  Neon Pack-A — Clean Consolidated Version
//  CandidateCard Version 1
// ===========================

import React, { useState, useEffect } from "react";
import { Election, Candidate, User } from "../types";
import ResultsChart from "./ResultsChart";
import VotingTimelineChart from "./VotingTimelineChart";
import VoterTurnoutAnalytics from "./VoterTurnoutAnalytics";
import GenderVoteChart from "./GenderVoteChart";
import {
  requestVotingTicket,
  getElectionTimeline,
  getElectionTurnout,
  getElectionGenderStats,
} from "../services/api";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ElectionDetailProps {
    election: Election;
    user: User | null;
    onVote: (electionId: string, candidateId: string, ticket: string, email: string) => void;
    onBack: () => void;
    onStopElection: (electionId: string) => void;
}

// ---------------------------------------------------------
// Countdown Hook
// ---------------------------------------------------------
const useCountdown = (startTime: string, endTime: string) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [label, setLabel] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = +new Date();
      const start = +new Date(startTime);
      const end = +new Date(endTime);

      let difference: number;
      if (now < start) {
        difference = start - now;
        setLabel("Time Until Start");
      } else if (now < end) {
        difference = end - now;
        setLabel("Time Remaining");
      } else {
        setTimeLeft("Election Closed");
        setLabel("Election Ended");
        return;
      }

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft("0d 0h 0m 0s");
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [startTime, endTime]);

  return { timeLeft, label };
};

// ---------------------------------------------------------
// Button State Logic
// ---------------------------------------------------------
const getButtonState = (election: Election, user: User | null) => {
  const now = new Date();
  const start = new Date(election.startTime);
  const end = new Date(election.endTime);

  if (user?.role === "teacher")
    return {
      text: "Teachers Cannot Vote",
      disabled: true,
      className: "bg-gray-600 cursor-not-allowed",
    };

  if (election.userVoted)
    return {
      text: "You Have Voted",
      disabled: true,
      className: "bg-green-700 cursor-not-allowed",
    };

  if (now < start)
    return {
      text: "Voting Not Started",
      disabled: true,
      className: "bg-yellow-700 cursor-not-allowed",
    };

  if (now > end)
    return {
      text: "Voting Closed",
      disabled: true,
      className: "bg-red-700 cursor-not-allowed",
    };

  return {
    text: "Cast Vote",
    disabled: false,
    className: "bg-white text-black hover:bg-gray-200",
  };
};

// ---------------------------------------------------------
// Candidate Card — Version 1 (Soft Neon)
// ---------------------------------------------------------
const CandidateCard: React.FC<{
  candidate: Candidate;
  onInitiateVote: (id: string) => void;
  buttonState: ReturnType<typeof getButtonState>;
  userRole?: "student" | "teacher";
  isElectionOver: boolean;
}> = ({ candidate, onInitiateVote, buttonState, userRole, isElectionOver }) => (
  <div
    className="
      bg-gray-800 rounded-xl shadow-lg overflow-hidden flex flex-col items-center p-6 text-center
      border border-gray-700
      transition-all duration-300
      hover:border-[#4deeea] hover:shadow-[0_0_16px_#4deeea55]
    "
  >
    <img
      src={candidate.imageUrl}
      alt={candidate.name}
      className="
        w-32 h-32 rounded-full object-cover mb-4 
        border-4 border-gray-700 
        transition-all duration-300
        hover:border-[#a86aff] hover:shadow-[0_0_20px_#a86aff55]
      "
    />

    <h4 className="text-lg font-semibold text-white mb-4">
      {candidate.name}
    </h4>

    {userRole !== "teacher" && !isElectionOver && (
      <button
        onClick={() => onInitiateVote(candidate.id)}
        disabled={buttonState.disabled}
        className={`
          w-full py-2 px-4 rounded-md font-bold text-white transition-all duration-300
          ${buttonState.className}
          ${!buttonState.disabled ? "hover:shadow-[0_0_12px_#4deeea99]" : ""}
        `}
      >
        {buttonState.text}
      </button>
    )}
  </div>
);

// ---------------------------------------------------------
// Thanks For Voting Box — Neon
// ---------------------------------------------------------
const ThanksForVoting = () => (
  <div
    className="
      bg-green-500/10 border border-green-500 text-green-300 
      rounded-lg p-12 text-center shadow-lg
      transition-all duration-300
      hover:shadow-[0_0_18px_#4deeea66]
    "
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-24 w-24 text-green-400 mx-auto mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>

    <h4 className="text-3xl font-bold text-white mb-2">Thanks for Voting!</h4>
    <p className="text-lg text-gray-300">
      Your vote has been recorded successfully.
    </p>
  </div>
);

// ---------------------------------------------------------
// Vote Modal
// ---------------------------------------------------------
const VoteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: string, email: string) => void;
  candidateName: string;
  userEmail?: string;
}> = ({ isOpen, onClose, onSubmit, candidateName, userEmail }) => {
  const [ticket, setTicket] = useState("");
  const [email, setEmail] = useState(userEmail || "");

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
  }, [userEmail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticket.trim() && email.trim()) {
      onSubmit(ticket.trim().toUpperCase(), email.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="
        fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm
        flex items-center justify-center z-50
      "
      onClick={onClose}
    >
      <div
        className="
          bg-[#111827] rounded-xl shadow-xl p-8 w-full max-w-md 
          border border-[#4deeea55]
          transition-all duration-300
          hover:shadow-[0_0_20px_#4deeea99]
        "
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-2xl font-bold text-white mb-1">
          Confirm Your Vote
        </h3>

        <p className="text-gray-400 mb-4">
          Voting for{" "}
          <span className="font-bold text-white">{candidateName}</span>
        </p>

        <p className="text-sm text-gray-300 mb-4">
          Enter the voting ticket sent to your email.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="
                w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white
                focus:ring-2 focus:ring-[#4deeea]
              "
              placeholder="your.email@nie.ac.in"
            />
          </div>

          {/* Ticket */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Voting Ticket
            </label>
            <input
              type="text"
              value={ticket}
              onChange={(e) => setTicket(e.target.value.toUpperCase())}
              required
              className="
                w-full bg-gray-700 border border-gray-600 rounded-md p-3 text-white text-center 
                font-mono text-lg tracking-wider
                focus:ring-2 focus:ring-[#a86aff]
              "
              placeholder="TICKET CODE"
            />
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 rounded-md hover:bg-gray-500 text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="
                px-6 py-2 bg-white text-black rounded-md font-semibold
                hover:bg-gray-200 hover:shadow-[0_0_12px_#4deeea66]
              "
            >
              Submit Vote
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
// ===========================
// PART 2 / 3
// Loading overlay, Error/Success boxes, NOTA card, main component start
// ===========================

// ---------------------------------------------------------
// Neon Loading Overlay
// ---------------------------------------------------------
const NeonLoadingOverlay: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
    <div
      className="
        bg-gray-900 rounded-xl shadow-xl p-8 text-center
        border border-[#4deeea55]
        hover:shadow-[0_0_20px_#4deeea88]
        transition-all
      "
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4deeea] mx-auto mb-4" />
      <p className="text-white">Sending voting ticket to your email...</p>
    </div>
  </div>
);

// ---------------------------------------------------------
// Neon Error Box
// ---------------------------------------------------------
const NeonErrorBox: React.FC<{ message: string; onDismiss: () => void }> = ({
  message,
  onDismiss,
}) => (
  <div
    className="
      bg-red-500/10 border border-red-500 text-red-300 
      rounded-lg p-4 mb-4
      transition-all duration-300
      hover:shadow-[0_0_12px_#ff4d4d55]
    "
  >
    <p className="font-bold">Error:</p>
    <p>{message}</p>
    <button onClick={onDismiss} className="mt-2 text-sm underline">
      Dismiss
    </button>
  </div>
);

// ---------------------------------------------------------
// Neon Success Box
// ---------------------------------------------------------
const NeonSuccessBox: React.FC = () => (
  <div
    className="
      bg-green-500/10 border border-green-500 text-green-300 
      rounded-lg p-4 mb-4
      transition-all duration-300
      hover:shadow-[0_0_12px_#4deeea55]
    "
  >
    <p className="font-bold">✓ Voting ticket sent!</p>
    <p className="text-sm">Check your email (valid for 5 minutes).</p>
  </div>
);

// ---------------------------------------------------------
// NOTA Card (single, consolidated)
// ---------------------------------------------------------
const NotaCard: React.FC<{
  onClick: () => void;
  buttonState: ReturnType<typeof getButtonState>;
}> = ({ onClick, buttonState }) => (
  <div
    className="
      bg-gray-900 rounded-xl shadow-lg overflow-hidden flex flex-col items-center p-6 text-center w-full max-w-xs
      border border-red-500/40
      hover:shadow-[0_0_20px_#ff4d4d88]
      transition-all duration-300
    "
  >
    <div
      className="
        w-32 h-32 rounded-full bg-red-500/20 flex items-center justify-center mb-4
        border-4 border-red-500/40
        shadow-[0_0_14px_#ff4d4d55]
      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-16 w-16 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>

    <h4 className="text-lg font-semibold text-white mb-4">None of the Above (NOTA)</h4>

    <button
      onClick={onClick}
      disabled={buttonState.disabled}
      className={`
        w-full py-2 px-4 rounded-md font-bold text-white transition-all duration-300
        ${buttonState.disabled ? buttonState.className : "bg-red-600 hover:bg-red-700"}
        ${!buttonState.disabled ? "hover:shadow-[0_0_14px_#ff4d4d77]" : ""}
      `}
    >
      {buttonState.text}
    </button>
  </div>
);

// ---------------------------------------------------------
// Main ElectionDetail component (start)
// ---------------------------------------------------------
const ElectionDetail: React.FC<ElectionDetailProps> = ({
  election,
  user,
  onVote,
  onBack,
  onStopElection,
}) => {
  const [modalState, setModalState] = useState<{ isOpen: boolean; candidateId: string | null }>({
    isOpen: false,
    candidateId: null,
  });
  const [isRequestingTicket, setIsRequestingTicket] = useState(false);
  const [ticketRequested, setTicketRequested] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);

  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [turnoutData, setTurnoutData] = useState<any | null>(null);
  const [genderStats, setGenderStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const buttonState = getButtonState(election, user);
  const { timeLeft, label } = useCountdown(election.startTime, election.endTime);

  const isElectionOver = new Date() > new Date(election.endTime);
  const isElectionLive = new Date() > new Date(election.startTime) && !isElectionOver;
  const showResults = isElectionOver || user?.role === "teacher";

  // Fetch analytics (unchanged logic)
  useEffect(() => {
    if (!showResults) return;
    let mounted = true;
    const fetchStatistics = async () => {
      setLoadingStats(true);
      try {
        const [timeline, turnout, gender] = await Promise.all([
          getElectionTimeline(election.id),
          getElectionTurnout(election.id),
          getElectionGenderStats(election.id),
        ]);
        if (!mounted) return;
        setTimelineData(timeline);
        setTurnoutData(turnout);
        setGenderStats(gender);
      } catch (err) {
        console.error("Error fetching statistics:", err);
      } finally {
        if (mounted) setLoadingStats(false);
      }
    };
    fetchStatistics();
    return () => {
      mounted = false;
    };
  }, [showResults, election.id, election.results]);

  // Voting flow handlers (identical logic)
  const handleInitiateVote = async (candidateId: string) => {
    setIsRequestingTicket(true);
    setTicketError(null);
    try {
      await requestVotingTicket(election.id);
      setTicketRequested(true);
      setModalState({ isOpen: true, candidateId });
    } catch (err: any) {
      setTicketError(err?.response?.data?.message || "Failed to request voting ticket.");
    } finally {
      setIsRequestingTicket(false);
    }
  };

  const handleConfirmVote = (ticket: string, email: string) => {
    if (!modalState.candidateId) return;
    onVote(election.id, modalState.candidateId, ticket, email);
    setModalState({ isOpen: false, candidateId: null });
    setTicketRequested(false);
  };

  const closeModal = () => {
    setModalState({ isOpen: false, candidateId: null });
    setTicketRequested(false);
    setTicketError(null);
  };
  
  const handleDownload = () => {
    setIsDownloadingPdf(true);
    const input = document.getElementById('results-analytics');
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        html2canvas(input, {
          useCORS: true,
          scale: 2,
          backgroundColor: '#0B0E14',
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.offsetHeight,
        }).then((canvas) => {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          let position = 0;
          let heightLeft = pdfHeight;
          while (heightLeft >= 0) {
            position = heightLeft - pdfHeight;
            pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
            heightLeft -= pdf.internal.pageSize.getHeight();
            if (heightLeft > 0) {
              pdf.addPage();
            }
          }
          pdf.save(`${election.title.replace(/ /g, '_')}_results.pdf`);
          setIsDownloadingPdf(false);
        }).catch(err => {
          console.error("Error generating PDF:", err);
          setIsDownloadingPdf(false);
        });
      }, 500);
    } else {
      setIsDownloadingPdf(false);
    }
  };
  
  // ----------------------------------------------------------------
  // Render — main UI up to the candidates list (keeps original layout)
  // ----------------------------------------------------------------
  return (
    <div className="space-y-12">
      {/* Back */}
      <button onClick={onBack} className="text-white font-semibold hover:text-[#4deeea] transition-colors">
        &larr; Back
      </button>
      {/* Modal / Overlays / Notifications */}
      <VoteModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onSubmit={handleConfirmVote}
        candidateName={
          modalState.candidateId === "NOTA"
            ? "NOTA (None of the Above)"
            : election.candidates.find((c) => c.id === modalState.candidateId)?.name || ""
        }
        userEmail={user?.email}
      />

      {isRequestingTicket && <NeonLoadingOverlay />}
      {ticketError && <NeonErrorBox message={ticketError} onDismiss={() => setTicketError(null)} />}
      {ticketRequested && !modalState.isOpen && <NeonSuccessBox />}

      

      {/* Header */}
      <h2 className="text-4xl font-extrabold text-center text-white">{election.title}</h2>
      {election.description && <p className="text-center text-gray-400">{election.description}</p>}

      {/* Timer */}
      <div className="flex justify-center">
        <div
          className="
            p-4 rounded-lg bg-gray-900 text-center border border-[#4deeea55]
            shadow-[0_0_14px_#4deeea33]
            hover:shadow-[0_0_20px_#a86aff55]
            transition-all
          "
        >
          <p className="text-gray-300">{label}</p>
          <p className="text-3xl font-bold text-white font-mono tracking-widest">{timeLeft}</p>
        </div>
      </div>

      {/* Teacher Stop */}
      {user?.role === "teacher" && isElectionLive && (
        <div className="text-center">
          <button
            onClick={() => onStopElection(election.id)}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-all hover:shadow-[0_0_14px_#ff4d4d77]"
          >
            Stop Election Now
          </button>
        </div>
      )}

      {/* Candidates title */}
      <h3 className="text-2xl font-bold text-center">Candidates</h3>

      {/* Voting / Thanks / Closed states will be rendered below */}
      {election.userVoted && user?.role !== "teacher" ? (
        <ThanksForVoting />
      ) : isElectionOver ? (
        <div className="text-center py-12">
          <h4 className="text-2xl font-bold text-white mb-2">Voting is Closed</h4>
          <p className="text-gray-400">The voting period has ended.</p>
        </div>
      ) : (
        <>
          {/* Candidate Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {election.candidates.map((candidate) => (
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

          {/* NOTA */}
          {user?.role !== "teacher" && !isElectionOver && (
            <div className="flex justify-center mt-8">
              <NotaCard onClick={() => handleInitiateVote("NOTA")} buttonState={buttonState} />
            </div>
          )}
        </>
      )}
  {/* ===========================
      RESULTS & ANALYTICS
      =========================== */}
    <div id="results-analytics">
      <h3 className="text-2xl font-bold text-center mt-12">
        {showResults
          ? isElectionOver
            ? "Final Results"
            : "Live Results"
          : "Results Hidden"}
      </h3>
  
      <div
        className="
          bg-gray-900 p-6 rounded-xl shadow-xl
          border border-[#4deeea33]
          mt-4
          hover:shadow-[0_0_20px_#4deeea55]
          transition-all
        "
      >
        {showResults ? (
          <>
            {/* ===========================
                WINNER BOX
                =========================== */}
            {(() => {
              let winners: Candidate[] = [];

              if (isElectionOver && election.results && Object.keys(election.results).length > 0) {
                const maxVotes = Math.max(...Object.values(election.results));
                const winnerIds = Object.keys(election.results).filter(
                  (id) => election.results[id] === maxVotes
                );
                winners = election.candidates.filter((c) => winnerIds.includes(c.id));
              }

              return winners.length > 0 ? (
                <div
                  className="
                    text-center mb-6 p-4 rounded-lg
                    bg-white/5 border border-white/20
                    shadow-[0_0_18px_#a86aff55]
                  "
                >
                  <h4 className="text-lg font-bold text-white">
                    {winners.length > 1 ? "Winners (Tie)" : "Winner"}
                  </h4>

                  {winners.map((winner) => (
                    <div key={winner.id} className="mt-2">
                      <p className="text-2xl font-extrabold text-white">{winner.name}</p>
                      <p className="text-gray-400">
                        Votes: {election.results[winner.id]}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null;
            })()}

            {/* ===========================
                MAIN RESULTS CHART
                =========================== */}
            <ResultsChart
              candidates={election.candidates}
              results={election.results}
              notaVotes={election.notaVotes || 0}
            />

            {/* ===========================
                LOADING ANALYTICS
                =========================== */}
            {loadingStats ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4deeea] mx-auto mb-4"></div>
                <p className="text-gray-400">Loading analytics…</p>
              </div>
            ) : (
              <>
                {/* ===========================
                    VOTING TIMELINE
                    =========================== */}
                {timelineData.length > 0 && (
                  <div
                    className="
                      mt-8 bg-gray-900 p-6 rounded-xl shadow-xl
                      border border-[#4deeea33]
                      hover:shadow-[0_0_20px_#4deeea55]
                      transition-all
                    "
                  >
                    <VotingTimelineChart data={timelineData} />
                  </div>
                )}

                {/* ===========================
                    TURNOUT ANALYTICS
                    =========================== */}
                {turnoutData && (
                  <div
                    className="
                      mt-8 bg-gray-900 p-6 rounded-xl shadow-xl
                      border border-[#4deeea33]
                      hover:shadow-[0_0_20px_#4deeea55]
                      transition-all
                    "
                  >
                    <VoterTurnoutAnalytics data={turnoutData} />
                  </div>
                )}

                {/* ===========================
                    GENDER VOTING SPLIT
                    =========================== */}
                {genderStats && (
                  <div
                    className="
                      mt-8 bg-gray-900 p-6 rounded-xl shadow-xl
                      border border-[#4deeea33]
                      hover:shadow-[0_0_20px_#4deeea55]
                      transition-all
                    "
                  >
                    <GenderVoteChart data={genderStats} />
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">
              Results will be revealed after {new Date(election.endTime).toLocaleString()}
            </p>
          </div>
        )}
      </div>
      {isElectionOver && (
        <div className="text-center mt-8">
          <button
            onClick={handleDownload}
            disabled={isDownloadingPdf}
            className="px-6 py-2 bg-white text-black rounded-md font-semibold hover:bg-gray-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDownloadingPdf ? 'Downloading...' : 'Download Results'}
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

// ===========================
// EXPORT DEFAULT
// ===========================
export default ElectionDetail;