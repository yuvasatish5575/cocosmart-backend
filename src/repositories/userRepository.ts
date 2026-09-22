import { UserModel, type UserDoc } from "../models/User";

export const userRepository = {
  findByEmail(email: string) {
    return UserModel.findOne({ email }).lean();
  },
  findById(id: string) {
    return UserModel.findById(id).lean();
  },
  create(data: Pick<UserDoc, "name" | "email" | "passwordHash"> & Partial<Pick<UserDoc, "phone" | "role">>) {
    return UserModel.create(data).then((doc) => doc.toObject());
  },
  update(id: string, data: Partial<Pick<UserDoc, "name" | "phone" | "passwordHash" | "isActive" | "emailVerified">>) {
    return UserModel.findByIdAndUpdate(id, data, { new: true }).lean();
  },
  async list(params: { skip: number; take: number }) {
    const rows = await UserModel.aggregate([
      { $match: { role: "CUSTOMER" } },
      { $sort: { createdAt: -1 } },
      { $skip: params.skip },
      { $limit: params.take },
      { $lookup: { from: "orders", localField: "_id", foreignField: "userId", as: "orders" } },
      {
        $project: {
          _id: 0,
          id: { $toString: "$_id" },
          name: 1,
          email: 1,
          phone: 1,
          isActive: 1,
          createdAt: 1,
          _count: { orders: { $size: "$orders" } },
        },
      },
    ]);
    return rows;
  },
  count() {
    return UserModel.countDocuments({ role: "CUSTOMER" });
  },
};
