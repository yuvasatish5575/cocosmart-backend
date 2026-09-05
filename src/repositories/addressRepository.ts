import { prisma } from "../config/prisma";
import type { Prisma } from "@prisma/client";

export const addressRepository = {
  listForUser(userId: string) {
    return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }] });
  },
  findById(id: string) {
    return prisma.address.findUnique({ where: { id } });
  },
  create(data: Prisma.AddressCreateInput) {
    return prisma.address.create({ data });
  },
  update(id: string, data: Prisma.AddressUpdateInput) {
    return prisma.address.update({ where: { id }, data });
  },
  delete(id: string) {
    return prisma.address.delete({ where: { id } });
  },
  clearDefaultForUser(userId: string) {
    return prisma.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
  },
};
