import { Schema, model, Types } from "mongoose";

export const PRODUCT_TONES = ["coconut", "leaf", "gold", "cream", "charcoal"] as const;
export type ProductTone = (typeof PRODUCT_TONES)[number];

export interface CategoryDoc {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  tone: ProductTone;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDoc>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String },
    image: { type: String },
    tone: { type: String, enum: PRODUCT_TONES, default: "coconut" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "categories" }
);

categorySchema.index({ isActive: 1 });

export const CategoryModel = model<CategoryDoc>("Category", categorySchema);
