import { Router } from "express";
import { authController } from "../controllers/authController";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendCodeSchema,
  loginOtpRequestSchema,
  loginOtpVerifySchema,
} from "../validators/authValidators";

export const authRoutes = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create a customer account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password, confirmPassword]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8, description: "Must include an uppercase letter, a lowercase letter, a number, and a special character." }
 *               confirmPassword: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201: { description: "Account created (unverified) — a 6-digit verification code was emailed to the address given" }
 *       400: { description: Validation failed (weak password, passwords don't match, etc.) }
 *       403: { description: This email is already registered but not verified }
 *       409: { description: Email already registered and verified }
 */
authRoutes.post("/register", authRateLimiter, validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/verify-email:
 *   post:
 *     tags: [Auth]
 *     summary: Confirm a registration with the 6-digit code emailed at sign-up
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, pattern: "^[0-9]{6}$" }
 *     responses:
 *       200: { description: Email verified — the account can now sign in }
 *       400: { description: Invalid, expired, or already-used code }
 *       429: { description: Too many incorrect attempts — request a new code }
 */
authRoutes.post("/verify-email", authRateLimiter, validate({ body: verifyEmailSchema }), authController.verifyEmail);

/**
 * @openapi
 * /auth/resend-code:
 *   post:
 *     tags: [Auth]
 *     summary: Send a fresh verification code, invalidating any earlier one
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: "A new code was sent (or, for an unregistered/already-verified email, a no-op that still returns success)" }
 *       429: { description: Resend cooldown still active }
 */
authRoutes.post("/resend-code", authRateLimiter, validate({ body: resendCodeSchema }), authController.resendCode);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate with email + password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Authenticated }
 *       401: { description: Invalid credentials }
 */
authRoutes.post("/login", authRateLimiter, validate({ body: loginSchema }), authController.login);

/**
 * @openapi
 * /auth/login-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Passwordless login, step 1 — email a one-time code to an existing verified account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200: { description: "A code was sent (or, for an unregistered/unverified/deactivated email, a no-op that still returns success)" }
 */
authRoutes.post("/login-otp", authRateLimiter, validate({ body: loginOtpRequestSchema }), authController.requestLoginOtp);

/**
 * @openapi
 * /auth/verify-login-otp:
 *   post:
 *     tags: [Auth]
 *     summary: Passwordless login, step 2 — verify the code and receive tokens
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, pattern: "^[0-9]{6}$" }
 *     responses:
 *       200: { description: Authenticated — same shape as password login }
 *       400: { description: Invalid or expired code }
 *       429: { description: Too many incorrect attempts — request a new code }
 */
authRoutes.post("/verify-login-otp", authRateLimiter, validate({ body: loginOtpVerifySchema }), authController.loginWithOtp);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Exchange a refresh token for a new access/refresh token pair
 *     responses:
 *       200: { description: New tokens issued }
 *       401: { description: Invalid or expired refresh token }
 */
authRoutes.post("/refresh", authRateLimiter, validate({ body: refreshSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 *     responses:
 *       200: { description: Logged out }
 */
authRoutes.post("/logout", validate({ body: refreshSchema }), authController.logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the currently authenticated user
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Not authenticated }
 */
authRoutes.get("/me", authenticate, authController.me);

/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *               redirectUrl: { type: string, description: "Origin the reset link should point back to — must match one of the configured FRONTEND_URL origins, else it's ignored" }
 *     responses:
 *       200: { description: "Always succeeds — doesn't reveal whether the email is registered" }
 */
authRoutes.post("/forgot-password", authRateLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Complete a password reset with the token from the emailed link
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password]
 *             properties:
 *               token: { type: string }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Password updated }
 *       400: { description: Invalid or expired token }
 */
authRoutes.post("/reset-password", authRateLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
