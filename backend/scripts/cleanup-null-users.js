#!/usr/bin/env node
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const mongoUrl = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tcc-mamahalls';

async function main() {
  console.log('Connecting to', mongoUrl);
  await mongoose.connect(mongoUrl, { autoIndex: true });
  console.log('Connected');

  const query = { $or: [ { username: null }, { email: null } ] };
  const docs = await User.find(query).select('_id username email createdAt').lean();
  if (!docs.length) {
    console.log('No users with null username/email found.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('Found', docs.length, 'user(s) with null username/email:');
  docs.forEach(d => console.log(` - id=${d._id} username=${d.username} email=${d.email} createdAt=${d.createdAt}`));

  // Delete them
  const res = await User.deleteMany(query);
  console.log('Deleted count:', res.deletedCount);

  // Good measure: ask Mongo to rebuild unique sparse indexes for username/email
  try {
    const coll = mongoose.connection.collection('users');
    await coll.dropIndexes();
    console.log('Dropped indexes on users collection.');
  } catch (err) {
    console.log('Could not drop indexes (may not exist):', err.message || err);
  }

  // Recreate sparse unique indexes
  try {
    await mongoose.connection.collection('users').createIndex({ username: 1 }, { unique: true, sparse: true });
    await mongoose.connection.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    console.log('Recreated sparse unique indexes for username and email.');
  } catch (err) {
    console.error('Error creating indexes:', err.message || err);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch(err => {
  console.error('Error:', err && err.message ? err.message : err);
  process.exit(1);
});
