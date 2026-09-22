import crypto from "node:crypto";
import { userRepository } from "../repositories/userRepository";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository";
import { passwordResetTokenRepository } from "../repositories/passwordResetTokenRepository";
import { emailVerificationRepository } from "../repositories/emailVerificationRepository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../utils/jwt";
import { generateOtp, hashOtp } from "../utils/otp";
import { ApiError } from "../utils/ApiError";
import { toPublicUser } from "../utils/presenters";
import { emailService } from "./emailService";
import { env, primaryFrontendUrl } from "../config/env";
import { MAX_VERIFICATION_ATTEMPTS, VERIFICATION_TTL_MS, RESEND_COOLDOWN_MS, type VerificationPurpose } from "../models/EmailVerification";
import type { RegisterInput, LoginInput } from "../types/dto";

const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

function refreshExpiryDate(): Date {
  const match = /^(\d+)([smhd])$/.exec(env.JWT_REFRESH_EXPIRES_IN);
  const amount = match ? Number(match[1]) : 30;
  const unit = match?.[2] ?? "d";
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit as "s" | "m" | "h" | "d"];
  return new Date(Date.now() + amount * unitMs);
}

async function issueTokens(userId: string, role: "CUSTOMER" | "ADMIN") {
  const accessToken = signAccessToken({ sub: userId, role });
  const { token: refreshToken } = signRefreshToken(userId);
  await refreshTokenRepository.create({
    userId,
    tokenHash: hashToken(refreshToken),
    expiresAt: refreshExpiryDate(),
  });
  return { accessToken, refreshToken };
}

/** Generates a code on the backend, stores only its hash, and emails the plaintext — the code is never returned in an API response or logged. */
async function issueVerificationCode(userId: string, email: string, purpose: VerificationPurpose): Promise<void> {
  const code = generateOtp();
  await emailVerificationRepository.create({
    userId,
    email,
    purpose,
    codeHash: hashOtp(code),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS),
  });
  if (purpose === "LOGIN") {
    await emailService.sendLoginOtpEmail(email, code);
  } else {
    await emailService.sendVerificationEmail(email, code);
  }
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      if (existing.emailVerified) {
        throw ApiError.conflict("An account with this email already exists");
      }
      // Registered but never completed verification — don't create a
      // duplicate account or silently re-send here; tell the caller so the
      // frontend can offer "Send New Code", which hits /resend-code.
      throw ApiError.emailNotVerified("This email is already registered but not verified. Would you like us to send a new verification code?");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
    });

    await issueVerificationCode(user._id.toString(), user.email, "REGISTRATION");

    return {
      email: user.email,
      message: "Account created. We've sent a verification code to your email.",
    };
  },

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email);
    // Deliberately identical error for "no such user" and "wrong password" —
    // distinguishing them lets an attacker enumerate registered emails.
    if (!user || !(await verifyPassword(user.passwordHash, input.password))) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("This account has been deactivated");
    }
    // Checked only after the password is confirmed correct, so a wrong-password
    // guess on someone else's email still can't be used to probe verification state.
    if (!user.emailVerified) {
      throw ApiError.emailNotVerified();
    }
    const tokens = await issueTokens(user._id.toString(), user.role);
    return { user: toPublicUser(user), ...tokens };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date() || stored.userId.toString() !== payload.sub) {
      throw ApiError.unauthorized("Invalid or expired refresh token");
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized("Account no longer available");
    }

    // Rotate: revoke the used token and issue a fresh pair.
    await refreshTokenRepository.revoke(stored._id.toString());
    const tokens = await issueTokens(user._id.toString(), user.role);
    return { user: toPublicUser(user), ...tokens };
  },

  async logout(refreshToken: string) {
    const stored = await refreshTokenRepository.findByHash(hashToken(refreshToken)).catch(() => null);
    if (stored) await refreshTokenRepository.revoke(stored._id.toString());
  },

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound("User not found");
    return toPublicUser(user);
  },

  async verifyEmail(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    // Same generic error whether the email doesn't exist, has no active code,
    // or the code's simply wrong — this endpoint shouldn't reveal which.
    const invalidCodeError = () => ApiError.badRequest("Invalid or expired verification code");
    if (!user) throw invalidCodeError();

    if (user.emailVerified) {
      return { message: "Email already verified." };
    }

    const record = await emailVerificationRepository.findLatestActiveForEmail(normalizedEmail, "REGISTRATION");
    if (!record) throw invalidCodeError();

    if (record.expiresAt < new Date()) {
      throw ApiError.badRequest("This verification code has expired. Please request a new one.");
    }

    if (record.attemptCount >= MAX_VERIFICATION_ATTEMPTS) {
      throw ApiError.tooManyRequests("Too many verification attempts. Please request a new verification code.");
    }

    if (hashOtp(code) !== record.codeHash) {
      await emailVerificationRepository.incrementAttempts(record._id.toString());
      const attemptsNow = record.attemptCount + 1;
      if (attemptsNow >= MAX_VERIFICATION_ATTEMPTS) {
        // Lock the code out immediately rather than letting it linger until its TTL.
        await emailVerificationRepository.expireNow(record._id.toString());
        throw ApiError.tooManyRequests("Too many verification attempts. Please request a new verification code.");
      }
      throw ApiError.badRequest("Invalid verification code");
    }

    await emailVerificationRepository.markVerified(record._id.toString());
    await userRepository.update(user._id.toString(), { emailVerified: true });

    return { message: "Email verified successfully." };
  },

  async resendVerificationCode(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    // Nothing to resend for an unregistered or already-verified email — but
    // say the same thing either way rather than confirming which case it is.
    if (!user || user.emailVerified) {
      return { message: "If that email needs a new verification code, we've sent one." };
    }

    const latest = await emailVerificationRepository.findLatestActiveForEmail(normalizedEmail, "REGISTRATION");
    if (latest) {
      const elapsedMs = Date.now() - latest.createdAt.getTime();
      if (elapsedMs < RESEND_COOLDOWN_MS) {
        const retryAfterSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsedMs) / 1000);
        throw ApiError.tooManyRequests(`Please wait ${retryAfterSeconds}s before requesting another code.`, { retryAfterSeconds });
      }
    }

    await issueVerificationCode(user._id.toString(), user.email, "REGISTRATION");
    return { message: "A new verification code has been sent to your email." };
  },

  /** Passwordless login, step 1: email a one-time code to an existing, verified account. */
  async requestLoginOtp(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    // Same generic response regardless of why there's nothing to send —
    // unregistered, unverified, deactivated, or a live cooldown — so this
    // endpoint can't be used to enumerate accounts or their state.
    const genericResponse = { message: "If that email can sign in with a code, we've sent one." };
    if (!user || !user.emailVerified || !user.isActive) {
      return genericResponse;
    }

    const latest = await emailVerificationRepository.findLatestActiveForEmail(normalizedEmail, "LOGIN");
    if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      // Cooldown is real, but reported the same generic way — a caller who
      // doesn't already know this is a valid, active account learns nothing new.
      return genericResponse;
    }

    await issueVerificationCode(user._id.toString(), user.email, "LOGIN");
    return genericResponse;
  },

  /** Passwordless login, step 2: verify the code and issue a real session, same as password login does. */
  async loginWithOtp(email: string, code: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    const invalidCodeError = () => ApiError.badRequest("Invalid or expired code");
    if (!user || !user.emailVerified || !user.isActive) throw invalidCodeError();

    const record = await emailVerificationRepository.findLatestActiveForEmail(normalizedEmail, "LOGIN");
    if (!record) throw invalidCodeError();

    if (record.expiresAt < new Date()) {
      throw ApiError.badRequest("This code has expired. Please request a new one.");
    }
    if (record.attemptCount >= MAX_VERIFICATION_ATTEMPTS) {
      throw ApiError.tooManyRequests("Too many attempts. Please request a new code.");
    }

    if (hashOtp(code) !== record.codeHash) {
      await emailVerificationRepository.incrementAttempts(record._id.toString());
      if (record.attemptCount + 1 >= MAX_VERIFICATION_ATTEMPTS) {
        await emailVerificationRepository.expireNow(record._id.toString());
        throw ApiError.tooManyRequests("Too many attempts. Please request a new code.");
      }
      throw ApiError.badRequest("Invalid code");
    }

    await emailVerificationRepository.markVerified(record._id.toString());
    const tokens = await issueTokens(user._id.toString(), user.role);
    return { user: toPublicUser(user), ...tokens };
  },

  async requestPasswordReset(email: string, redirectUrl?: string) {
    const user = await userRepository.findByEmail(email);
    // Always succeed from the caller's perspective, whether or not the email
    // is registered — otherwise the endpoint becomes an account-enumeration oracle.
    if (!user || !user.isActive) return;

    await passwordResetTokenRepository.invalidateAllForUser(user._id.toString());

    const token = crypto.randomBytes(32).toString("hex");
    await passwordResetTokenRepository.create({
      userId: user._id.toString(),
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    });

    // A caller (storefront, admin dashboard, ...) can ask the link to point back
    // to its own origin instead of the default. Only an already-trusted origin
    // (the same allowlist CORS uses) is honored, so this can't become an open redirect.
    const allowedOrigins = env.FRONTEND_URL.split(",").map((o) => o.trim());
    const base = redirectUrl && allowedOrigins.includes(redirectUrl) ? redirectUrl : primaryFrontendUrl;

    const resetUrl = `${base}/reset-password?token=${token}`;
    await emailService.sendPasswordResetEmail(user.email, resetUrl);
  },

  async resetPassword(token: string, newPassword: string) {
    const stored = await passwordResetTokenRepository.findByHash(hashToken(token));
    if (!stored || stored.usedAt || stored.expiresAt < new Date()) {
      throw ApiError.badRequest("This reset link is invalid or has expired");
    }

    const passwordHash = await hashPassword(newPassword);
    const userId = stored.userId.toString();
    await userRepository.update(userId, { passwordHash });
    await passwordResetTokenRepository.markUsed(stored._id.toString());
    // A password reset is a strong signal the account may have been at risk —
    // revoke every existing session rather than leaving old refresh tokens valid.
    await refreshTokenRepository.revokeAllForUser(userId);
  },
};
