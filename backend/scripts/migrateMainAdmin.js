// One-time migration for existing databases created before the "main admin"
// concept existed. Every database needs exactly one main admin - the account
// that alone can create/delete other admins and change another admin's
// password. This script:
//   1. Skips entirely if a main admin already exists (safe to run more than once)
//   2. Otherwise promotes the oldest admin account to main admin
//
// Run with: npm run migrate:main-admin
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();

  const existingMainAdmin = await User.findOne({ isMainAdmin: true });
  if (existingMainAdmin) {
    console.log(`Main admin already set: ${existingMainAdmin.email}. Nothing to do.`);
    process.exit(0);
  }

  const oldestAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: 1 });
  if (!oldestAdmin) {
    console.error('No admin account found. Run `npm run seed` first, then re-run this migration.');
    process.exit(1);
  }

  oldestAdmin.isMainAdmin = true;
  await oldestAdmin.save();

  console.log(`Promoted ${oldestAdmin.email} to main admin.`);
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
