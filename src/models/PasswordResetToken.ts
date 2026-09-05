import { Schema, model, Types } from "mongoose";

export interface PasswordResetTokenDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

const passwordResetTokenSchema = new Schema<PasswordResetTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "password_reset_tokens" }
);

passwordResetTokenSchema.index({ userId: 1 });

export const PasswordResetTokenModel = model<PasswordResetTokenDoc>("PasswordResetToken", passwordResetTokenSchema);
