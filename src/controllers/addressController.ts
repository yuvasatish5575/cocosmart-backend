import type { Request, Response } from "express";
import { addressService } from "../services/addressService";
import { ok, created, noContent } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

export const addressController = {
  async list(req: Request, res: Response) {
    ok(res, { addresses: await addressService.list(userId(req)) });
  },
  async create(req: Request, res: Response) {
    created(res, await addressService.create(userId(req), req.body));
  },
  async update(req: Request, res: Response) {
    ok(res, await addressService.update(userId(req), req.params.id as string, req.body));
  },
  async remove(req: Request, res: Response) {
    await addressService.remove(userId(req), req.params.id as string);
    noContent(res);
  },
};
