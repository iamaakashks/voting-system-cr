import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Transaction from '../models/Transaction';
import Election from '../models/Election';

const router = express.Router();

// @route   GET api/transactions/recent
// @desc    Get recent transactions
// @access  Private
router.get('/recent', protect, async (req: AuthRequest, res: Response) => {
    try {
        // Get recent transactions
        const transactions = await Transaction.find()
            .populate('election', 'title')
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        console.log(`Fetched ${transactions.length} recent transactions`);

        const transactionsWithDetails = transactions
            .map(tx => {
                // Handle both new (ballotHash) and old (txHash) documents for backward compatibility
                const hash = (tx as any).ballotHash || (tx as any).txHash;
                if (!hash) {
                    console.warn('Transaction found without hash:', tx._id);
                    return null;
                }

                return {
                    ballotHash: hash,
                    electionTitle: tx.election ? (tx.election as any).title : 'Unknown Election',
                    timestamp: tx.timestamp.toISOString()
                };
            })
            .filter(Boolean); // Remove any null entries

        console.log(`Returning ${transactionsWithDetails.length} transactions with details`);
        res.json(transactionsWithDetails);
    } catch (err: any) {
        console.error('Error fetching transactions:', err);
        res.json([]); // Return empty array on error
    }
});

export default router;