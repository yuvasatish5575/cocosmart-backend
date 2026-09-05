import { prisma, type PrismaClientOrTx } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export interface ProductListFilter {
  search?: string;
  categorySlug?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  inStockOnly?: boolean;
  activeOnly: boolean;
  sort: "popularity" | "price_asc" | "price_desc" | "rating" | "newest";
  skip: number;
  take: number;
}

function whereFor(filter: ProductListFilter): Prisma.ProductWhereInput {
  const where: Prisma.ProductWhereInput = {};
  if (filter.activeOnly) where.isActive = true;
  if (filter.categorySlug) where.category = { slug: filter.categorySlug };
  if (filter.featured) where.isFeatured = true;
  if (filter.inStockOnly) where.stockQuantity = { gt: 0 };
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.price = {
      ...(filter.minPrice !== undefined ? { gte: filter.minPrice } : {}),
      ...(filter.maxPrice !== undefined ? { lte: filter.maxPrice } : {}),
    };
  }
  if (filter.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { shortDescription: { contains: filter.search, mode: "insensitive" } },
      { category: { name: { contains: filter.search, mode: "insensitive" } } },
    ];
  }
  return where;
}

function orderByFor(sort: ProductListFilter["sort"]): Prisma.ProductOrderByWithRelationInput[] {
  switch (sort) {
    case "price_asc":
      return [{ price: "asc" }];
    case "price_desc":
      return [{ price: "desc" }];
    case "rating":
      return [{ rating: "desc" }];
    case "newest":
      return [{ createdAt: "desc" }];
    default:
      return [{ isFeatured: "desc" }, { reviewCount: "desc" }];
  }
}

export const productRepository = {
  list(filter: ProductListFilter) {
    const where = whereFor(filter);
    return prisma.$transaction([
      prisma.product.findMany({
        where,
        orderBy: orderByFor(filter.sort),
        skip: filter.skip,
        take: filter.take,
        include: { category: true },
      }),
      prisma.product.count({ where }),
    ]);
  },
  findById(id: string, client: PrismaClientOrTx = prisma) {
    return client.product.findUnique({ where: { id }, include: { category: true } });
  },
  findBySlug(slug: string) {
    return prisma.product.findUnique({ where: { slug }, include: { category: true } });
  },
  create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data, include: { category: true } });
  },
  update(id: string, data: Prisma.ProductUpdateInput, client: PrismaClientOrTx = prisma) {
    return client.product.update({ where: { id }, data, include: { category: true } });
  },
  decrementStock(id: string, byQuantity: number, client: PrismaClientOrTx = prisma) {
    return client.product.update({ where: { id }, data: { stockQuantity: { decrement: byQuantity } } });
  },
  /**
   * Atomic "decrement only if enough stock" — the availability check and the
   * write happen as one SQL statement (`UPDATE ... WHERE stock >= qty`), so
   * two concurrent checkouts for the last unit can't both pass a check done
   * as a separate earlier read and then both decrement past zero. Returns
   * the number of rows updated: 0 means insufficient stock.
   */
  async decrementStockIfAvailable(id: string, byQuantity: number, client: PrismaClientOrTx = prisma) {
    const result = await client.product.updateMany({
      where: { id, stockQuantity: { gte: byQuantity } },
      data: { stockQuantity: { decrement: byQuantity } },
    });
    return result.count > 0;
  },
  softDelete(id: string) {
    return prisma.product.update({ where: { id }, data: { isActive: false } });
  },
  delete(id: string) {
    return prisma.product.delete({ where: { id } });
  },
  lowStock(threshold: number, take = 10) {
    return prisma.product.findMany({
      where: { isActive: true, stockQuantity: { lte: threshold } },
      orderBy: { stockQuantity: "asc" },
      take,
      include: { category: true },
    });
  },
  count(where?: Prisma.ProductWhereInput) {
    return prisma.product.count({ where });
  },
};
