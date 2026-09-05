import { cartRepository, type CartWithItems } from "../repositories/cartRepository";
import { productRepository } from "../repositories/productRepository";
import { ApiError } from "../utils/ApiError";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "../config/constants";
import type { AddCartItemInput } from "../types/dto";

function present(cart: CartWithItems) {
  const lines = cart.items.map((item) => ({
    key: item._id.toString(),
    productId: item.product._id.toString(),
    slug: item.product.slug,
    name: item.product.name,
    image: item.product.image ?? undefined,
    size: item.size,
    price: item.price,
    qty: item.quantity,
    tone: item.product.tone,
    lineTotal: item.price * item.quantity,
    available: item.product.isActive && item.product.stockQuantity >= item.quantity,
    stockQuantity: item.product.stockQuantity,
  }));
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const count = lines.reduce((sum, l) => sum + l.qty, 0);
  const delivery = count === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  return {
    id: cart._id.toString(),
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
    const existing = cart.items.find((item) => item.product._id.toString() === input.productId && item.size === input.size);
    const desiredQty = (existing?.quantity ?? 0) + input.quantity;

    if (desiredQty > product.stockQuantity) {
      throw ApiError.insufficientStock(`Only ${product.stockQuantity} unit(s) of "${product.name}" available`);
    }

    if (existing) {
      await cartRepository.incrementItem(cart._id.toString(), existing._id.toString(), input.quantity);
    } else {
      const effectivePrice = product.discountPrice ? product.discountPrice : product.price;
      await cartRepository.addItem(cart._id.toString(), {
        product: input.productId,
        size: input.size,
        quantity: input.quantity,
        price: effectivePrice,
      });
    }

    return this.getCart(userId);
  },

  async updateItem(userId: string, itemId: string, quantity: number) {
    const cart = await cartRepository.findCartWithItem(userId, itemId);
    if (!cart) throw ApiError.notFound("Cart item not found");
    const item = cart.items.find((i) => i._id.toString() === itemId)!;

    if (quantity <= 0) {
      await cartRepository.removeItem(cart._id.toString(), itemId);
      return this.getCart(userId);
    }

    const product = await productRepository.findById(item.product._id.toString());
    if (!product) throw ApiError.notFound("Product not found");
    if (quantity > product.stockQuantity) {
      throw ApiError.insufficientStock(`Only ${product.stockQuantity} unit(s) of "${product.name}" available`);
    }

    await cartRepository.setItemQuantity(cart._id.toString(), itemId, quantity);
    return this.getCart(userId);
  },

  async removeItem(userId: string, itemId: string) {
    const cart = await cartRepository.findCartWithItem(userId, itemId);
    if (!cart) throw ApiError.notFound("Cart item not found");
    await cartRepository.removeItem(cart._id.toString(), itemId);
    return this.getCart(userId);
  },

  async clear(userId: string) {
    const cart = await cartRepository.getOrCreateForUser(userId);
    await cartRepository.clear(cart._id.toString());
    return this.getCart(userId);
  },
};
