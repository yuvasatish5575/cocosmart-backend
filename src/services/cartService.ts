import { cartRepository } from "../repositories/cartRepository";
import { productRepository } from "../repositories/productRepository";
import { ApiError } from "../utils/ApiError";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "../config/constants";
import type { AddCartItemInput } from "../types/dto";
import type { Prisma } from "@prisma/client";

type CartWithItems = Prisma.CartGetPayload<{
  include: { items: { include: { product: { include: { category: true } } } } };
}>;

function present(cart: CartWithItems) {
  const lines = cart.items.map((item) => ({
    key: item.id,
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    size: item.size,
    price: Number(item.price),
    qty: item.quantity,
    tone: item.product.tone,
    lineTotal: Number(item.price) * item.quantity,
    available: item.product.isActive && item.product.stockQuantity >= item.quantity,
    stockQuantity: item.product.stockQuantity,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const delivery = count === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    id: cart.id,
    lines,
    count,
    subtotal,
    delivery,
    total: subtotal + delivery,
  };
}

export const cartService = {
  async getCart(userId: string) {
    const cart = await cartRepository.getOrCreateForUser(userId);
    return present(cart);
  },

  async addItem(userId: string, input: AddCartItemInput) {
    const product = await productRepository.findById(input.productId);
    if (!product || !product.isActive) throw ApiError.notFound("Product not found");
    if (!product.sizes.includes(input.size) && product.sizes.length > 0) {
      throw ApiError.badRequest(`"${input.size}" is not an available pack size for this product`);
    }

    const cart = await cartRepository.getOrCreateForUser(userId);
    const existing = await cartRepository.findItem(cart.id, input.productId, input.size);
    const desiredQty = (existing?.quantity ?? 0) + input.quantity;

    if (desiredQty > product.stockQuantity) {
      throw ApiError.insufficientStock(`Only ${product.stockQuantity} unit(s) of "${product.name}" available`);
    }

    if (existing) {
      await cartRepository.incrementItem(existing.id, input.quantity);
    } else {
      const effectivePrice = product.discountPrice ? Number(product.discountPrice) : Number(product.price);
      await cartRepository.addItem({
        cartId: cart.id,
        productId: input.productId,
        size: input.size,
        quantity: input.quantity,
        price: effectivePrice,
      });
    }

    return this.getCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const item = await cartRepository.findItemById(itemId);
    if (!item || item.cart.userId !== userId) throw ApiError.notFound("Cart item not found");

    if (quantity <= 0) {
      await cartRepository.removeItem(itemId);
      return this.getCart(userId);
    }

    const product = await productRepository.findById(item.productId);
    if (!product) throw ApiError.notFound("Product not found");
    if (quantity > product.stockQuantity) {
      throw ApiError.insufficientStock(`Only ${product.stockQuantity} unit(s) of "${product.name}" available`);
    }

    await cartRepository.setItemQuantity(itemId, quantity);
    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string) {
    const item = await cartRepository.findItemById(itemId);
    if (!item || item.cart.userId !== userId) throw ApiError.notFound("Cart item not found");
    await cartRepository.removeItem(itemId);
    return this.getCart(userId);
  },

  async clear(userId: string) {
    const cart = await cartRepository.getOrCreateForUser(userId);
    await cartRepository.clear(cart.id);
    return this.getCart(userId);
  },
};
