import "server-only";
import { NextResponse } from "next/server";

export const fail = (error: string, status: number) => NextResponse.json({ error }, { status });

/** Cookie options shared by every auth cookie. */
export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge,
  path: "/",
});


/**
 * True when a state changing request comes from a page of this site. Stops another site from
 * posting into these routes with the visitor's cookies (including signing them in as someone else).
 */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") === "same-origin";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
