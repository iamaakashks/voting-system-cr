import 'dotenv/config';
import connectDB from '../db';
import Election from '../models/Election';

const migrateElectionStatus = async () => {
  await connectDB();
  console.log('Starting migration for election statuses...');

  try {
    const electionsToUpdate = await Election.find({ status: { $exists: false } });
    if (electionsToUpdate.length === 0) {
      console.log('No elections found needing a status update.');
      process.exit(0);
      return;
    }

    console.log(`Found ${electionsToUpdate.length} elections to update.`);
    let updatedCount = 0;

    for (const election of electionsToUpdate) {
      const now = new Date();
      let newStatus: 'Pending' | 'Ongoing' | 'Finished';

      if (now > election.endTime) {
        newStatus = 'Finished';
      } else if (now < election.startTime) {
        newStatus = 'Pending';
      } else {
        newStatus = 'Ongoing';
      }
      
      election.status = newStatus;
      await election.save();
      updatedCount++;
    }

    console.log(`Migration completed. Successfully updated ${updatedCount} elections.`);
    process.exit(0);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateElectionStatus();
