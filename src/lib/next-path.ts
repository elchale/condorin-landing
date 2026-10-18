/**
 * The `next` query param of /entrar, accepted only as a same site path ("/panel", "/evento/abc").
 * Anything else ("//evil.com", "https://...", "/\evil.com", control characters) falls back, so the
 * sign in page can never redirect off site.
 */
export function safeNextPath(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length > 512) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  // Backslashes (browsers read "/\host" as "//host") and control characters are never part of our paths.
  if (/[\u0000-\u001f\\]/.test(value)) return fallback;
  return value;
}

/** Link to the sign in page that comes back to `path` afterwards. */
export const entrarHref = (path: string) => `/entrar?next=${encodeURIComponent(safeNextPath(path, "/panel"))}`;
