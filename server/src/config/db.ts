import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { ENV } from './env';

let replSet: MongoMemoryReplSet | null = null;

export const connectDB = async (): Promise<string> => {
  const uri = ENV.MONGODB_URI;
  const isPlaceholder = uri.includes('<db_password>') || uri.includes('<password>');

  if (!isPlaceholder && uri) {
    try {
      console.log(`[Database] Attempting connection to configured MongoDB URI...`);
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`[Database] Successfully connected to MongoDB at ${uri.split('@')[1] || uri}`);
      return uri;
    } catch (err: any) {
      console.warn(`[Database] Warning: Could not connect to configured MongoDB URI (${err.message}).`);
    }
  } else {
    console.log(`[Database] Notice: MONGODB_URI contains password placeholder or is not configured.`);
  }

  // Fallback to MongoMemoryReplSet for local development & automated testing with full transaction support
  console.log(`[Database] Starting embedded MongoDB Replica Set (with transaction support)...`);
  try {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const memoryUri = replSet.getUri();
    await mongoose.connect(memoryUri);
    console.log(`[Database] Successfully connected to embedded MongoDB Replica Set at: ${memoryUri}`);
    return memoryUri;
  } catch (embeddedErr: any) {
    console.error(`[Database] Error starting embedded MongoDB:`, embeddedErr);
    throw embeddedErr;
  }
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
  if (replSet) {
    await replSet.stop();
  }
};
