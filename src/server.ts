import { env } from "./config/env";
import { createApp } from "./app";
import { connectDB, disconnectDB } from "./config/db";
import { logger } from "./config/logger";

async function main() {
  await connectDB();
  logger.info("Connected to MongoDB");

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`CocoSmart API listening on port ${env.PORT}`, { env: env.NODE_ENV });
    logger.info(`API docs: http://localhost:${env.PORT}/api/docs`);
  });

  async function shutdown(signal: string) {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  }

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});

main().catch((err) => {
  logger.error("Failed to start server", { error: String(err) });
  process.exit(1);
});
