import { PrismaClient, Prisma } from "@prisma/client";
import { isProduction } from "./env";

/** Either the top-level client or the `tx` handed to a `$transaction` callback — repositories accept this so the same methods work standalone or inside a transaction. */
export type PrismaClientOrTx = PrismaClient | Prisma.TransactionClient;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Single shared Prisma client. Reused across hot reloads in dev (tsx watch
 * would otherwise spin up a new connection pool on every file change).
 */
export const prisma =
  global.__prisma ??
  new PrismaClient({
    log: isProduction ? ["error", "warn"] : ["warn", "error"],
  });

if (!isProduction) {
  global.__prisma = prisma;
}
