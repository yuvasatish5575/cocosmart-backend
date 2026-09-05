import type { Request, Response } from "express";
import { wishlistService } from "../services/wishlistService";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export const wishlistController = {
  async list(req: Request, res: Response) {
    ok(res, { products: await wishlistService.list(userId(req)) });
  },
  async add(req: Request, res: Response) {
    ok(res, { products: await wishlistService.add(userId(req), req.body.productId) });
  },
  async remove(req: Request, res: Response) {
    ok(res, { products: await wishlistService.remove(userId(req), req.params.productId as string) });
  },
};
