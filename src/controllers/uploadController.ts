import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ok } from "../utils/apiResponse";

export const uploadController = {
  async image(req: Request, res: Response) {
    if (!req.file) throw ApiError.badRequest("No image file was provided");
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    ok(res, { url });
  },
};
