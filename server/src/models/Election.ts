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
  status: 'Pending' | 'Ongoing' | 'Finished';
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
  status: { 
    type: String, 
    enum: ['Pending', 'Ongoing', 'Finished'], 
    default: 'Pending' 
  },
  candidates: [{
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    name: { type: String, required: true },
    usn: { type: String, required: true },
    votes: { type: Number, default: 0 }
  }],
  notaVotes: { type: Number, default: 0 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for fast queries with multiple concurrent users
ElectionSchema.index({ status: 1, startTime: 1 }); // Active elections lookup
ElectionSchema.index({ branch: 1, section: 1, admissionYear: 1 }); // Student elections
ElectionSchema.index({ createdBy: 1 }); // Teacher dashboard

export default mongoose.model<IElection>('Election', ElectionSchema);