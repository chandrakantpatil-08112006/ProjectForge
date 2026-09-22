import mongoose from 'mongoose';

let memoryServer;

/**
 * Connects mongoose to a throwaway database.
 * - MONGODB_URI_TEST set  -> use it (a local/docker MongoDB; the database is wiped between tests!)
 * - otherwise             -> start an in-memory MongoDB via mongodb-memory-server
 */
export async function connectTestDb() {
  let uri = process.env.MONGODB_URI_TEST;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri('projectforge_test');
  }
  await mongoose.connect(uri);
  // Build unique indexes before any test relies on them.
  const results = await Promise.allSettled(Object.values(mongoose.models).map((model) => model.init()));
  for (const result of results) {
    // FerretDB (a MongoDB look-alike sometimes used for local runs) has no TTL indexes; real MongoDB does.
    const unsupported = /not implemented yet/i.test(result.reason?.message ?? '');
    if (result.status === 'rejected' && !unsupported) throw result.reason;
  }
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.disconnect();
  await memoryServer?.stop();
}
