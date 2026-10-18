import { NextResponse } from "next/server";
import { originOf } from "@/lib/admin/google";
import { SESSION_COOKIE } from "@/lib/otp";

/** POST only, so link prefetching never signs the member out. */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/", originOf(req)), 303);
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
