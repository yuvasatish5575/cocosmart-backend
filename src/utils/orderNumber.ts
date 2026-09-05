import crypto from "node:crypto";

/**
 * Time + random based rather than a "count existing orders" sequence — a
 * sequence query is a race condition under concurrent checkouts, this isn't.
 */
export function generateOrderNumber(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `CS-${time}-${rand}`;
}
