import "server-only";
import { createHash } from "crypto";
import { env } from "../env";

// Google OAuth 2.0 authorization code flow with PKCE, by hand: two requests, no dependency.
// The client is the shared Qolca Solutions one (also used by futurx.pe), so every redirect URI
// built here must be registered on that client in the Google Cloud console.

const AUTHORIZE_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export const CALLBACK_PATH = "/api/admin/oauth/callback";

/**
 * Origins allowed to start sign-in. The Host header is caller-controlled, so the redirect URI is
 * only ever built from this list. Vercel preview URLs are not on it, so /admin only works on the
 * real domains and localhost.
 */
function allowedOrigins() {
  const list = ["https://www.condorin.pe", "https://condorin.pe", "http://localhost:3000"];
  if (process.env.NEXT_PUBLIC_SITE_URL) list.unshift(new URL(process.env.NEXT_PUBLIC_SITE_URL).origin);
  return [...new Set(list)];
}

export function originOf(req: Request) {
  const allowed = allowedOrigins();
  const current = new URL(req.url).origin;
  return allowed.includes(current) ? current : allowed[0];
}

export function authorizeUrl(p: { origin: string; state: string; nonce: string; verifier: string }) {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: p.origin + CALLBACK_PATH,
    response_type: "code",
    scope: "openid email profile",
    state: p.state,
    nonce: p.nonce,
    code_challenge: createHash("sha256").update(p.verifier).digest("base64url"),
    code_challenge_method: "S256",
    // Always ask which account, so nobody lands in the panel with the wrong one unnoticed.
    prompt: "select_account",
  }).toString();
  return url.toString();
}

export type GoogleIdentity = { email: string; name: string; picture: string; nonce: string };

type IdTokenClaims = {
  iss?: string;
  aud?: string;
  exp?: number;
  nonce?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

/**
 * Exchanges the one-time code for the signed-in identity. The id_token signature is not checked
 * because it comes straight from Google's token endpoint over TLS, which OpenID Connect allows
 * for the code flow (Core 3.1.3.7, step 6). Issuer, audience, expiry and email still are.
 */
export async function exchangeCode(p: { code: string; origin: string; verifier: string }): Promise<GoogleIdentity> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: p.code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: p.origin + CALLBACK_PATH,
      grant_type: "authorization_code",
      code_verifier: p.verifier,
    }).toString(),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Google token exchange failed (${res.status}): ${await res.text().catch(() => "")}`);

  const { id_token } = (await res.json()) as { id_token?: string };
  const payload = id_token?.split(".")[1];
  if (!payload) throw new Error("Google returned no id_token.");
  const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as IdTokenClaims;

  if (!claims.iss || !ISSUERS.has(claims.iss)) throw new Error("id_token not issued by Google.");
  if (claims.aud !== env.googleClientId) throw new Error("id_token is for another client.");
  if (!claims.exp || claims.exp * 1000 < Date.now()) throw new Error("id_token expired.");
  if (!claims.email || claims.email_verified !== true) throw new Error("Google email not verified.");

  return {
    email: claims.email.toLowerCase(),
    name: claims.name ?? "",
    picture: claims.picture ?? "",
    nonce: claims.nonce ?? "",
  };
}
