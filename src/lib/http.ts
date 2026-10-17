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

