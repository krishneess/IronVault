/**
 * Demo accounts for trying IronVault: 6 members + 6 trainers (fictional people).
 *   npm run seed:demo             – create any that don't exist yet (safe to re-run)
 *   npm run seed:demo -- --remove – delete the demo accounts again
 * Password for each account: <first name in lowercase>@123  (e.g. aarav@123)
 * Demo emails use the @ironvault.demo domain. Remove these accounts before going live.
 */
import { connectDB, disconnectDB } from '../config/db.js';
import { User, ROLES } from '../models/index.js';
import * as userRepository from '../repositories/userRepository.js';

const DOMAIN = 'ironvault.demo';

const MEMBERS = [
  { name: 'Aarav Mehta', age: 26, gender: 'male', height: 178, weight: 82, fitnessGoal: 'Lose 8 kg and build lean muscle', phone: '+91 98200 11021' },
  { name: 'Priya Nair', age: 29, gender: 'female', height: 162, weight: 61, fitnessGoal: 'Run a sub-60 minute 10K', phone: '+91 98450 22134' },
  { name: 'Rohan Verma', age: 34, gender: 'male', height: 175, weight: 91, fitnessGoal: 'Improve strength and lower body fat', phone: '+91 99300 33547' },
  { name: 'Ananya Iyer', age: 23, gender: 'female', height: 158, weight: 52, fitnessGoal: 'Gain strength and tone up', phone: '+91 97690 44268' },
  { name: 'Kabir Sethi', age: 31, gender: 'male', height: 182, weight: 77, fitnessGoal: 'Build muscle mass for a powerlifting meet', phone: '+91 98110 55379' },
  { name: 'Sneha Kulkarni', age: 27, gender: 'female', height: 165, weight: 68, fitnessGoal: 'Better mobility and healthy weight loss', phone: '+91 90040 66482' },
];

const TRAINERS = [
  { name: 'Vikram Chauhan', specialization: 'Strength & Conditioning', experience: 9, bio: 'Certified strength coach focused on compound lifts, progressive overload and injury-free training.', phone: '+91 98201 70011' },
  { name: 'Meera Joshi', specialization: 'Yoga & Mobility', experience: 7, bio: 'Helps members move better with yoga, mobility drills and recovery routines.', phone: '+91 98452 70022' },
  { name: 'Arjun Desai', specialization: 'Weight Loss & HIIT', experience: 5, bio: 'High-energy coach combining HIIT, circuit training and sustainable nutrition habits.', phone: '+91 99303 70033' },
  { name: 'Kavya Reddy', specialization: 'Sports Nutrition', experience: 6, bio: 'Nutrition-first coach who builds practical meal plans around training goals.', phone: '+91 97694 70044' },
  { name: 'Rahul Menon', specialization: 'Bodybuilding & Hypertrophy', experience: 11, bio: 'Physique coach specialising in hypertrophy programming and contest preparation.', phone: '+91 98115 70055' },
  { name: 'Nisha Kapoor', specialization: 'Functional & CrossFit', experience: 4, bio: 'Functional fitness coach for strength, stamina and everyday athletic movement.', phone: '+91 90046 70066' },
];

const firstName = (name) => name.split(' ')[0].toLowerCase();
const accountFor = (person) => {
  const first = firstName(person.name);
  const last = person.name.split(' ').slice(1).join('').toLowerCase();
  return { username: first, email: `${first}.${last}@${DOMAIN}`, password: `${first}@123` };
};

async function seed() {
  const created = [];
  const skipped = [];
  for (const [role, people] of [
    [ROLES.MEMBER, MEMBERS],
    [ROLES.TRAINER, TRAINERS],
  ]) {
    for (const person of people) {
      const account = accountFor(person);
      const exists = await User.findOne({ $or: [{ email: account.email }, { username: account.username }] });
      if (exists) {
        skipped.push(`${person.name} (${exists.email === account.email ? 'already exists' : `username "${account.username}" taken`})`);
        continue;
      }
      await userRepository.createUser(role, { ...person, ...account });
      created.push({ role, name: person.name, username: account.username, email: account.email, password: account.password });
    }
  }
  if (created.length) console.table(created);
  console.log(`[demo] Created ${created.length} account(s).`);
  if (skipped.length) console.log(`[demo] Skipped ${skipped.length}: ${skipped.join('; ')}`);
}

async function remove() {
  const result = await User.deleteMany({ email: new RegExp(`@${DOMAIN.replace('.', '\\.')}$`, 'i') });
  console.log(`[demo] Removed ${result.deletedCount} demo account(s).`);
}

async function run() {
  await connectDB();
  if (process.argv.includes('--remove')) await remove();
  else await seed();
  await disconnectDB();
}

run().catch(async (err) => {
  console.error('[demo] Failed:', err.message);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
