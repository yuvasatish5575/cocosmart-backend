import { prisma } from "../config/prisma";

export const wishlistRepository = {
  listForUser(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: { product: { include: { category: true } } },
      orderBy: { createdAt: "desc" },
    });
  },
  find(userId: string, productId: string) {
    return prisma.wishlist.findUnique({ where: { userId_productId: { userId, productId } } });
  },
  add(userId: string, productId: string) {
    return prisma.wishlist.create({ data: { userId, productId } });
  },
  remove(userId: string, productId: string) {
    return prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
  },
};
