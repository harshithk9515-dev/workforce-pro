const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Connection event handlers
    mongoose.connection.on('error', (err) => {
      console.error('[db] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });

    // Process exit on SIGINT
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('[db] MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('[db] Error closing MongoDB connection:', err.message);
        process.exit(1);
      }
    });

    return conn;
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    // Instead of process.exit(1), throw error to let caller handle it
    throw new Error('[db] MongoDB connection failed. Check MONGO_URI environment variable.');
  }
};

module.exports = connectDB;
