/**
 * Minimal structured logger. Never pass secrets, tokens, or full request
 * bodies into `meta` — see the security notes in README.md.
 */
type Meta = Record<string, unknown>;

function write(level: "info" | "warn" | "error", message: string, meta?: Meta) {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: Meta) => write("info", message, meta),
  warn: (message: string, meta?: Meta) => write("warn", message, meta),
  error: (message: string, meta?: Meta) => write("error", message, meta),
};
