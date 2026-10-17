import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "crypto";
import { env } from "./env";

const CODE_TTL_MS = 10 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const PENDING_COOKIE = "cdn_otp";
export const SESSION_COOKIE = "cdn_session";
export const CODE_TTL_SECONDS = CODE_TTL_MS / 1000;
export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

function sign(value: string) {
  return createHmac("sha256", env.otpSecret).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Tokens look like `<phone>.<expiresAtMs>.<hmac>`; `purpose` keeps OTP and session MACs apart. */
function issue(purpose: string, phone: string, ttlMs: number, extra = "") {
  const exp = Date.now() + ttlMs;
  return `${phone}.${exp}.${sign(`${purpose}|${phone}|${exp}|${extra}`)}`;
}

function verify(purpose: string, token: string | undefined, extra = ""): string | null {
  const [phone, exp, mac] = token?.split(".") ?? [];
  if (!phone || !exp || !mac || Date.now() > Number(exp)) return null;
  return safeEqual(mac, sign(`${purpose}|${phone}|${exp}|${extra}`)) ? phone : null;
}

export function newCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** The code never leaves the server: the cookie carries only its HMAC. */
export const pendingToken = (phone: string, code: string) => issue("otp", phone, CODE_TTL_MS, code);
export const checkPending = (token: string | undefined, code: string) => verify("otp", token, code);

export const sessionToken = (phone: string) => issue("session", phone, SESSION_TTL_MS);
export const readSession = (token: string | undefined) => verify("session", token);
