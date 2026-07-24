import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (!cached.promise) {
    console.log('Database: Creating new connection promise.');
    cached.promise = mongoose.connect(MONGODB_URI);
  }
  try {
    cached.conn = await cached.promise;
    console.log('Database: Connection established successfully.');
    return cached.conn;
  } catch (e) {
    console.error('Database: Connection failed!', e);
    cached.promise = null; // Reset promise to allow retry on next request
    throw e; // Re-throw error to fail the request
  }
}

export default dbConnect;