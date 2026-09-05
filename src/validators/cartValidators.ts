import { z } from "zod";

export const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  size: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive().max(50).default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(50),
});

export const cartItemParamSchema = z.object({ id: z.string().uuid() });
