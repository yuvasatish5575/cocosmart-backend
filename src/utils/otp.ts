import crypto from "node:crypto";

/** A cryptographically random 6-digit code, zero-padded (e.g. "004821"). `randomInt` avoids the modulo bias `Math.random() % 1e6` would introduce. */
export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/** Same one-way hash used for refresh/reset tokens — a leaked DB row can't be replayed as a code. */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}
