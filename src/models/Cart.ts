import { Schema, model, Types } from "mongoose";

export interface CartItemDoc {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  size: string;
  quantity: number;
  /** Unit price snapshotted from Product at the moment it was added — totals are always recomputed server-side from this. */
  price: number;
}

export interface CartDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  items: CartItemDoc[];
  createdAt: Date;
  updatedAt: Date;
}

const cartItemSchema = new Schema<CartItemDoc>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  size: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const cartSchema = new Schema<CartDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, collection: "carts" }
);

export const CartModel = model<CartDoc>("Cart", cartSchema);
