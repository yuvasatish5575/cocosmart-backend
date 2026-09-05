/**
 * Runs a real, local PostgreSQL server with no Docker/WSL/system install
 * required — useful for local dev and CI sandboxes where Docker's Linux
 * engine isn't available. Downloads a real Postgres binary for the current
 * platform (via the `embedded-postgres` package) on first run and keeps
 * data in `.pgdata/` between runs.
 *
 * Usage: npm run db:local   (leave running in its own terminal)
 */
// @ts-expect-error — the package's export map isn't resolvable under this
// project's `moduleResolution: Node` setting; it still works fine at runtime.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(__dirname, "..", ".pgdata");
const PORT = 5433;
const USER = "cocosmart";
const PASSWORD = "cocosmart";
const DATABASE = "cocosmart";

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });

  const alreadyInitialised = existsSync(join(DATA_DIR, "PG_VERSION"));

  if (!alreadyInitialised) {
    console.log("Initialising local PostgreSQL data directory (first run only)...");
    await pg.initialise();
  }

  await pg.start();

  try {
    await pg.createDatabase(DATABASE);
  } catch {
    // Database already exists — fine on subsequent runs.
  }

  const url = `postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`;
  console.log("\nLocal PostgreSQL is running.");
  console.log(`DATABASE_URL="${url}"`);
  console.log("\nKeep this process running, then in another terminal run:");
  console.log("  npm run db:migrate");
  console.log("  npm run db:seed");
  console.log("\nPress Ctrl+C to stop the database.\n");

  const shutdown = async () => {
    console.log("\nStopping local PostgreSQL...");
    await pg.stop();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start local PostgreSQL:", err);
  process.exit(1);
});
