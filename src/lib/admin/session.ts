import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { env } from "../env";

export const ADMIN_COOKIE = "cdn_admin";
export const OAUTH_COOKIE = "cdn_admin_oauth";
export const ADMIN_TTL_SECONDS = 8 * 60 * 60;
export const OAUTH_TTL_SECONDS = 10 * 60;

export type AdminSession = { email: string; name: string; picture: string; exp: number };

// Signed with OTP_SECRET under its own purpose, so an admin cookie can never pass as a member one.
function sign(body: string) {
  return createHmac("sha256", env.otpSecret).update(`admin|${body}`).digest("base64url");
}

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Packs any JSON value into `<base64url body>.<hmac>`. */
export function seal(data: unknown) {
  const body = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns null on any doubt: missing, tampered or unparsable. */
export function unseal<T>(token: string | undefined): T | null {
  const [body, mac] = token?.split(".") ?? [];
  if (!body || !mac || !safeEqual(mac, sign(body))) return null;
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export const adminToken = (data: Omit<AdminSession, "exp">) =>
  seal({ ...data, exp: Date.now() + ADMIN_TTL_SECONDS * 1000 });

export function readAdminToken(token: string | undefined): AdminSession | null {
  const session = unseal<AdminSession>(token);
  if (!session || typeof session.email !== "string" || !(session.exp > Date.now())) return null;
  return session;
}
