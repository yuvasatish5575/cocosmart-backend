/**
 * Runs a real, local MongoDB replica set with no Docker/Atlas account
 * required — useful for day-to-day dev so you're not blocked by Atlas's
 * free-tier cluster auto-pausing after inactivity. Downloads a real mongod
 * binary on first run (via mongodb-memory-server, the same package the test
 * suite uses) and keeps data in `.mongodb-data/` between runs, so restarting
 * this script does not wipe your local data.
 *
 * A replica set (even a single member) is required, not a plain standalone
 * server, because checkout runs inside a multi-document transaction.
 *
 * Usage: npm run db:local   (leave running in its own terminal)
 */
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { mkdirSync } from "node:fs";
import path from "node:path";

const DB_PATH = path.join(__dirname, "..", ".mongodb-data");
const PORT = 27117;
const DB_NAME = "cocosmart";

async function main() {
  // mongodb-memory-server reads this directory to detect existing data on
  // startup but doesn't create it itself — it must already exist.
  mkdirSync(DB_PATH, { recursive: true });

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
    instanceOpts: [{ port: PORT, dbPath: DB_PATH, storageEngine: "wiredTiger" }],
  });

  const uri = replSet.getUri(DB_NAME);
  console.log("\nLocal MongoDB replica set is running.");
  console.log(`DATABASE_URL="${uri}"`);
  console.log("\nKeep this process running, then in another terminal run:");
  console.log("  npm run db:seed");
  console.log("\nPress Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\nStopping local MongoDB...");
    await replSet.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start local MongoDB:", err);
  process.exit(1);
});
