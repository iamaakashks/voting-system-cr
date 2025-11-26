import mongoose, { Schema, Document } from 'mongoose';
import { IElection } from './Election';

export interface ITransaction extends Document {
  ballotHash: string;
  election: IElection | Schema.Types.ObjectId;
  candidateId?: string; // Store which candidate was voted for (or 'NOTA')
  timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
  ballotHash: { type: String, required: true, unique: true },
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  candidateId: { type: String, required: false }, // Store candidate ID or 'NOTA'
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

