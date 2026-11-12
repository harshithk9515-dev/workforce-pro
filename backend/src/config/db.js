const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error('[db] Connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[db] MongoDB disconnected');
    });

    return conn;
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message);
    throw new Error('[db] MongoDB connection failed. Check MONGO_URI environment variable.');
  }
};

module.exports = connectDB;
