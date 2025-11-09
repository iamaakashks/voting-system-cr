import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://aks_db_user:uayF2loVh0X20otH@cluster0.fn8gfg5.mongodb.net/dummy-college-db');
    console.log('MongoDB Connected...');
  } catch (err: any) {
    console.error(err.message);
    process.exit(1);
  }
};

export default connectDB;