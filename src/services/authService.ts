import crypto from "node:crypto";
import { userRepository } from "../repositories/userRepository";
import { refreshTokenRepository } from "../repositories/refreshTokenRepository";
import { passwordResetTokenRepository } from "../repositories/passwordResetTokenRepository";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, hashToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import { toPublicUser } from "../utils/presenters";
import { emailService } from "./emailService";
import { env } from "../config/env";
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

export const authService = {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw ApiError.conflict("An account with this email already exists");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      phone: input.phone,
    });
    const tokens = await issueTokens(user._id.toString(), user.role);
    return { user: toPublicUser(user), ...tokens };
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

  async requestPasswordReset(email: string) {
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

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`;
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
