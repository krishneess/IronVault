/**
 * Vercel serverless entry point for the IronVault API (Application tier).
 *
 * vercel.json rewrites every /api/* request here; Express sees the original URL, so the same
 * routers, middleware and services as `npm run dev` handle it. The MongoDB connection is opened
 * once per warm function instance and reused across requests.
 *
 * Membership expiry needs no background timer here: memberships are expired whenever they are
 * read (and admin lists run a throttled sweep), so state stays correct between invocations.
 */
import app from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

let connection = null;

function ensureDatabase() {
  if (!connection) {
    connection = connectDB().catch((err) => {
      connection = null; // retry on the next request instead of caching the failure
      throw err;
    });
  }
  return connection;
}

export default async function handler(req, res) {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('[api] Database connection failed:', err.message);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, message: 'Service temporarily unavailable. Please try again shortly.' }));
    return;
  }
  return app(req, res);
}
