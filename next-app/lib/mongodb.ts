import { Db, MongoClient } from "mongodb";

declare global {
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

export function databaseName() {
  return process.env.MONGODB_DB || "gaav2ghar";
}

export function getMongoClient(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  if (!global.mongoClientPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    global.mongoClientPromise = client.connect().catch((error) => {
      global.mongoClientPromise = undefined;
      throw error;
    });
  }

  return global.mongoClientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(databaseName());
}
