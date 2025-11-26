import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IStudent extends Document {
  _id: Types.ObjectId;
  usn: string;
  name: string;
  email: string;
  password: string;
  admissionYear: number;
  branch: 'cs' | 'ci' | 'is';
  section: string;
  gender?: 'male' | 'female';
  publicKey?: string;
  keyAlgorithm?: string;
  isValidStudent: () => boolean;
}

const StudentSchema: Schema = new Schema({
  usn: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  admissionYear: { type: Number, required: true },
  branch: { type: String, enum: ['cs', 'ci', 'is'], required: true },
  section: { type: String, lowercase: true, required: true },
  gender: { type: String, enum: ['male', 'female'], required: false },
  publicKey: { type: String },
  keyAlgorithm: { type: String, default: "ed25519" }
}, { timestamps: true });

StudentSchema.methods.isValidStudent = function (): boolean {
  const currentYear = new Date().getFullYear();
  return currentYear - this.admissionYear < 4;
};

export default mongoose.model<IStudent>('Student', StudentSchema);
