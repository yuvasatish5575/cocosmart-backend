import { prisma, type PrismaClientOrTx } from "../config/prisma";

const cartInclude = {
  items: {
    include: { product: { include: { category: true } } },
    orderBy: { createdAt: "asc" as const },
  },
};

export const cartRepository = {
  /** Every user has exactly one cart, created lazily on first access. */
  async getOrCreateForUser(userId: string) {
    const existing = await prisma.cart.findUnique({ where: { userId }, include: cartInclude });
    if (existing) return existing;
    return prisma.cart.create({ data: { userId }, include: cartInclude });
  },
  findItem(cartId: string, productId: string, size: string) {
    return prisma.cartItem.findUnique({ where: { cartId_productId_size: { cartId, productId, size } } });
  },
  findItemById(id: string) {
    return prisma.cartItem.findUnique({ where: { id }, include: { cart: true } });
  },
  addItem(data: { cartId: string; productId: string; size: string; quantity: number; price: number }) {
    return prisma.cartItem.create({ data });
  },
  incrementItem(id: string, byQuantity: number) {
    return prisma.cartItem.update({ where: { id }, data: { quantity: { increment: byQuantity } } });
  },
  setItemQuantity(id: string, quantity: number) {
    return prisma.cartItem.update({ where: { id }, data: { quantity } });
  },
  removeItem(id: string) {
    return prisma.cartItem.delete({ where: { id } });
  },
  clear(cartId: string, client: PrismaClientOrTx = prisma) {
    return client.cartItem.deleteMany({ where: { cartId } });
  },
};
