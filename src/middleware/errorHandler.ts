import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError";
import { logger } from "../config/logger";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const apiError = toApiError(err);

  if (apiError.statusCode >= 500) {
    logger.error(apiError.message, { path: req.originalUrl, method: req.method, stack: isProduction ? undefined : (err as Error)?.stack });
  }

  res.status(apiError.statusCode).json({
    success: false,
    error: {
      code: apiError.code,
      message: apiError.message,
      ...(apiError.details ? { details: apiError.details } : {}),
    },
  });
}

function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof ZodError) {
    return ApiError.badRequest("Validation failed", err.flatten());
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return ApiError.conflict(`A record with this ${target} already exists`);
    }
    if (err.code === "P2025") {
      return ApiError.notFound("Record not found");
    }
    if (err.code === "P2003") {
      return ApiError.badRequest("Referenced record does not exist");
    }
  }

  return ApiError.internal(isProduction ? "Something went wrong" : String((err as Error)?.message ?? err));
}
