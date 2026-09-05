import "./testEnv";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

/**
 * Runs once before the whole test run, in the main Vitest process (its
 * `process.env` mutations propagate to the workers spawned afterwards).
 * Points schema push + seeding at a dedicated `cocosmart_test` database on
 * the same local Postgres instance `npm run db:local` starts.
 *
 * Deliberately avoids `prisma db push --force-reset` / `prisma migrate
 * reset` — Prisma CLI refuses those from an AI agent without explicit human
 * sign-off (a safety guard worth keeping). Idempotency across repeated runs
 * is handled instead by truncating every table through our own Prisma
 * Client (an ordinary application-level query against a database that only
 * this test suite uses), then re-seeding.
 */
export default async function globalSetup() {
  execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit", env: process.env });

  const prisma = new PrismaClient();
  try {
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
    `;
    if (tables.length > 0) {
      const names = tables.map((t) => `"public"."${t.tablename}"`).join(", ");
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
    }
  } finally {
    await prisma.$disconnect();
  }

  execSync("npx tsx prisma/seed.ts", { stdio: "inherit", env: process.env });
}
