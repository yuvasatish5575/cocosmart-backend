/**
 * Runs after testEnv.ts in every worker process (see vitest.config.ts's
 * `setupFiles` order) — by this point globalSetup has already decided
 * DATABASE_URL and that choice has propagated via inherited env vars.
 *
 * Mongoose doesn't auto-connect like Prisma did — without this, every query
 * `app` makes buffers forever and every request eventually 500s with a
 * "buffering timed out" error.
 */
import { beforeAll } from "vitest";
import { connectDB } from "../src/config/db";

beforeAll(async () => {
  await connectDB();
});
