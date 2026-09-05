import type { ClientSession } from "mongoose";
import { CartModel, type CartDoc, type CartItemDoc } from "../models/Cart";
import type { ProductWithCategory } from "./productRepository";

export type CartItemWithProduct = Omit<CartItemDoc, "product"> & { product: ProductWithCategory };
export type CartWithItems = Omit<CartDoc, "items"> & { items: CartItemWithProduct[] };

const itemsPopulate = { path: "items.product", populate: { path: "categoryId" } };

export const cartRepository = {
  /** Every user has exactly one cart, created lazily on first access. */
  async getOrCreateForUser(userId: string): Promise<CartWithItems> {
    const existing = await CartModel.findOne({ userId }).populate<{ items: CartItemWithProduct[] }>(itemsPopulate).lean();
    if (existing) return existing;
    // A brand-new cart has no items to populate, so no second query is needed.
    const created = await CartModel.create({ userId, items: [] });
    return created.toObject() as unknown as CartWithItems;
  },
  /** Finds the cart that owns a given item id — combines the ownership check with the lookup. */
  findCartWithItem(userId: string, itemId: string) {
    return CartModel.findOne({ userId, "items._id": itemId }).populate<{ items: CartItemWithProduct[] }>(itemsPopulate).lean();
  },
  addItem(cartId: string, data: { product: string; size: string; quantity: number; price: number }) {
    return CartModel.updateOne({ _id: cartId }, { $push: { items: data } });
  },
  incrementItem(cartId: string, itemId: string, byQuantity: number) {
    return CartModel.updateOne({ _id: cartId, "items._id": itemId }, { $inc: { "items.$.quantity": byQuantity } });
  },
  setItemQuantity(cartId: string, itemId: string, quantity: number) {
    return CartModel.updateOne({ _id: cartId, "items._id": itemId }, { $set: { "items.$.quantity": quantity } });
  },
  removeItem(cartId: string, itemId: string) {
    return CartModel.updateOne({ _id: cartId }, { $pull: { items: { _id: itemId } } });
  },
  clear(cartId: string, session?: ClientSession) {
    return CartModel.updateOne({ _id: cartId }, { $set: { items: [] } }, { session });
  },
};
