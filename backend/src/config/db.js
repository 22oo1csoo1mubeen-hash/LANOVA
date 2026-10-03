import mongoose from 'mongoose';

/**
 * Connect to MongoDB using Mongoose.
 * Prevents server from accepting traffic if the initial connection fails.
 */
export async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lanova';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // Re-throw so server.js can halt startup
    throw error;
  }
}

/**
 * Gracefully close database connection on shutdown.
 */
export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    console.log('[Database] MongoDB connection closed cleanly');
  } catch (error) {
    console.error(`[Database Error] Error during MongoDB disconnect: ${error.message}`);
  }
}
