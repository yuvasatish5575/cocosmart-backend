import { EmailVerificationModel, type VerificationPurpose } from "../models/EmailVerification";

export const emailVerificationRepository = {
  create(data: { userId: string; email: string; purpose: VerificationPurpose; codeHash: string; expiresAt: Date }) {
    return EmailVerificationModel.create(data);
  },
  /** The one record that's still eligible to be verified against — the most recent, not-yet-consumed code for this email and purpose. */
  findLatestActiveForEmail(email: string, purpose: VerificationPurpose) {
    return EmailVerificationModel.findOne({ email: email.toLowerCase(), purpose, verifiedAt: null }).sort({ createdAt: -1 }).lean();
  },
  incrementAttempts(id: string) {
    return EmailVerificationModel.findByIdAndUpdate(id, { $inc: { attemptCount: 1 } });
  },
  markVerified(id: string) {
    return EmailVerificationModel.findByIdAndUpdate(id, { verifiedAt: new Date() });
  },
  /** Locks out a code immediately (e.g. after the attempt cap is hit) without waiting for its natural TTL expiry. */
  expireNow(id: string) {
    return EmailVerificationModel.findByIdAndUpdate(id, { expiresAt: new Date() });
  },
};
