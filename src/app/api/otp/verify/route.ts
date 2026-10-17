import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { cookieOptions, fail } from "@/lib/http";
import { PENDING_COOKIE, SESSION_COOKIE, SESSION_TTL_SECONDS, checkPending, sessionToken } from "@/lib/otp";
import { MAX_CODE_ATTEMPTS, countAttempt } from "@/lib/rate-limit";
import { recordSignIn } from "@/lib/members";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const token = (await cookies()).get(PENDING_COOKIE)?.value;
  if (!token) return fail("El código venció. Pide uno nuevo.", 400);
  if (countAttempt(token) > MAX_CODE_ATTEMPTS) return fail("Demasiados intentos. Pide un código nuevo.", 429);

  const phone = checkPending(token, String(body.code ?? "").replace(/\D/g, ""));
  if (!phone) return fail("Ese código no coincide. Revisa el mensaje de WhatsApp.", 400);

  await recordSignIn(phone);
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PENDING_COOKIE);
  res.cookies.set(SESSION_COOKIE, sessionToken(phone), cookieOptions(SESSION_TTL_SECONDS));
  return res;
}
