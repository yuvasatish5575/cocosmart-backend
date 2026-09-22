import type { Request, Response } from "express";
import { categoryService } from "../services/categoryService";
import { activityLogService } from "../services/activityLogService";
import { ok, created, noContent } from "../utils/apiResponse";

export const categoryController = {
  async list(req: Request, res: Response) {
    const activeOnly = !req.user || req.user.role !== "ADMIN";
    const categories = await categoryService.list({ activeOnly });
    ok(res, { categories });
  },

  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body);
    if (req.user) await activityLogService.record(req.user.id, "CATEGORY_CREATED", "CATEGORY", category.id, category.name);
    created(res, category);
  },

  async update(req: Request, res: Response) {
    const category = await categoryService.update(req.params.id as string, req.body);
    if (req.user) await activityLogService.record(req.user.id, "CATEGORY_UPDATED", "CATEGORY", category.id, category.name);
    ok(res, category);
  },

  async remove(req: Request, res: Response) {
    const removed = await categoryService.remove(req.params.id as string);
    if (req.user) await activityLogService.record(req.user.id, "CATEGORY_DELETED", "CATEGORY", removed.id, removed.name);
    noContent(res);
  },
};
