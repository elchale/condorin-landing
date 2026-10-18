import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { callApi } from "@/lib/api";
import { cookieOptions, sameOrigin } from "@/lib/http";
import { LINK_SESSION_TTL_SECONDS, SESSION_COOKIE, readSession, sessionToken } from "@/lib/otp";

/**
 * Signs in whoever opens a WhatsApp alert link, as the member it was sent to.
 *
 * Why this is safe enough to skip the code: the token is 192 random bits, unique per member and
 * alert, and only reached that member's WhatsApp chat. The API accepts it for sign in only if
 * WhatsApp actually delivered it and for 7 days after that, and this session also lasts 7 days.
 * It is a POST the page makes from the browser, so link preview bots (which do not run JS) never
 * sign in. An existing session is never replaced, so a forwarded link cannot switch your account.
 * Confirming a denuncia still needs a fresh code sent to the member's phone.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ signedIn: false }, { status: 403 });
  if (readSession((await cookies()).get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ signedIn: true });
  }

  const body = await req.json().catch(() => ({}));
  const token = String(body.token ?? "");
  if (!/^[\w-]{16,64}$/.test(token)) return NextResponse.json({ signedIn: false });

  const result = await callApi<{ phone: string }>("/api/v1/panel/enlace", {
    method: "POST",
    body: { token },
    forwardedFor: req.headers.get("x-forwarded-for"),
  });
  if (!result.ok) return NextResponse.json({ signedIn: false });

  const res = NextResponse.json({ signedIn: true });
  res.cookies.set(SESSION_COOKIE, sessionToken(result.data.phone, LINK_SESSION_TTL_SECONDS), cookieOptions(LINK_SESSION_TTL_SECONDS));
  return res;
}
