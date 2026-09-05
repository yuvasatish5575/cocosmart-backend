import type { Request, Response } from "express";
import { cartService } from "../services/cartService";
import { ok } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export const cartController = {
  async getCart(req: Request, res: Response) {
    ok(res, await cartService.getCart(userId(req)));
  },
  async addItem(req: Request, res: Response) {
    ok(res, await cartService.addItem(userId(req), req.body));
  },
  async updateItem(req: Request, res: Response) {
    ok(res, await cartService.updateItem(userId(req), req.params.id as string, req.body.quantity));
  },
  async removeItem(req: Request, res: Response) {
    ok(res, await cartService.removeItem(userId(req), req.params.id as string));
  },
  async clear(req: Request, res: Response) {
    ok(res, await cartService.clear(userId(req)));
  },
};
