import type { Category, Order, OrderItem, Product, User } from "@prisma/client";
import { stockLabel } from "./productPresentation";

type OrderWithItems = Order & { items: OrderItem[]; user?: { id: string; name: string; email: string } | null };

type ProductWithCategory = Product & { category: Category };

/**
 * Maps the normalized DB row onto the flat shape the existing frontend's
 * `Product` type already expects (see src/data/types.ts) — price/mrp,
 * derived stock label, category name+slug, etc. — so the frontend needed no
 * redesign to consume real data.
 */
export function toPublicProduct(product: ProductWithCategory) {
  const price = Number(product.price);
  const discountPrice = product.discountPrice ? Number(product.discountPrice) : null;
  const effectivePrice = discountPrice ?? price;

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    category: product.category.name,
    categorySlug: product.category.slug,
    shortDescription: product.shortDescription,
    description: product.description,
    price: effectivePrice,
    mrp: discountPrice ? price : undefined,
    sku: product.sku,
    sizes: product.sizes,
    rating: Number(product.rating),
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

export function toPublicCategory(category: Category) {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    image: category.image ?? undefined,
    tone: category.tone,
    isActive: category.isActive,
  };
}

export function toPublicOrder(order: OrderWithItems) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    shippingCost: Number(order.shippingCost),
    tax: Number(order.tax),
    totalAmount: Number(order.totalAmount),
    shippingAddress: order.shippingAddress,
    deliverySlot: order.deliverySlot ?? undefined,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      size: item.size,
      price: Number(item.price),
      quantity: item.quantity,
      total: Number(item.total),
    })),
    customer: order.user ?? undefined,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

type OrderSummaryRow = Order & { user: { name: string; email: string } | null };

/** Lighter than toPublicOrder — for dashboard "recent orders" lists that don't need line items. */
export function toOrderSummary(order: OrderSummaryRow) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    totalAmount: Number(order.totalAmount),
    customer: order.user ?? undefined,
    createdAt: order.createdAt,
  };
}

export function toPublicUser(user: User) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone ?? undefined,
    role: user.role,
    createdAt: user.createdAt,
  };
}
