import env from './config/env.js';
import app from './app.js';
import { connectDB } from './config/db.js';
import './models/index.js';

async function start() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`[server] IronVault API listening on http://localhost:${env.port}/api (${env.nodeEnv})`);
    });
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();
