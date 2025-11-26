/**
 * Script to fix Transaction collection indexes
 * This removes the old txHash index and ensures ballotHash index exists
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const db = mongoose.connection.db;
    const transactionsCollection = db.collection('transactions');

    // Get current indexes
    console.log('\n📋 Current indexes:');
    const indexes = await transactionsCollection.indexes();
    indexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    // Drop the old txHash index if it exists
    try {
      console.log('\n🗑️  Attempting to drop old txHash_1 index...');
      await transactionsCollection.dropIndex('txHash_1');
      console.log('✓ Dropped txHash_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('  Index txHash_1 does not exist (already removed)');
      } else {
        console.log('  Note:', error.message);
      }
    }

    // Ensure ballotHash index exists and is unique
    console.log('\n📌 Ensuring ballotHash index exists...');
    try {
      await transactionsCollection.createIndex({ ballotHash: 1 }, { unique: true });
      console.log('✓ ballotHash index created (unique)');
    } catch (error) {
      if (error.code === 85) {
        console.log('  ballotHash index already exists');
      } else {
        throw error;
      }
    }

    // Verify final indexes
    console.log('\n✅ Final indexes:');
    const finalIndexes = await transactionsCollection.indexes();
    finalIndexes.forEach(index => {
      console.log('  -', JSON.stringify(index.key), index.unique ? '(unique)' : '');
    });

    console.log('\n✅ Transaction indexes fixed successfully!');
    console.log('You can now vote in multiple elections without errors.');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();
