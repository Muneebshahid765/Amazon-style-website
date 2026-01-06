import mongoose from 'mongoose';

mongoose.set('strictQuery', true);

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment variables');
  }

  const options = {
    maxPoolSize: 20,
    minPoolSize: 5,
    autoIndex: true,
  };

  try {
    await mongoose.connect(uri, options);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error', error);
    process.exit(1);
  }
};

export { connectDB };
