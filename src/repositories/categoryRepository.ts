import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export const categoryRepository = {
  listActive() {
    return prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  },
  listAll() {
    return prisma.category.findMany({ orderBy: { name: "asc" } });
  },
  findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },
  findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },
  create(data: Prisma.CategoryCreateInput) {
    return prisma.category.create({ data });
  },
  update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
