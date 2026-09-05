import "./testEnv";
import { execSync } from "node:child_process";
import mongoose from "mongoose";
import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * Runs once before the whole test run, in the main Vitest process (its
 * `process.env` mutations propagate to the workers spawned afterwards).
 *
 * Checkout runs inside a multi-document transaction, which MongoDB only
 * supports on a replica set. If DATABASE_URL isn't already set (e.g. to a
 * MongoDB Atlas test database for CI), this spins up a real, disposable
 * single-node replica set with no external service required — the MongoDB
 * equivalent of what `embedded-postgres` gave the old Postgres setup.
 *
 * Either way, the target database is dropped for idempotency across
 * repeated runs, then re-seeded through the same script `npm run db:seed` uses.
 */
export default async function globalSetup() {
  let replSet: MongoMemoryReplSet | undefined;
  if (!process.env.DATABASE_URL) {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, dbName: "cocosmart_test", storageEngine: "wiredTiger" },
    });
    process.env.DATABASE_URL = replSet.getUri("cocosmart_test");
  }

  const connection = await mongoose.createConnection(process.env.DATABASE_URL).asPromise();
  await connection.dropDatabase();
  await connection.close();

  execSync("npx tsx src/seed.ts", { stdio: "inherit", env: process.env });

  return async () => {
    await replSet?.stop();
  };
}
