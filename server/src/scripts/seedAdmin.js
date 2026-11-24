/**
 * Creates the first ADMIN account from ADMIN_* environment variables.
 * Admin accounts cannot be self-registered; run: npm run seed:admin
 */
import env from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User, ROLES } from '../models/index.js';
import * as userRepository from '../repositories/userRepository.js';
import { PASSWORD_REGEX, EMAIL_REGEX } from '../utils/validators.js';

async function run() {
  const { ADMIN_NAME = 'System Administrator', ADMIN_EMAIL, ADMIN_USERNAME = 'admin', ADMIN_PASSWORD } = process.env;

  if (!ADMIN_EMAIL || !EMAIL_REGEX.test(ADMIN_EMAIL)) throw new Error('Set a valid ADMIN_EMAIL in .env');
  if (!ADMIN_PASSWORD || !PASSWORD_REGEX.test(ADMIN_PASSWORD)) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters and include a letter and a number');
  }

  await connectDB();
  const existing = await User.findOne({ $or: [{ email: ADMIN_EMAIL.toLowerCase() }, { username: ADMIN_USERNAME.toLowerCase() }] });
  if (existing) {
    console.log(`[seed] An account with that email/username already exists (role: ${existing.role}). Nothing to do.`);
  } else {
    const admin = await userRepository.createUser(ROLES.ADMIN, {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
    });
    console.log(`[seed] Admin created: ${admin.email} (${env.nodeEnv})`);
  }
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[seed] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
