import { prisma } from "../config/prisma";
import { cartRepository } from "../repositories/cartRepository";
import { orderRepository } from "../repositories/orderRepository";
import { productRepository } from "../repositories/productRepository";
import { addressRepository } from "../repositories/addressRepository";
import { ApiError } from "../utils/ApiError";
import { toPublicOrder } from "../utils/presenters";
import { paginationMeta, toSkipTake } from "../utils/pagination";
import { generateOrderNumber } from "../utils/orderNumber";
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, TAX_RATE } from "../config/constants";
import type { CheckoutInput, OrderListQuery } from "../types/dto";
import type { OrderStatus, Prisma } from "@prisma/client";

export const orderService = {
  /**
   * The whole cart → order flow runs as one DB transaction: if stock is
   * insufficient for *any* line, or any write fails, everything rolls back —
   * the customer is never charged for a partially-fulfilled order and stock
   * never goes negative (see productRepository.decrementStockIfAvailable).
   */
  async checkout(userId: string, input: CheckoutInput) {
    const cart = await cartRepository.getOrCreateForUser(userId);
    if (cart.items.length === 0) {
      throw ApiError.badRequest("Your cart is empty");
    }

    let addressId = input.addressId;
    let addressSnapshot: Prisma.JsonObject;

    if (addressId) {
      const address = await addressRepository.findById(addressId);
      if (!address || address.userId !== userId) throw ApiError.notFound("Address not found");
      addressSnapshot = {
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 ?? undefined,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        country: address.country,
      };
    } else if (input.newAddress) {
      const created = await addressRepository.create({ ...input.newAddress, user: { connect: { id: userId } } });
      addressId = created.id;
      addressSnapshot = {
        fullName: created.fullName,
        phone: created.phone,
        addressLine1: created.addressLine1,
        addressLine2: created.addressLine2 ?? undefined,
        city: created.city,
        state: created.state,
        postalCode: created.postalCode,
        country: created.country,
      };
    } else {
      // Guarded by the validator's .refine(), but keep TypeScript honest.
      throw ApiError.badRequest("An address is required");
    }

    const order = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let discount = 0;
      const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const cartItem of cart.items) {
        // Re-read the product *inside* the transaction — never trust the
        // cart's snapshot price, and never trust the client. This is the
        // authoritative price/availability check for the order being placed.
        const product = await productRepository.findById(cartItem.productId, tx);
        if (!product || !product.isActive) {
          throw ApiError.badRequest(`"${cartItem.product.name}" is no longer available`);
        }

        const listPrice = Number(product.price);
        const effectivePrice = product.discountPrice ? Number(product.discountPrice) : listPrice;

        const decremented = await productRepository.decrementStockIfAvailable(product.id, cartItem.quantity, tx);
        if (!decremented) {
          throw ApiError.insufficientStock(`Only ${product.stockQuantity} unit(s) of "${product.name}" available`);
        }

        subtotal += effectivePrice * cartItem.quantity;
        discount += (listPrice - effectivePrice) * cartItem.quantity;
        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          size: cartItem.size,
          price: effectivePrice,
          quantity: cartItem.quantity,
          total: effectivePrice * cartItem.quantity,
        });
      }

      const shippingCost = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
      const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
      const totalAmount = subtotal + shippingCost + tax;

      const created = await orderRepository.create(
        {
          orderNumber: generateOrderNumber(),
          subtotal,
          discount,
          shippingCost,
          tax,
          totalAmount,
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          orderStatus: "PENDING",
          shippingAddress: addressSnapshot,
          deliverySlot: input.deliverySlot,
          user: { connect: { id: userId } },
          address: addressId ? { connect: { id: addressId } } : undefined,
          items: { createMany: { data: orderItemsData } },
        },
        tx
      );

      await cartRepository.clear(cart.id, tx);

      return created;
    });

    return toPublicOrder(order);
  },

  async listForUser(userId: string, query: OrderListQuery) {
    const { skip, take } = toSkipTake({ page: query.page, limit: query.limit });
    const [rows, total] = await orderRepository.listForUser(userId, { skip, take });
    return {
      orders: rows.map(toPublicOrder),
      pagination: paginationMeta({ page: query.page, limit: query.limit }, total),
    };
  },

  async getById(userId: string, role: "CUSTOMER" | "ADMIN", orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound("Order not found");
    if (role !== "ADMIN" && order.userId !== userId) {
      // 404, not 403 — don't confirm to a probing user that the order ID exists.
      throw ApiError.notFound("Order not found");
    }
    return toPublicOrder(order);
  },

  async listAll(query: OrderListQuery) {
    const { skip, take } = toSkipTake({ page: query.page, limit: query.limit });
    const [rows, total] = await orderRepository.listAll({ skip, take, status: query.status });
    return {
      orders: rows.map(toPublicOrder),
      pagination: paginationMeta({ page: query.page, limit: query.limit }, total),
    };
  },

  async updateStatus(orderId: string, orderStatus: OrderStatus) {
    const existing = await orderRepository.findById(orderId);
    if (!existing) throw ApiError.notFound("Order not found");
    const order = await orderRepository.updateStatus(orderId, orderStatus);
    return toPublicOrder(order);
  },
};
