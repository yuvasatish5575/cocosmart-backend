import type { Request, Response } from "express";
import { orderService } from "../services/orderService";
import { ok, created } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";

function requireUser(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return req.user;
}

export const orderController = {
  async checkout(req: Request, res: Response) {
    const user = requireUser(req);
    created(res, await orderService.checkout(user.id, req.body));
  },

  async listMine(req: Request, res: Response) {
    const user = requireUser(req);
    ok(res, await orderService.listForUser(user.id, req.query as never));
  },

  async getMine(req: Request, res: Response) {
    const user = requireUser(req);
    ok(res, await orderService.getById(user.id, user.role, req.params.id as string));
  },

  async listAll(req: Request, res: Response) {
    ok(res, await orderService.listAll(req.query as never));
  },

  async getAny(req: Request, res: Response) {
    const user = requireUser(req);
    ok(res, await orderService.getById(user.id, user.role, req.params.id as string));
  },

  async updateStatus(req: Request, res: Response) {
    ok(res, await orderService.updateStatus(req.params.id as string, req.body.orderStatus));
  },
};
