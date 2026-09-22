import { Schema, model, Types } from "mongoose";

export const MAX_VERIFICATION_ATTEMPTS = 5;
export const VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 30 * 1000;

/** REGISTRATION codes confirm a new account's email; LOGIN codes authenticate an existing, already-verified one — kept in the same collection (identical TTL/attempt/cooldown rules) but never matched against each other. */
export const VERIFICATION_PURPOSES = ["REGISTRATION", "LOGIN"] as const;
export type VerificationPurpose = (typeof VERIFICATION_PURPOSES)[number];

export interface EmailVerificationDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  email: string;
  purpose: VerificationPurpose;
  codeHash: string;
  expiresAt: Date;
  attemptCount: number;
  verifiedAt: Date | null;
  createdAt: Date;
}

const emailVerificationSchema = new Schema<EmailVerificationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true, lowercase: true },
    purpose: { type: String, enum: VERIFICATION_PURPOSES, default: "REGISTRATION" },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attemptCount: { type: Number, default: 0 },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "email_verifications" }
);

emailVerificationSchema.index({ email: 1, purpose: 1, createdAt: -1 });
// TTL index: MongoDB removes the document once `expiresAt` is in the past —
// `expireAfterSeconds: 0` means "expire exactly at the stored timestamp"
// rather than N seconds after it.
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerificationModel = model<EmailVerificationDoc>("EmailVerification", emailVerificationSchema);
