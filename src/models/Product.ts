import { Schema, model, Types } from "mongoose";
import { PRODUCT_TONES, type ProductTone } from "./Category";

export interface ProductDoc {
  _id: Types.ObjectId;
  categoryId: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  discountPrice?: number | null;
  sku: string;
  stockQuantity: number;
  unit: string;
  sizes: string[];
  image?: string | null;
  images: string[];
  tone: ProductTone;
  rating: number;
  reviewCount: number;
  benefits: unknown[];
  ingredients: string[];
  nutritionalInformation: unknown[];
  storage?: string | null;
  origin?: string | null;
  traceability?: unknown;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDoc>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number, default: null },
    sku: { type: String, required: true, unique: true },
    stockQuantity: { type: Number, default: 0 },
    unit: { type: String, required: true },
    sizes: { type: [String], default: [] },
    image: { type: String, default: null },
    images: { type: [String], default: [] },
    tone: { type: String, enum: PRODUCT_TONES, default: "coconut" },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    benefits: { type: [Schema.Types.Mixed], default: [] },
    ingredients: { type: [String], default: [] },
    nutritionalInformation: { type: [Schema.Types.Mixed], default: [] },
    storage: { type: String, default: null },
    origin: { type: String, default: null },
    traceability: { type: Schema.Types.Mixed, default: null },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "products" }
);

productSchema.index({ categoryId: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });

export const ProductModel = model<ProductDoc>("Product", productSchema);
