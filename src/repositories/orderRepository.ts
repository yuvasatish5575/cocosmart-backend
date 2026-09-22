import type { ClientSession, Types } from "mongoose";
import { OrderModel, type OrderDoc, type OrderItemDoc, type OrderStatus } from "../models/Order";

type OrderCustomer = { _id: Types.ObjectId; name: string; email: string };

type OrderCreateData = Omit<
  Pick<OrderDoc, "userId" | "orderNumber" | "subtotal" | "totalAmount" | "paymentMethod" | "shippingAddress">,
  "userId"
> & { userId: string } & Partial<
    Omit<Pick<OrderDoc, "discount" | "shippingCost" | "tax" | "paymentStatus" | "orderStatus" | "addressId" | "deliverySlot">, "addressId"> & {
      addressId: string | null;
    }
  > & {
    items: Array<Omit<Pick<OrderItemDoc, "product" | "productName" | "size" | "price" | "quantity" | "total">, "product"> & { product: string | OrderItemDoc["product"] }>;
  };

export const orderRepository = {
  async create(data: OrderCreateData, session?: ClientSession) {
    const [order] = await OrderModel.create([data], { session });
    return order!.toObject();
  },
  findById(id: string) {
    return OrderModel.findById(id).lean();
  },
  async listForUser(userId: string, params: { skip: number; take: number }) {
    const [rows, total] = await Promise.all([
      OrderModel.find({ userId }).sort({ createdAt: -1 }).skip(params.skip).limit(params.take).lean(),
      OrderModel.countDocuments({ userId }),
    ]);
    return [rows, total] as const;
  },
  async listAll(params: { skip: number; take: number; status?: OrderStatus }) {
    const where = params.status ? { orderStatus: params.status } : {};
    const [rows, total] = await Promise.all([
      OrderModel.find(where)
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.take)
        .populate<{ userId: OrderCustomer }>({ path: "userId", select: "name email" })
        .lean(),
      OrderModel.countDocuments(where),
    ]);
    return [rows, total] as const;
  },
  updateStatus(id: string, orderStatus: OrderStatus) {
    return OrderModel.findByIdAndUpdate(id, { orderStatus }, { new: true })
      .populate<{ userId: OrderCustomer }>({ path: "userId", select: "name email" })
      .lean();
  },
  recentForDashboard(take = 5) {
    return OrderModel.find()
      .sort({ createdAt: -1 })
      .limit(take)
      .populate<{ userId: OrderCustomer }>({ path: "userId", select: "name email" })
      .lean();
  },
  async aggregateRevenue() {
    const [result] = await OrderModel.aggregate([
      { $match: { paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);
    return result?.total ?? 0;
  },
  countByStatus(status: OrderStatus) {
    return OrderModel.countDocuments({ orderStatus: status });
  },
  count() {
    return OrderModel.countDocuments();
  },
  async hasOrderForProduct(productId: string) {
    return (await OrderModel.exists({ "items.product": productId })) !== null;
  },
};
