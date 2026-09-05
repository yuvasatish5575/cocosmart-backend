const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Formats a Date as an ISO 8601 string with a literal `+05:30` offset
 * instead of `Z`, so API consumers see India time directly rather than UTC.
 * Still the same absolute instant — shifting the underlying value forward by
 * the IST offset before formatting, then relabeling the trailing `Z` as
 * `+05:30`, is what makes the offset correct when the string is re-parsed.
 */
export function toIstIsoString(date: Date): string {
  const shifted = new Date(date.getTime() + IST_OFFSET_MS);
  return shifted.toISOString().replace("Z", "+05:30");
}

/** Recursively rewrites every Date in a JSON-shaped value to its IST ISO string. */
export function withIstDates<T>(value: T): T {
  if (value instanceof Date) return toIstIsoString(value) as unknown as T;
  if (Array.isArray(value)) return value.map(withIstDates) as unknown as T;
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) out[key] = withIstDates(v);
    return out as T;
  }
  return value;
}
