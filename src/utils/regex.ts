/** Escapes regex metacharacters so user-supplied search text is matched literally, not as a pattern. */
export function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
