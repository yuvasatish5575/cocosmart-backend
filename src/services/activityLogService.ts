import { activityLogRepository } from "../repositories/activityLogRepository";
import { paginationMeta, toSkipTake } from "../utils/pagination";
import { toActivityLogEntry } from "../utils/presenters";
import { logger } from "../config/logger";
import type { ActivityAction, ActivityEntityType } from "../models/ActivityLog";

export const activityLogService = {
  /**
   * A logging failure should never fail the admin action it's recording
   * (creating the product still matters even if the audit write hiccups),
   * so this swallows its own errors after logging them.
   */
  async record(
    adminId: string,
    action: ActivityAction,
    entityType: ActivityEntityType,
    entityId: string,
    entityName: string,
    detail?: string
  ) {
    try {
      await activityLogRepository.record({ adminId, action, entityType, entityId, entityName, detail });
    } catch (err) {
      logger.error("Failed to record activity log", { error: String(err), action, entityType, entityId });
    }
  },

  async list(query: { page: number; limit: number }) {
    const { skip, take } = toSkipTake(query);
    const [rows, total] = await activityLogRepository.list({ skip, take });
    return {
      activity: rows.map(toActivityLogEntry),
      pagination: paginationMeta(query, total),
    };
  },
};
