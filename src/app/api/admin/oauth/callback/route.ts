import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { exchangeCode, originOf } from "@/lib/admin/google";
import { ADMIN_COOKIE, ADMIN_TTL_SECONDS, OAUTH_COOKIE, adminToken, safeEqual, unseal } from "@/lib/admin/session";
import { cookieOptions } from "@/lib/http";

export const dynamic = "force-dynamic";

type OAuthCookie = { state: string; nonce: string; verifier: string; origin: string };

/** Back to the sign-in page with a short reason that never reveals whether the email is an admin. */
function backToLogin(req: NextRequest, reason: string) {
  const url = new URL("/admin/entrar", originOf(req));
  url.searchParams.set("error", reason);
  const res = NextResponse.redirect(url);
  res.cookies.delete(OAUTH_COOKIE);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}

/**
 * Google's redirect back. The only place an admin session is issued: state and nonce must match
 * this browser's attempt, the code is exchanged server side with PKCE, and the verified email
 * must have an active row in the Admin table. A Google account alone grants nothing.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (params.get("error")) return backToLogin(req, "cancelado");

  const saved = unseal<OAuthCookie>(req.cookies.get(OAUTH_COOKIE)?.value);
  const state = params.get("state") ?? "";
  const code = params.get("code") ?? "";
  if (!saved || !state || !code || !safeEqual(state, saved.state)) return backToLogin(req, "estado");

  let identity;
  try {
    identity = await exchangeCode({ code, origin: saved.origin, verifier: saved.verifier });
  } catch (error) {
    console.error("[admin] Google exchange failed:", error);
    return backToLogin(req, "google");
  }
  if (!safeEqual(identity.nonce, saved.nonce)) return backToLogin(req, "estado");

  const row = await db.admin.findUnique({ where: { email: identity.email }, select: { active: true, name: true } });
  if (!row?.active) return backToLogin(req, "permiso");

  const res = NextResponse.redirect(new URL("/admin", saved.origin));
  res.cookies.delete(OAUTH_COOKIE);
  res.cookies.set(
    ADMIN_COOKIE,
    adminToken({ email: identity.email, name: row.name ?? identity.name, picture: identity.picture }),
    cookieOptions(ADMIN_TTL_SECONDS),
  );
  return res;
}
