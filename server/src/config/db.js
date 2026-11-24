import dns from 'node:dns';
import mongoose from 'mongoose';
import env from './env.js';

/**
 * Some networks' DNS resolvers refuse the SRV lookups that `mongodb+srv://` Atlas URIs need
 * (error: querySrv ECONNREFUSED). Set DNS_SERVERS=1.1.1.1,8.8.8.8 in .env to use public resolvers.
 */
if (env.dnsServers.length) dns.setServers(env.dnsServers);

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
