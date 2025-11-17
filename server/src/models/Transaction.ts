import mongoose, { Schema, Document } from 'mongoose';
import { IElection } from './Election';
import { IStudent } from './Student';

export interface ITransaction extends Document {
  txHash: string;
  election: IElection | Schema.Types.ObjectId;
  student: IStudent | Schema.Types.ObjectId;
  candidateId?: string; // Store which candidate was voted for (or 'NOTA')
  timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
  txHash: { type: String, required: true, unique: true },
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  candidateId: { type: String, required: false }, // Store candidate ID or 'NOTA'
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

