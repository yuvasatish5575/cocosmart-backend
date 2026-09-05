import type { Request, Response } from "express";
import { categoryService } from "../services/categoryService";
import { ok, created, noContent } from "../utils/apiResponse";

export const categoryController = {
  async list(req: Request, res: Response) {
    const activeOnly = !req.user || req.user.role !== "ADMIN";
    const categories = await categoryService.list({ activeOnly });
    ok(res, { categories });
  },

  async create(req: Request, res: Response) {
    const category = await categoryService.create(req.body);
    created(res, category);
  },

  async update(req: Request, res: Response) {
    const category = await categoryService.update(req.params.id as string, req.body);
    ok(res, category);
  },

  async remove(req: Request, res: Response) {
    await categoryService.remove(req.params.id as string);
    noContent(res);
  },
};
