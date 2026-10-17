import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { authorizeUrl, originOf } from "@/lib/admin/google";
import { OAUTH_COOKIE, OAUTH_TTL_SECONDS, seal } from "@/lib/admin/session";
import { cookieOptions } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Sends the browser to Google. A short-lived signed cookie carries the one-use values the
 * callback checks: `state` (this tab started the flow), `nonce` (binds the id_token to this
 * attempt), the PKCE verifier, and the origin, since the redirect URI must match byte for byte.
 */
export async function GET(req: Request) {
  const origin = originOf(req);
  const state = randomBytes(24).toString("base64url");
  const nonce = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");

  const res = NextResponse.redirect(authorizeUrl({ origin, state, nonce, verifier }));
  res.cookies.set(OAUTH_COOKIE, seal({ state, nonce, verifier, origin }), cookieOptions(OAUTH_TTL_SECONDS));
  return res;
}
