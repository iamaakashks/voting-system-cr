import express, { Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Student from '../models/Student';
import { validationResult, body } from 'express-validator';

const router = express.Router();

router.post(
  '/register-key',
  protect,
  [
    body('publicKey').isString().withMessage('Public key must be a string.'),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { publicKey } = req.body;
    const userId = req.user!.id;

    try {
      const student = await Student.findById(userId);

      if (!student) {
        return res.status(404).json({ msg: 'Student not found' });
      }

      student.publicKey = publicKey;
      await student.save();

      res.json({ msg: 'Public key registered successfully' });
    } catch (err: any) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

export default router;
