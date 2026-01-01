import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

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
  comparePassword: (candidatePassword: string) => Promise<boolean>;
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
  // Allow students up to 4 years (inclusive) to account for the final semester in the 4th calendar year
  return currentYear - this.admissionYear <= 4;
};

// Hash password before saving
StudentSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Generate salt and hash password with 10 rounds
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password as string, salt);
    console.log('✓ Password hashed for student:', this.usn);
    next();
  } catch (error: any) {
    console.error('✗ Error hashing password:', error);
    next(error);
  }
});

// Method to compare password for login
StudentSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('✗ Error comparing password:', error);
    return false;
  }
};

export default mongoose.model<IStudent>('Student', StudentSchema);
