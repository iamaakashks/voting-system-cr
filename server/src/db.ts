import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('MONGO_URI is not defined in environment variables');
      process.exit(1);
    }
    
    // Connection pool configuration for high concurrency (80-100+ users)
    await mongoose.connect(mongoURI, {
      maxPoolSize: 50,        // Maximum number of connections in the pool
      minPoolSize: 10,        // Minimum number of connections to maintain
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    });
    
    console.log('MongoDB Connected with connection pool (max: 50 connections)...');
  } catch (err: any) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

export default connectDB;