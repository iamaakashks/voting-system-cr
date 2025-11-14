import mongoose, { Schema, Document } from 'mongoose';

export interface IStudent2024 extends Document {
  usn: string;
  name: string;
  email: string;
  password: string;
  admissionYear: number;
  branch: 'cs' | 'ci' | 'is';
  section: string;
  gender?: 'male' | 'female';
  isValidStudent: () => boolean;
}

const Student2024Schema: Schema = new Schema({
  usn: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  admissionYear: { type: Number, required: true },
  branch: { type: String, enum: ['cs', 'ci', 'is'], required: true },
  section: { type: String, lowercase: true, required: true },
  gender: { type: String, enum: ['male', 'female'], required: false },
}, { timestamps: true, collection: 'students_2024' });

Student2024Schema.methods.isValidStudent = function (): boolean {
  const currentYear = new Date().getFullYear();
  return currentYear - this.admissionYear < 4;
};

export default mongoose.model<IStudent2024>('Student2024', Student2024Schema);

