import type { Types } from "mongoose";
import { ActivityLogModel, type ActivityAction, type ActivityEntityType } from "../models/ActivityLog";

export type ActivityLogWithAdmin = Omit<import("../models/ActivityLog").ActivityLogDoc, "adminId"> & {
  adminId: { _id: Types.ObjectId; name: string; email: string } | Types.ObjectId | null;
};

interface RecordInput {
  adminId: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  entityName: string;
  detail?: string;
}

export const activityLogRepository = {
  record(input: RecordInput) {
    return ActivityLogModel.create(input);
  },

  async list(params: { skip: number; take: number }) {
    const [rows, total] = await Promise.all([
      ActivityLogModel.find()
        .sort({ createdAt: -1 })
        .skip(params.skip)
        .limit(params.take)
        .populate<{ adminId: ActivityLogWithAdmin["adminId"] }>({ path: "adminId", select: "name email" })
        .lean(),
      ActivityLogModel.countDocuments(),
    ]);
    return [rows as ActivityLogWithAdmin[], total] as const;
  },
};
