// Formatting for the map. Every date is shown in Lima time with an explicit zone, so the server
// render and the browser hydration produce the same text.

const TZ = "America/Lima";

const longFmt = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
const shortFmt = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "numeric", month: "short" });
const stampFmt = new Intl.DateTimeFormat("es-PE", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
const monthFmt = new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", month: "short", year: "numeric" });
const numFmt = new Intl.NumberFormat("es-PE");

const valid = (iso: string | null | undefined) => Boolean(iso) && !Number.isNaN(Date.parse(iso as string));
const clean = (s: string) => s.replace(/\./g, "");

/** "17 de octubre de 2026" */
export const longDate = (iso: string | null | undefined) => (valid(iso) ? longFmt.format(new Date(iso as string)) : "sin fecha");
/** "17 oct" */
export const shortDate = (iso: string | null | undefined) => (valid(iso) ? clean(shortFmt.format(new Date(iso as string))) : "sin fecha");
/** "17 oct, 09:00" */
export const stamp = (iso: string | null | undefined) => (valid(iso) ? clean(stampFmt.format(new Date(iso as string))) : "");
/** "2026-10" to "oct 2026" */
export const monthLabel = (month: string) => clean(monthFmt.format(new Date(`${month}-15T00:00:00Z`)));
/** UTC month key of an ISO timestamp, matching the payload timeline. */
export const monthKey = (iso: string) => iso.slice(0, 7);
export const pct = (x: number) => `${Math.round(x * 100)}%`;
export const num = (n: number) => numFmt.format(n);
export const kb = (bytes: number) => (bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1000))} KB`);
export const mapsUrl = (lat: number, lon: number) => `https://www.google.com/maps/search/?api=1&query=${lat.toFixed(5)},${lon.toFixed(5)}`;
