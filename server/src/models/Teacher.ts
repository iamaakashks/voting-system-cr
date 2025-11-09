import mongoose, { Schema, Document } from 'mongoose';

export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  email: string;
  password: string;
  branch: 'cs' | 'ci' | 'ise';
}

const TeacherSchema: Schema = new Schema({
  teacherId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  branch: { type: String, enum: ['cs', 'ci', 'ise'], required: true },
}, { timestamps: true });

export default mongoose.model<ITeacher>('Teacher', TeacherSchema);
