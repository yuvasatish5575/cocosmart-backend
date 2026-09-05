import type { Request, Response } from "express";
import { authService } from "../services/authService";
import { ok, created } from "../utils/apiResponse";
import { ApiError } from "../utils/ApiError";

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    created(res, result);
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    ok(res, result);
  },

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body.refreshToken);
    ok(res, result);
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.body.refreshToken);
    ok(res, { message: "Logged out" });
  },

  async me(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const user = await authService.me(req.user.id);
    ok(res, user);
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.requestPasswordReset(req.body.email);
    ok(res, { message: "If an account exists for that email, we've sent a reset link." });
  },

  async resetPassword(req: Request, res: Response) {
    await authService.resetPassword(req.body.token, req.body.password);
    ok(res, { message: "Password updated. You can now sign in." });
  },
};
