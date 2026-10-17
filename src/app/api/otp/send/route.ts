import { NextResponse } from "next/server";
import { cookieOptions, fail } from "@/lib/http";
import { CODE_TTL_SECONDS, PENDING_COOKIE, newCode, pendingToken } from "@/lib/otp";
import { normalizePhone } from "@/lib/phone";
import { allowSend } from "@/lib/rate-limit";
import { sendCode } from "@/lib/whatsapp";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.consent !== true) {
    return fail("Acepta los términos y la política de privacidad para continuar.", 400);
  }

  const phone = normalizePhone(String(body.phone ?? ""));
  if (!phone) return fail("Escribe un número de celular válido, por ejemplo 987 654 321.", 400);
  if (!allowSend(phone)) return fail("Ya te enviamos un código. Espera un minuto para pedir otro.", 429);

  const code = newCode();
  try {
    await sendCode(phone, code);
  } catch {
    return fail("No pudimos enviar el código a ese número. Revisa que tenga WhatsApp e inténtalo otra vez.", 502);
  }

  const res = NextResponse.json({ phone });
  res.cookies.set(PENDING_COOKIE, pendingToken(phone, code), cookieOptions(CODE_TTL_SECONDS));
  return res;
}
