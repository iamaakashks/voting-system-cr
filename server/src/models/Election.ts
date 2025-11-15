import mongoose, { Schema, Document } from 'mongoose';
import { ITeacher } from './Teacher';

export interface IElection extends Document {
  title: string;
  description: string;
  branch: string;
  section: string;
  admissionYear: number; // Batch year for the election
  startTime: Date;
  endTime: Date;
  createdBy: ITeacher | Schema.Types.ObjectId; // Ref to Teacher
  status: 'upcoming' | 'live' | 'closed';
  candidates: {
    student: Schema.Types.ObjectId; // Ref to Student
    name: string; // Denormalized for easy display
    usn: string; // Denormalized
    votes: number;
  }[];
  notaVotes?: number; // Track NOTA (None of the Above) votes
}

const ElectionSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: false, default: '' },
  branch: { type: String, required: true },
  section: { type: String, required: true },
  admissionYear: { type: Number, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
  candidates: [{
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    name: { type: String, required: true },
    usn: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  notaVotes: { type: Number, default: 0 }
}, {
  timestamps: true,
  // Ensure virtuals are included when converting to JSON
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get status
ElectionSchema.virtual('status').get(function(this: IElection) { // <-- FIX: Type `this` here
  const now = new Date();
  if (now < this.startTime) return 'upcoming';
  if (now > this.endTime) return 'closed';
  return 'live';
});

export default mongoose.model<IElection>('Election', ElectionSchema);