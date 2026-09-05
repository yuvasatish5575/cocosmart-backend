import { z } from "zod";

const productTone = z.enum(["coconut", "leaf", "gold", "cream", "charcoal"]);

/** An absolute URL (any host) or a root-relative path served from the frontend's own /public. */
const imageRef = z
  .string()
  .trim()
  .min(1)
  .refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), {
    message: "Must be an absolute URL or a root-relative path starting with /",
  });

const benefitSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  icon: z.enum(["leaf", "droplet", "shield", "sparkles", "sprout", "flame"]),
});

const nutritionFactSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

const traceabilitySchema = z
  .object({
    available: z.boolean(),
    batchId: z.string().optional(),
    farmName: z.string().optional(),
    farmLocation: z.string().optional(),
    harvestDate: z.string().optional(),
    processedDate: z.string().optional(),
    qualityCheckedBy: z.string().optional(),
  })
  .nullable()
  .optional();

export const productListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(12),
  search: z.string().trim().min(1).optional(),
  category: z.string().trim().min(1).optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  featured: z.coerce.boolean().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  sort: z.enum(["popularity", "price_asc", "price_desc", "rating", "newest"]).default("popularity"),
});

export const createProductSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().trim().min(2).max(150),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, hyphen-separated"),
  description: z.string().trim().min(10),
  shortDescription: z.string().trim().min(5).max(200),
  price: z.coerce.number().positive(),
  discountPrice: z.coerce.number().positive().optional(),
  sku: z.string().trim().min(2).max(50),
  stockQuantity: z.coerce.number().int().min(0),
  unit: z.string().trim().min(1).max(30),
  sizes: z.array(z.string().trim().min(1)).default([]),
  image: imageRef.optional(),
  images: z.array(imageRef).default([]),
  tone: productTone.default("coconut"),
  benefits: z.array(benefitSchema).default([]),
  ingredients: z.array(z.string().trim().min(1)).default([]),
  nutritionalInformation: z.array(nutritionFactSchema).default([]),
  storage: z.string().trim().optional(),
  origin: z.string().trim().optional(),
  traceability: traceabilitySchema,
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
}).refine((data) => !data.discountPrice || data.discountPrice < data.price, {
  message: "discountPrice must be lower than price",
  path: ["discountPrice"],
});

export const updateProductSchema = z
  .object({
    categoryId: z.string().uuid(),
    name: z.string().trim().min(2).max(150),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
    description: z.string().trim().min(10),
    shortDescription: z.string().trim().min(5).max(200),
    price: z.coerce.number().positive(),
    discountPrice: z.coerce.number().positive().nullable(),
    sku: z.string().trim().min(2).max(50),
    stockQuantity: z.coerce.number().int().min(0),
    unit: z.string().trim().min(1).max(30),
    sizes: z.array(z.string().trim().min(1)),
    image: imageRef.nullable(),
    images: z.array(imageRef),
    tone: productTone,
    benefits: z.array(benefitSchema),
    ingredients: z.array(z.string().trim().min(1)),
    nutritionalInformation: z.array(nutritionFactSchema),
    storage: z.string().trim().nullable(),
    origin: z.string().trim().nullable(),
    traceability: traceabilitySchema,
    isFeatured: z.boolean(),
    isActive: z.boolean(),
  })
  .partial();

export const idParamSchema = z.object({ id: z.string().uuid() });
export const slugParamSchema = z.object({ slug: z.string().trim().min(1) });
