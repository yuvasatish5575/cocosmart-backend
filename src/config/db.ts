import dns from "node:dns";
import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

mongoose.set("strictQuery", true);

// A `mongodb+srv://` URL (e.g. any Atlas cluster) needs a DNS SRV lookup to
// find its shard hosts. Node's own resolver (not the OS's) fails that lookup
// through some routers/ISPs on Windows with ECONNREFUSED even though the
// system resolver works fine — pointing it at a public resolver first is the
// standard workaround.
if (env.DATABASE_URL.startsWith("mongodb+srv://")) {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

export async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) return; // already connected/connecting
  mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", { error: String(err) }));
  await mongoose.connect(env.DATABASE_URL);
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}
