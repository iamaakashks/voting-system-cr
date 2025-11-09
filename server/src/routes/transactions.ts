import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = express.Router();

// Define the Transaction type locally
interface Transaction {
  txHash: string;
  electionTitle: string;
  timestamp: string;
}

// @route   GET api/transactions/recent
// @desc    Get recent transactions
// @access  Private
router.get('/recent', protect, async (req: AuthRequest, res: Response) => {
    // This route provides mock data.
    // In a real app, you would query your 'Transaction' collection here.
    const mockTransactions: Transaction[] = [
        {
            txHash: '0x' + crypto.randomBytes(32).toString('hex'),
            electionTitle: 'Mock CR Election (CS-A)',
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
        {
            txHash: '0x' + crypto.randomBytes(32).toString('hex'),
            electionTitle: 'Mock CR Election (ISE-B)',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
    ];
    res.json(mockTransactions);
});

export default router;