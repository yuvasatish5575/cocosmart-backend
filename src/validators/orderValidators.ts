import { z } from "zod";
import { objectId } from "./common";
import { indianStateSchema, indianPhoneSchema, pinCodeSchema } from "./indianStates";

export const checkoutSchema = z.object({
  addressId: objectId.optional(),
  /** Accepted when the customer hasn't saved an address yet — becomes a saved address. */
  newAddress: z
    .object({
      fullName: z.string().trim().min(2).max(100),
      phone: indianPhoneSchema,
      addressLine1: z.string().trim().min(3).max(200),
      addressLine2: z.string().trim().max(200).optional(),
      city: z.string().trim().min(2).max(100),
      state: indianStateSchema,
      postalCode: pinCodeSchema,
      country: z.string().trim().min(2).max(60).default("India"),
    })
    .optional(),
  paymentMethod: z.enum(["UPI", "CARD", "COD"]),
  deliverySlot: z.string().trim().max(100).optional(),
}).refine((data) => data.addressId || data.newAddress, {
  message: "Either addressId or newAddress is required",
  path: ["addressId"],
});

export const updateOrderStatusSchema = z.object({
  orderStatus: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
});

export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]).optional(),
});
