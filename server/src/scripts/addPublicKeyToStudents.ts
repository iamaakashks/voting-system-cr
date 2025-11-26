import 'dotenv/config';
import connectDB from '../db';
import Student from '../models/Student';

const migrate = async () => {
  await connectDB();

  try {
    const result = await Student.updateMany(
      { publicKey: { $exists: false } },
      { $set: { publicKey: null, keyAlgorithm: 'ed25519' } }
    );

    console.log('Migration completed.');
    console.log(`Matched ${result.matchedCount} documents.`);
    console.log(`Modified ${result.modifiedCount} documents.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrate();
