import { RefreshTokenModel } from "../models/RefreshToken";

export const refreshTokenRepository = {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return RefreshTokenModel.create(data);
  },
  findByHash(tokenHash: string) {
    return RefreshTokenModel.findOne({ tokenHash }).lean();
  },
  revoke(id: string) {
    return RefreshTokenModel.findByIdAndUpdate(id, { revokedAt: new Date() });
  },
  revokeAllForUser(userId: string) {
    return RefreshTokenModel.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
  },
};
