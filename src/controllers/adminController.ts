import type { Request, Response } from "express";
import { adminService } from "../services/adminService";
import { activityLogService } from "../services/activityLogService";
import { userRepository } from "../repositories/userRepository";
import { toSkipTake, paginationMeta } from "../utils/pagination";
import { ok } from "../utils/apiResponse";
import { z } from "zod";

const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const adminController = {
  async dashboard(_req: Request, res: Response) {
    ok(res, await adminService.dashboard());
  },

  async listUsers(req: Request, res: Response) {
    const query = pageQuerySchema.parse(req.query);
    const { skip, take } = toSkipTake(query);
    const [users, total] = await Promise.all([userRepository.list({ skip, take }), userRepository.count()]);
    ok(res, { users, pagination: paginationMeta(query, total) });
  },

  async activity(req: Request, res: Response) {
    const query = pageQuerySchema.parse(req.query);
    ok(res, await activityLogService.list(query));
  },
};
