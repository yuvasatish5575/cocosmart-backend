import { wishlistRepository } from "../repositories/wishlistRepository";
import { productRepository } from "../repositories/productRepository";
import { ApiError } from "../utils/ApiError";
import { toPublicProduct } from "../utils/presenters";

export const wishlistService = {
  async list(userId: string) {
    const rows = await wishlistRepository.listForUser(userId);
    return rows.map((row) => toPublicProduct(row.product));
  },

  async add(userId: string, productId: string) {
    const product = await productRepository.findById(productId);
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");
    const existing = await wishlistRepository.find(userId, productId);
    if (!existing) await wishlistRepository.add(userId, productId);
    return this.list(userId);
  },

  async remove(userId: string, productId: string) {
    const existing = await wishlistRepository.find(userId, productId);
    if (existing) await wishlistRepository.remove(userId, productId);
    return this.list(userId);
  },
};
