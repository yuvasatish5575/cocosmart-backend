import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

interface Schemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Parses+replaces req.body/query/params with the validated (and
 * coerced/defaulted) result.
 *
 * Express 5 made `req.query` a read-only getter (assigning `req.query = x`
 * now throws "Cannot set property query of #<IncomingMessage> which has
 * only a getter"), so it's overridden via defineProperty instead of a plain
 * assignment. `params` isn't affected but is handled the same way for
 * consistency and to be resilient to future Express changes.
 */
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", { value: parsed, writable: true, configurable: true, enumerable: true });
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.defineProperty(req, "params", { value: parsed, writable: true, configurable: true, enumerable: true });
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
