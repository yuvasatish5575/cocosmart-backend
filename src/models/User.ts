import { Schema, model, Types } from "mongoose";
import { ROLES, type Role } from "../types/roles";

export interface WishlistEntry {
  product: Types.ObjectId;
  addedAt: Date;
}

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  phone?: string;
  role: Role;
  isActive: boolean;
  emailVerified: boolean;
  wishlist: WishlistEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const wishlistEntrySchema = new Schema<WishlistEntry>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new Schema<UserDoc>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    phone: { type: String },
    role: { type: String, enum: ROLES, default: "CUSTOMER" },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    wishlist: { type: [wishlistEntrySchema], default: [] },
  },
  { timestamps: true, collection: "users" }
);

userSchema.index({ role: 1 });

export const UserModel = model<UserDoc>("User", userSchema);
