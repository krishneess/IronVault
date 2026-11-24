import mongoose from 'mongoose';
import env from './env.js';

/**
 * DatabaseConnection (Data Access Layer).
 * The only place the application opens a connection to MongoDB.
 */
export async function connectDB() {
  mongoose.set('strictQuery', true);
  const conn = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log(`[db] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
  return conn;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
