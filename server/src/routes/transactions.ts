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
        // Return empty array initially - only show transactions when votes are cast
        const transactions = await Transaction.find()
            .populate('election', 'title')
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        const transactionsWithDetails = transactions.map(tx => ({
            txHash: tx.txHash,
            electionTitle: (tx.election as any).title || 'Unknown Election',
            timestamp: tx.timestamp.toISOString()
        }));

        res.json(transactionsWithDetails);
    } catch (err: any) {
        console.error('Error fetching transactions:', err);
        res.json([]); // Return empty array on error
    }
});

export default router;