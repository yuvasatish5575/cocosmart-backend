import { UserModel, type WishlistEntry } from "../models/User";
import type { ProductWithCategory } from "./productRepository";

type WishlistEntryWithProduct = Omit<WishlistEntry, "product"> & { product: ProductWithCategory };

export const wishlistRepository = {
  async listForUser(userId: string): Promise<WishlistEntryWithProduct[]> {
    const user = await UserModel.findById(userId)
      .populate<{ wishlist: WishlistEntryWithProduct[] }>({ path: "wishlist.product", populate: { path: "categoryId" } })
      .lean();
    return [...(user?.wishlist ?? [])].sort((a, b) => b.addedAt.getTime() - a.addedAt.getTime());
  },
  async find(userId: string, productId: string) {
    const user = await UserModel.findOne({ _id: userId, "wishlist.product": productId }, { "wishlist.$": 1 }).lean();
    return user?.wishlist?.[0] ?? null;
  },
  add(userId: string, productId: string) {
    return UserModel.updateOne({ _id: userId }, { $push: { wishlist: { product: productId, addedAt: new Date() } } });
  },
  remove(userId: string, productId: string) {
    return UserModel.updateOne({ _id: userId }, { $pull: { wishlist: { product: productId } } });
  },
};
