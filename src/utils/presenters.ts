import type { Types } from "mongoose";
import { stockLabel } from "./productPresentation";
import type { UserDoc } from "../models/User";
import type { AddressDoc } from "../models/Address";
import type { CategoryDoc } from "../models/Category";
import type { OrderDoc, OrderItemDoc } from "../models/Order";
import type { ProductWithCategory } from "../repositories/productRepository";
import type { ActivityLogWithAdmin } from "../repositories/activityLogRepository";

type Id = Types.ObjectId | string;

/**
 * Maps the normalized DB row onto the flat shape the existing frontend's
 * `Product` type already expects (see src/data/types.ts) — price/mrp,
 * derived stock label, category name+slug, etc. — so the frontend needed no
 * redesign to consume real data.
 */
export function toPublicProduct(product: ProductWithCategory) {
  const price = product.price;
  const discountPrice = product.discountPrice ? product.discountPrice : null;
  const effectivePrice = discountPrice ?? price;

  return {
    id: product._id.toString(),
    slug: product.slug,
    name: product.name,
    category: product.categoryId.name,
    categorySlug: product.categoryId.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: effectivePrice,
    mrp: discountPrice ? price : undefined,
    sku: product.sku,
    unit: product.unit,
    sizes: product.sizes,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: stockLabel(product.stockQuantity),
    stockQuantity: product.stockQuantity,
    bestseller: product.isFeatured,
    tone: product.tone,
    image: product.image ?? undefined,
    images: product.images,
    benefits: product.benefits,
    ingredients: product.ingredients,
    nutrition: product.nutritionalInformation,
    storage: product.storage ?? undefined,
    origin: product.origin ?? undefined,
    traceability: product.traceability ?? { available: false },
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}

export function toPublicAddress(address: AddressDoc) {
  return {
    id: address._id.toString(),
    fullName: address.fullName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? undefined,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    country: address.country,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
    updatedAt: address.updatedAt,
  };
}

export function toPublicCategory(category: CategoryDoc) {
  return {
    id: category._id.toString(),
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image ?? undefined,
    tone: category.tone,
    isActive: category.isActive,
  };
}

type OrderWithItems = Omit<OrderDoc, "userId"> & { userId: Id | { _id: Id; name: string; email: string } };

function customerFrom(userId: OrderWithItems["userId"]): { id: string; name: string; email: string } | undefined {
  if (userId && typeof userId === "object" && "name" in userId) {
    return { id: userId._id.toString(), name: userId.name, email: userId.email };
  }
  return undefined;
}

export function toPublicOrder(order: OrderWithItems) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discount: order.discount,
    shippingCost: order.shippingCost,
    tax: order.tax,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    deliverySlot: order.deliverySlot ?? undefined,
    items: order.items.map((item: OrderItemDoc) => ({
      id: item._id.toString(),
      productId: item.product.toString(),
      productName: item.productName,
      size: item.size,
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    })),
    customer: customerFrom(order.userId),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

/** Lighter than toPublicOrder — for dashboard "recent orders" lists that don't need line items. */
export function toOrderSummary(order: OrderWithItems) {
  return {
    id: order._id.toString(),
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    totalAmount: order.totalAmount,
    customer: customerFrom(order.userId),
    createdAt: order.createdAt,
  };
}

export function toPublicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export function toActivityLogEntry(entry: ActivityLogWithAdmin) {
  const admin =
    entry.adminId && typeof entry.adminId === "object" && "name" in entry.adminId
      ? { id: entry.adminId._id.toString(), name: entry.adminId.name, email: entry.adminId.email }
      : undefined;

  return {
    id: entry._id.toString(),
    admin,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId.toString(),
    entityName: entry.entityName,
    detail: entry.detail ?? undefined,
    createdAt: entry.createdAt,
  };
}
