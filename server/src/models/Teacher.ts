import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface ITeacher extends Document {
  teacherId: string;
  name: string;
  email: string;
  password: string;
  branch: 'cs' | 'ci' | 'is';
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const TeacherSchema: Schema = new Schema({
  teacherId: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  branch: { type: String, enum: ['cs', 'ci', 'is'], required: true },
}, { timestamps: true });

// Hash password before saving
TeacherSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password with 10 rounds
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    console.log('✓ Password hashed for teacher:', this.teacherId);
    next();
  } catch (error: any) {
    console.error('✗ Error hashing password:', error);
    next(error);
  }
});

// Method to compare password for login
TeacherSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('✗ Error comparing password:', error);
    return false;
  }
};

export default mongoose.model<ITeacher>('Teacher', TeacherSchema);
