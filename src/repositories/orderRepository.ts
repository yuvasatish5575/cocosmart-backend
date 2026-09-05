import { prisma, type PrismaClientOrTx } from "../config/prisma";
import type { OrderStatus, Prisma } from "@prisma/client";

const orderInclude = {
  items: true,
  address: true,
};

export const orderRepository = {
  create(data: Prisma.OrderCreateInput, client: PrismaClientOrTx = prisma) {
    return client.order.create({ data, include: orderInclude });
  },
  findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  },
  listForUser(userId: string, params: { skip: number; take: number }) {
    return prisma.$transaction([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: orderInclude,
      }),
      prisma.order.count({ where: { userId } }),
    ]);
  },
  listAll(params: { skip: number; take: number; status?: OrderStatus }) {
    const where: Prisma.OrderWhereInput = params.status ? { orderStatus: params.status } : {};
    return prisma.$transaction([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
        include: { ...orderInclude, user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.order.count({ where }),
    ]);
  },
  updateStatus(id: string, orderStatus: OrderStatus) {
    return prisma.order.update({ where: { id }, data: { orderStatus }, include: orderInclude });
  },
  recentForDashboard(take = 5) {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: { user: { select: { name: true, email: true } } },
    });
  },
  aggregateRevenue() {
    return prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { totalAmount: true },
    });
  },
  countByStatus(status: OrderStatus) {
    return prisma.order.count({ where: { orderStatus: status } });
  },
  count() {
    return prisma.order.count();
  },
};
