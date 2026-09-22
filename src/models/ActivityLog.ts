import { Schema, model, Types } from "mongoose";

export const ACTIVITY_ACTIONS = [
  "PRODUCT_CREATED",
  "PRODUCT_UPDATED",
  "PRODUCT_DELETED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "ORDER_STATUS_UPDATED",
] as const;
export type ActivityAction = (typeof ACTIVITY_ACTIONS)[number];

export const ACTIVITY_ENTITY_TYPES = ["PRODUCT", "CATEGORY", "ORDER"] as const;
export type ActivityEntityType = (typeof ACTIVITY_ENTITY_TYPES)[number];

export interface ActivityLogDoc {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: Types.ObjectId;
  /** Denormalized at write time so the log still reads sensibly after the product/category/order is renamed or removed. */
  entityName: string;
  detail?: string;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLogDoc>(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, enum: ACTIVITY_ACTIONS, required: true },
    entityType: { type: String, enum: ACTIVITY_ENTITY_TYPES, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    entityName: { type: String, required: true },
    detail: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: "activityLogs" }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entityType: 1 });

export const ActivityLogModel = model<ActivityLogDoc>("ActivityLog", activityLogSchema);
