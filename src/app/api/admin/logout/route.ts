import { NextResponse } from "next/server";
import { originOf } from "@/lib/admin/google";
import { ADMIN_COOKIE } from "@/lib/admin/session";

/** POST only, so link prefetching never signs the admin out. */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/admin/entrar", originOf(req)), 303);
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
