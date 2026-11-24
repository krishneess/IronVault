import env from './config/env.js';
import app from './app.js';

import { connectDB, disconnectDB } from './config/db.js';
import './models/index.js';
import { expireDueMemberships } from './services/membershipService.js';

const EXPIRY_SWEEP_MS = 15 * 60 * 1000;

/** Applies automatic state-chart transitions (endDate reached / hold exceeded) on a schedule. */
async function sweepExpiredMemberships() {
  try {
    const count = await expireDueMemberships({ force: true });
    if (count) console.log(`[memberships] Expired ${count} membership(s)`);
  } catch (err) {
    console.error('[memberships] Expiry sweep failed:', err.message);
  }
}

async function start() {
  try {
    await connectDB();
    await sweepExpiredMemberships();
    const sweep = setInterval(sweepExpiredMemberships, EXPIRY_SWEEP_MS);
    sweep.unref();

    const server = app.listen(env.port, () => {
      console.log(`[server] IronVault API listening on port ${env.port} (${env.nodeEnv})`);
    });

    // Graceful shutdown for hosting platforms that send SIGTERM on deploy / scale-down.
    const shutdown = (signal) => {
      console.log(`[server] ${signal} received – shutting down`);
      clearInterval(sweep);
      server.close(async () => {
        await disconnectDB().catch(() => {});
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (err) {
    console.error('[server] Failed to start:', err.message);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start();
