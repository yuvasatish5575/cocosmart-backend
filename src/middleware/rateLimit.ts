import rateLimit from "express-rate-limit";
import { isTest } from "../config/env";

/** Applied only to auth endpoints — slows down credential-stuffing/brute-force attempts. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  // The test suite legitimately calls /auth/* far more than 20 times per run.
  skip: () => isTest,
  message: {
    success: false,
    error: { code: "RATE_LIMITED", message: "Too many attempts. Please try again later." },
  },
});
