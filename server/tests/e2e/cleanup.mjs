/**
 * Removes data created by the e2e suite (and, with --legacy, by the early ad-hoc test scripts).
 *   npm run test:cleanup
 *   npm run test:cleanup -- --legacy
 * Only records carrying the test markers are touched.
 */
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import { E2E_DOMAIN, E2E_TIER_PREFIX } from './lib.mjs';

export async function cleanup({ legacy = false } = {}) {
  const ownConnection = mongoose.connection.readyState !== 1;
  if (ownConnection) await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  try {
    const escaped = E2E_DOMAIN.replace(/\./g, '\\.');
    const userPatterns = [new RegExp(`@${escaped}$`, 'i')];
    const tierPatterns = [new RegExp(`^${E2E_TIER_PREFIX}`)];
    if (legacy) {
      userPatterns.push(/@t\.io$/i, /^(trainer2|inactive)\.test@ironvault\.local$/i);
      tierPatterns.push(/^(P2 Tier|Basic|Gold|Retired) \d{10,}$/);
    }

    const users = await db.collection('users').find({ $or: userPatterns.map((rx) => ({ email: rx })) }, { projection: { _id: 1 } }).toArray();
    const userIds = users.map((u) => u._id);
    const tiers = await db.collection('membershiptiers').find({ $or: tierPatterns.map((rx) => ({ name: rx })) }, { projection: { _id: 1 } }).toArray();
    const tierIds = tiers.map((t) => t._id);

    const memberships = await db
      .collection('memberships')
      .find({ $or: [{ member: { $in: userIds } }, { tier: { $in: tierIds } }] }, { projection: { _id: 1 } })
      .toArray();
    const plans = [
      ...(await db.collection('workoutplans').find({ trainer: { $in: userIds } }, { projection: { _id: 1 } }).toArray()),
      ...(await db.collection('dietplans').find({ trainer: { $in: userIds } }, { projection: { _id: 1 } }).toArray()),
    ];
    const assignments = await db
      .collection('trainerassignments')
      .find({ $or: [{ member: { $in: userIds } }, { trainer: { $in: userIds } }] }, { projection: { _id: 1 } })
      .toArray();
    const touched = [...userIds, ...tierIds, ...memberships.map((m) => m._id), ...plans.map((p) => p._id), ...assignments.map((a) => a._id)];

    const removed = {
      users: (await db.collection('users').deleteMany({ _id: { $in: userIds } })).deletedCount,
      tiers: (await db.collection('membershiptiers').deleteMany({ _id: { $in: tierIds } })).deletedCount,
      memberships: (await db.collection('memberships').deleteMany({ _id: { $in: memberships.map((m) => m._id) } })).deletedCount,
      fitnessRecords: (await db.collection('fitnessrecords').deleteMany({ member: { $in: userIds } })).deletedCount,
      workoutPlans: (await db.collection('workoutplans').deleteMany({ trainer: { $in: userIds } })).deletedCount,
      dietPlans: (await db.collection('dietplans').deleteMany({ trainer: { $in: userIds } })).deletedCount,
      assignments: (await db.collection('trainerassignments').deleteMany({ _id: { $in: assignments.map((a) => a._id) } })).deletedCount,
      auditLogs: (await db.collection('auditlogs').deleteMany({ $or: [{ actor: { $in: userIds } }, { entityId: { $in: touched } }] })).deletedCount,
    };
    // Detach removed members from any remaining (non-test) plans.
    await db.collection('workoutplans').updateMany({}, { $pull: { assignedMembers: { member: { $in: userIds } } } });
    await db.collection('dietplans').updateMany({}, { $pull: { assignedMembers: { member: { $in: userIds } } } });
    return removed;
  } finally {
    if (ownConnection) await mongoose.disconnect();
  }
}

// CLI entry point
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.env.NODE_ENV === 'production' && process.env.E2E_ALLOW_PRODUCTION !== 'true') {
    console.error('Refusing to run cleanup with NODE_ENV=production.');
    process.exit(1);
  }
  const removed = await cleanup({ legacy: process.argv.includes('--legacy') });
  console.log('Removed:', removed);
}
