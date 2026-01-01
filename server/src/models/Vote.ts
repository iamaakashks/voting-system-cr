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

// Indexes for performance with high concurrency
VoteSchema.index({ election: 1 }); // Fast election vote queries
VoteSchema.index({ election: 1, timestamp: -1 }); // Timeline queries
VoteSchema.index({ ballotHash: 1 }, { unique: true }); // Duplicate prevention

export default mongoose.model<IVote>('Vote', VoteSchema);
