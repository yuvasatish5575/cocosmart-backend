import { z } from "zod";

/** A MongoDB ObjectId — 24 hex characters. Replaces the old Postgres-era `.uuid()` id validation. */
export const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");
