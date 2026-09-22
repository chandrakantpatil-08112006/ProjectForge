import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { seedSkills } from './seedSkills.js';

/**
 * Usage:
 *   npm run seed:skills   # add the predefined skills
 *   npm run seed:admin    # create (or promote) the admin from ADMIN_EMAIL / ADMIN_PASSWORD
 */
async function seedAdmin() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your environment to create an admin');
  }
  if (password.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters');

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    return `Promoted existing user ${normalizedEmail} to admin`;
  }

  await User.create({
    name: process.env.ADMIN_NAME || 'Site Admin',
    username: process.env.ADMIN_USERNAME || 'forge-admin',
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, env.BCRYPT_COST),
    role: 'admin',
  });
  return `Created admin ${normalizedEmail}`;
}

const tasks = {
  skills: async () => {
    const { total, added } = await seedSkills();
    return `Skills: ${added} added, ${total - added} already present`;
  },
  admin: seedAdmin,
};

const task = tasks[process.argv[2]];
if (!task) {
  console.error(`Usage: node src/seeds/run.js <${Object.keys(tasks).join('|')}>`);
  process.exit(1);
}

try {
  await connectDB();
  console.log(await task());
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
