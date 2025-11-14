import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent extends Document {
  usn: string;
  name: string;
  email: string;
  password: string;
  admissionYear: number;
  branch: 'cs' | 'ci' | 'ise';
  section: string;
  gender?: 'male' | 'female';
  isValidStudent: () => boolean;
}

const StudentSchema: Schema = new Schema({
  usn: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  admissionYear: { type: Number, required: true },
  branch: { type: String, enum: ['cs', 'ci', 'ise'], required: true },
  section: { type: String, lowercase: true, required: true },
  gender: { type: String, enum: ['male', 'female'], required: false },
}, { timestamps: true });

StudentSchema.methods.isValidStudent = function (): boolean {
  const currentYear = new Date().getFullYear();
  return currentYear - this.admissionYear < 4;
};

export default mongoose.model<IStudent>('Student', StudentSchema);
