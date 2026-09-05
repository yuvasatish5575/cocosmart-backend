import { Schema, model, Types } from "mongoose";

export const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = ["UPI", "CARD", "COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderItemDoc {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  productName: string;
  size: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  orderNumber: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  tax: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  /** Snapshot of the delivery address at order time — stays accurate even if the source Address is later edited or deleted. */
  shippingAddress: Record<string, unknown>;
  addressId?: Types.ObjectId | null;
  deliverySlot?: string;
  items: OrderItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItemDoc>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  productName: { type: String, required: true },
  size: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  total: { type: Number, required: true },
});

const orderSchema = new Schema<OrderDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: "PENDING" },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: "PENDING" },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    addressId: { type: Schema.Types.ObjectId, ref: "Address", default: null },
    deliverySlot: { type: String },
    items: { type: [orderItemSchema], default: [] },
  },
  { timestamps: true, collection: "orders" }
);

orderSchema.index({ userId: 1 });
orderSchema.index({ orderStatus: 1 });

export const OrderModel = model<OrderDoc>("Order", orderSchema);
