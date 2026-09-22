import { z } from "zod";
import { indianStateSchema, indianPhoneSchema, pinCodeSchema } from "./indianStates";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  phone: indianPhoneSchema,
  addressLine1: z.string().trim().min(3).max(200),
  addressLine2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(2).max(100),
  state: indianStateSchema,
  postalCode: pinCodeSchema,
  country: z.string().trim().min(2).max(60).default("India"),
  isDefault: z.boolean().default(false),
});

export const updateAddressSchema = addressSchema.partial();
