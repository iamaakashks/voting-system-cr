/**
 * Migration Script: Hash Existing Plain Text Passwords
 * 
 * This script updates all existing student and teacher passwords
 * from plain text to bcrypt hashed passwords.
 * 
 * WARNING: Run this script ONLY ONCE after implementing password hashing
 * 
 * Usage: npx ts-node src/scripts/hashExistingPasswords.ts
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define schemas without pre-save hooks for direct password update
const StudentSchema = new mongoose.Schema({
  usn: String,
  name: String,
  email: String,
  password: String,
  admissionYear: Number,
  branch: String,
  section: String,
  gender: String,
  publicKey: String,
  keyAlgorithm: String,
}, { timestamps: true });

const TeacherSchema = new mongoose.Schema({
  teacherId: String,
  name: String,
  email: String,
  password: String,
  branch: String,
}, { timestamps: true });

const Student = mongoose.model('Student', StudentSchema);
const Teacher = mongoose.model('Teacher', TeacherSchema);

/**
 * Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
 */
const isPasswordHashed = (password: string): boolean => {
  return password.startsWith('$2a$') || password.startsWith('$2b$');
};

/**
 * Hash existing student passwords
 */
const hashStudentPasswords = async () => {
  console.log('\n🔐 Hashing student passwords...');
  
  const students = await Student.find({});
  console.log(`Found ${students.length} students`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const student of students) {
    try {
      // Skip if password is missing
      if (!student.password) {
        console.log(`⏭️  Skipping ${student.usn} - No password found`);
        skipped++;
        continue;
      }

      // Check if password is already hashed
      if (isPasswordHashed(student.password)) {
        console.log(`⏭️  Skipping ${student.usn} - Password already hashed`);
        skipped++;
        continue;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(student.password as string, salt);

      // Update directly without triggering pre-save hooks
      await Student.updateOne(
        { _id: student._id },
        { $set: { password: hashedPassword } }
      );

      console.log(`✅ Hashed password for student: ${student.usn}`);
      updated++;
    } catch (error: any) {
      console.error(`❌ Error hashing password for ${student.usn}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Student Password Hashing Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  
  return { updated, skipped, errors };
};

/**
 * Hash existing teacher passwords
 */
const hashTeacherPasswords = async () => {
  console.log('\n🔐 Hashing teacher passwords...');
  
  const teachers = await Teacher.find({});
  console.log(`Found ${teachers.length} teachers`);
  
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  for (const teacher of teachers) {
    try {
      // Skip if password is missing
      if (!teacher.password) {
        console.log(`⏭️  Skipping ${teacher.teacherId} - No password found`);
        skipped++;
        continue;
      }

      // Check if password is already hashed
      if (isPasswordHashed(teacher.password)) {
        console.log(`⏭️  Skipping ${teacher.teacherId} - Password already hashed`);
        skipped++;
        continue;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(teacher.password as string, salt);

      // Update directly without triggering pre-save hooks
      await Teacher.updateOne(
        { _id: teacher._id },
        { $set: { password: hashedPassword } }
      );

      console.log(`✅ Hashed password for teacher: ${teacher.teacherId}`);
      updated++;
    } catch (error: any) {
      console.error(`❌ Error hashing password for ${teacher.teacherId}:`, error.message);
      errors++;
    }
  }

  console.log(`\n📊 Teacher Password Hashing Summary:`);
  console.log(`   ✅ Updated: ${updated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  
  return { updated, skipped, errors };
};

/**
 * Main migration function
 */
const runMigration = async () => {
  console.log('========================================');
  console.log('🔐 Password Hashing Migration Script');
  console.log('========================================\n');

  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    // Hash student passwords
    const studentResults = await hashStudentPasswords();

    // Hash teacher passwords
    const teacherResults = await hashTeacherPasswords();

    // Final summary
    console.log('\n========================================');
    console.log('📊 MIGRATION COMPLETE');
    console.log('========================================');
    console.log(`Total Updated: ${studentResults.updated + teacherResults.updated}`);
    console.log(`Total Skipped: ${studentResults.skipped + teacherResults.skipped}`);
    console.log(`Total Errors: ${studentResults.errors + teacherResults.errors}`);
    console.log('========================================\n');

    if (studentResults.errors > 0 || teacherResults.errors > 0) {
      console.log('⚠️  Some passwords failed to hash. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('✅ All passwords successfully hashed!');
      console.log('🎉 You can now use the new authentication system.\n');
      process.exit(0);
    }

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed');
  }
};

// Run the migration
runMigration();
