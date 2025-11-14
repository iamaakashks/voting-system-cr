import mongoose, { Schema, Document } from 'mongoose';
import { IElection } from './Election';
import { IStudent2022 } from './Student2022';
import { IStudent2023 } from './Student2023';
import { IStudent2024 } from './Student2024';
import { IStudent2025 } from './Student2025';

export interface ITransaction extends Document {
  txHash: string;
  election: IElection | Schema.Types.ObjectId;
  student: IStudent2022 | IStudent2023 | IStudent2024 | IStudent2025 | Schema.Types.ObjectId;
  candidateId?: string; // Store which candidate was voted for (or 'NOTA')
  timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
  txHash: { type: String, required: true, unique: true },
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  student: { type: Schema.Types.ObjectId, required: true }, // No ref since we have multiple Student models
  candidateId: { type: String, required: false }, // Store candidate ID or 'NOTA'
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);

