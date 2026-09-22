import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env, isProduction } from "./config/env";
import { apiRouter } from "./routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { swaggerSpec } from "./docs/swagger";
import { UPLOADS_DIR } from "./middleware/upload";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // Product/category images are public assets served to whichever storefront or admin
  // dashboard origin requests them, so they're opted out of helmet's default
  // same-origin CORP restriction (which would otherwise break cross-origin <img> loads).
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.FRONTEND_URL.split(",").map((o) => o.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
  });

  app.use("/uploads", express.static(UPLOADS_DIR, { maxAge: "7d" }));

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
