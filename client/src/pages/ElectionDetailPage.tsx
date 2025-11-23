import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getElectionById, postVoteWithEmail, stopElection } from '../services/api';
import { Election } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ElectionDetail from '../components/ElectionDetail';
import Spinner from '../components/Spinner';

import { useSocket } from '../contexts/SocketContext';

const ElectionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [election, setElection] = useState<Election | null>(null);
    const [userVoted, setUserVoted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const socket = useSocket();

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
        fetchElection();
    }, [fetchElection]);

    useEffect(() => {
        if (socket) {
            socket.on('new-election', (newElection: Election) => {
                if (newElection.id === id) {
                    setElection(newElection);
                }
            });

            socket.on('new-vote', (data: { electionId: string, results: { [key: string]: number }, studentId: string }) => {
                if (data.electionId === id) {
                    setElection((prevElection) => {
                        if (prevElection) {
                            const updatedElection = { ...prevElection, results: data.results };
                            if (data.studentId === currentUser?.id) {
                                setUserVoted(true);
                            }
                            return updatedElection;
                        }
                        return null;
                    });
                }
            });

            socket.on('election-stopped', (data: { electionId: string, election: Election }) => {
                if (data.electionId === id) {
                    setElection(data.election);
                }
            });

            return () => {
                socket.off('new-election');
                socket.off('new-vote');
                socket.off('election-stopped');
            };
        }
    }, [socket, id, currentUser]);

    const handleVote = useCallback(async (electionId: string, candidateId: string, ticket: string, email: string) => {
        if (!currentUser) {
            showNotification('You must be logged in to vote.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await postVoteWithEmail(electionId, candidateId, ticket, email);
            showNotification('Vote cast successfully!', 'success');
            setUserVoted(true);
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Vote failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, showNotification]);

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
