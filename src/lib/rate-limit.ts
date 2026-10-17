import "server-only";

// In-memory and per instance: enough to stop accidental resends and code guessing on a
// single server. Move to a shared store (e.g. Redis) before running several instances.
const lastSend = new Map<string, number>();
const attempts = new Map<string, number>();

const RESEND_COOLDOWN_MS = 45_000;
export const MAX_CODE_ATTEMPTS = 5;

export function allowSend(phone: string) {
  const prev = lastSend.get(phone) ?? 0;
  if (Date.now() - prev < RESEND_COOLDOWN_MS) return false;
  lastSend.set(phone, Date.now());
  return true;
}

/** Counts a verification attempt for this pending token and returns the running total. */
export function countAttempt(token: string) {
  const n = (attempts.get(token) ?? 0) + 1;
  attempts.set(token, n);
  return n;
}
