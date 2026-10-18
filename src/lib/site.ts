/** Display name of the product. Technical ids (repos, cookies, domains) keep "condorin". */
export const BRAND_NAME = "Ojo de Cóndor";

/**
 * Absolute base URL of the site. Link previews (WhatsApp, social networks) need absolute image
 * URLs, so this must never fall back to localhost in a deployment.
 * Order: explicit setting → Vercel production domain → Vercel deployment URL → local dev.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
