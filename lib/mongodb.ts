import mongoose, { type Mongoose } from "mongoose";

/**
 * A small helper to connect to MongoDB using Mongoose with proper TypeScript types
 * and a connection cache to avoid creating multiple connections in development
 * (Next.js hot reload / serverless warm-ups can otherwise open many connections).
 *
 * Usage:
 *   import { connectToDatabase } from '@/lib/mongodb'
 *   const mongoose = await connectToDatabase()
 */

// The environment variable that holds the MongoDB connection string.
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  // Fail fast with a clear message — the app cannot run without a connection string.
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env or your deployment settings"
  );
}

// Define a cache shape for storing the Mongoose instance and pending promise.
type MongooseCache = {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
};

// Persist cache on the global object so it survives module reloads in development.
declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  var _mongoose: MongooseCache | undefined;
}

// Initialize or reuse the global cache.
const cache: MongooseCache = global._mongoose || (global._mongoose = { conn: null, promise: null });

/**
 * Connects to MongoDB and returns the Mongoose instance.
 * Uses a global cache to ensure only one connection is created during development.
 */
export async function connectToDatabase(): Promise<Mongoose> {
  // Return existing connection if available (fast path).
  if (cache.conn) {
    return cache.conn;
  }

  // If a connection is in progress, wait for it instead of creating a new one.
  if (!cache.promise) {
    // Create a connection promise and store it on the cache immediately.
    cache.promise = mongoose
      .connect(MONGODB_URI as string, {
        // Modern Mongoose defaults are usually safe; explicit options kept minimal.
        // You can add `dbName` or other options here if needed.
      })
      .then((mongooseInstance: Mongoose) => {
        // Save the connected instance for subsequent calls.
        cache.conn = mongooseInstance;
        return mongooseInstance;
      });
  }

  // Await the in-flight connection and return it.
  return cache.promise;
}

/**
 * Optional: export the mongoose module for convenience so callers can access
 * models or connection state directly: `import mongoose from 'mongoose'`.
 */
export { mongoose };

export default connectToDatabase;
