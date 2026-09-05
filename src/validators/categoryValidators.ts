import { z } from "zod";

const productTone = z.enum(["coconut", "leaf", "gold", "cream", "charcoal"]);

export const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().trim().max(500).optional(),
  image: z.string().url().optional(),
  tone: productTone.default("coconut"),
  isActive: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();
