
import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

if (env.dnsServers.length) {
  dns.setServers(env.dnsServers);
}

let connectionPromise = null;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    }).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }

  const conn = await connectionPromise;

  console.log(
    `[db] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`
  );

  return conn;
}

export async function disconnectDB() {
  connectionPromise = null;
  await mongoose.connection.close();
}
