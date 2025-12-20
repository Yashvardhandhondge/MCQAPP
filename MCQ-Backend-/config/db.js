const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  // const mongoUri = process.env.MONGODB_URI;
  const mongoUri = 'mongodb+srv://yashvardhandhondge_db_user:3oSHe0WIRBnMWC7R@cluster0.us9t0gd.mongodb.net/MCQ';

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined in the environment variables');
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      dbName: 'MCQ', // Explicitly set to MCQ database
      // Connection pool settings for better performance
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2, // Minimum number of connections to maintain
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
    });

    isConnected = true;
    console.log(`MongoDB connected: ${connection.connection.host}`);
    const dbName = connection.connection.db ? connection.connection.db.databaseName : 'MCQ';
    console.log(`Database: ${dbName}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
      isConnected = true;
    });

  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    isConnected = false;
    // Don't exit process in serverless environments (Vercel)
    if (require.main === module) {
      process.exit(1);
    }
    throw error; // Re-throw so callers can handle it
  }
};

module.exports = {
  connectDB,
};

