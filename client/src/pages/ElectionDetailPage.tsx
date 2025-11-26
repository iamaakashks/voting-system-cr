import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getElectionById, postSignedVote, stopElection, Ballot } from '../services/api';
import { Election } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ElectionDetail from '../components/ElectionDetail';
import Spinner from '../components/Spinner';
import { getOrCreateKeyPair, signMessage } from '../utils/keyManager';
import { useSocket } from '../contexts/SocketContext';

const ElectionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [election, setElection] = useState<Election | null>(null);
    const [userVoted, setUserVoted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { socket } = useSocket();

    const fetchElection = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const electionData = await getElectionById(id);
            setElection(electionData);
            setUserVoted(electionData.userVoted);
        } catch (error) {
            showNotification('Failed to load election details.', 'error');
            navigate('/dashboard');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate, showNotification]);

    useEffect(() => {
        if (!id || !socket) return;
        
        fetchElection();

        const handleUpdate = (data: { electionId: string }) => {
            // If the update is for the election we are currently viewing, refresh the data
            if (data.electionId === id) {
                fetchElection();
            }
        };

        const handleElectionStopped = (data: { electionId: string }) => {
            if (data.electionId === id) {
                showNotification('The election has been stopped.', 'success');
                fetchElection();
            }
        };

        // Listen for all relevant events
        socket.on('vote:new', handleUpdate);
        socket.on('election:started', handleUpdate);
        socket.on('election:ended', handleUpdate);
        socket.on('election:results:updated', handleUpdate);
        socket.on('election:stopped', handleElectionStopped);

        return () => {
            socket.off('vote:new', handleUpdate);
            socket.off('election:started', handleUpdate);
            socket.off('election:ended', handleUpdate);
            socket.off('election:results:updated', handleUpdate);
            socket.off('election:stopped', handleElectionStopped);
        };
        
    }, [id, socket, fetchElection, showNotification]);

    const handleVote = useCallback(async (electionId: string, candidateId: string, ticket: string) => {
        if (!currentUser) {
            showNotification('You must be logged in to vote.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const ballot: Ballot = {
                electionId,
                candidateId,
                ticketId: ticket.toUpperCase(),
                timestamp: new Date().toISOString(),
            };

            const keyPair = await getOrCreateKeyPair();
            const signature = signMessage(JSON.stringify(ballot), keyPair.secretKey);

            const response = await postSignedVote(ballot, signature);
            
            // Show success notification with ballot hash
            showNotification(`Vote cast successfully! Ballot Hash: ${response.ballotHash.substring(0, 16)}...`, 'success');
            
            // Wait a moment for the vote to be processed on the server
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Re-fetch election to update UI
            await fetchElection();
        } catch (error: any) {
            console.error('Vote error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Vote failed. Please try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, showNotification, fetchElection]);

    const handleStopElection = useCallback(async (electionId: string) => {
        if (!window.confirm("Are you sure you want to stop this election now?")) return;
        setIsLoading(true);
        try {
            await stopElection(electionId);
            await fetchElection(); // Re-fetch to update
            showNotification('Election has been stopped.', 'success');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Failed to stop election.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [fetchElection, showNotification]);

    if (isLoading || !election) {
        return <Spinner />;
    }

    return (
        <ElectionDetail
            election={{...election, userVoted}}
            user={currentUser}
            onBack={() => navigate('/dashboard')}
            onVote={handleVote}
            onStopElection={handleStopElection}
        />
    );
};

export default ElectionDetailPage;
