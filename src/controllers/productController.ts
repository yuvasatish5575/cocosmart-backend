import type { Request, Response } from "express";
import { productService } from "../services/productService";
import { activityLogService } from "../services/activityLogService";
import { ok, created, noContent } from "../utils/apiResponse";

export const productController = {
  async list(req: Request, res: Response) {
    const result = await productService.list(req.query as never, { activeOnly: true });
    ok(res, result);
  },

  async listAdmin(req: Request, res: Response) {
    const result = await productService.list(req.query as never, { activeOnly: false });
    ok(res, result);
  },

  async getBySlug(req: Request, res: Response) {
    const product = await productService.getBySlug(req.params.slug as string, { activeOnly: true });
    ok(res, product);
  },

  async getById(req: Request, res: Response) {
    const product = await productService.getById(req.params.id as string);
    ok(res, product);
  },

  async create(req: Request, res: Response) {
    const product = await productService.create(req.body);
    if (req.user) await activityLogService.record(req.user.id, "PRODUCT_CREATED", "PRODUCT", product.id, product.name);
    created(res, product);
  },

  async update(req: Request, res: Response) {
    const product = await productService.update(req.params.id as string, req.body);
    if (req.user) await activityLogService.record(req.user.id, "PRODUCT_UPDATED", "PRODUCT", product.id, product.name);
    ok(res, product);
  },

  async remove(req: Request, res: Response) {
    const removed = await productService.remove(req.params.id as string);
    if (req.user) await activityLogService.record(req.user.id, "PRODUCT_DELETED", "PRODUCT", removed.id, removed.name);
    noContent(res);
  },
};
