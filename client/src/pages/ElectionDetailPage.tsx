import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getElectionById, postVoteWithEmail, stopElection } from '../services/api';
import { Election } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import ElectionDetail from '../components/ElectionDetail';
import Spinner from '../components/Spinner';

const ElectionDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();
    const [election, setElection] = useState<Election | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchElection = useCallback(async () => {
        if (!id) return;
        setIsLoading(true);
        try {
            const electionData = await getElectionById(id);
            setElection(electionData);
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

    const handleVote = useCallback(async (electionId: string, candidateId: string, ticket: string, email: string) => {
        if (!currentUser) {
            showNotification('You must be logged in to vote.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            await postVoteWithEmail(electionId, candidateId, ticket, email);
            await fetchElection(); // Re-fetch to update
            showNotification('Vote cast successfully!', 'success');
        } catch (error: any) {
            showNotification(error.response?.data?.message || 'Vote failed.', 'error');
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, fetchElection, showNotification]);

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
            election={election}
            user={currentUser}
            onBack={() => navigate('/dashboard')}
            onVote={handleVote}
            onStopElection={handleStopElection}
        />
    );
};

export default ElectionDetailPage;
