import mongoose, { Schema, Document } from 'mongoose';

export interface IVote extends Document {
  election: Schema.Types.ObjectId;
  candidateId: string;
  ballotHash: string;
  timestamp: Date;
}

const VoteSchema: Schema = new Schema({
  election: { type: Schema.Types.ObjectId, ref: 'Election', required: true },
  candidateId: { type: String, required: true },
  ballotHash: { type: String, required: true, unique: true },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IVote>('Vote', VoteSchema);
