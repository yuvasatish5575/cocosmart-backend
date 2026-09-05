import { PasswordResetTokenModel } from "../models/PasswordResetToken";

export const passwordResetTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return PasswordResetTokenModel.create(data);
  },
  findByHash(tokenHash: string) {
    return PasswordResetTokenModel.findOne({ tokenHash }).lean();
  },
  markUsed(id: string) {
    return PasswordResetTokenModel.findByIdAndUpdate(id, { usedAt: new Date() });
  },
  invalidateAllForUser(userId: string) {
    return PasswordResetTokenModel.updateMany({ userId, usedAt: null }, { usedAt: new Date() });
  },
};
