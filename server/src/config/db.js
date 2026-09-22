import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });

  // Make sure unique indexes (email, username, session token) exist before we accept traffic.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
