import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "../db";
import { ADMIN_COOKIE, readAdminToken } from "./session";

export type CurrentAdmin = { email: string; name: string; picture: string };

/**
 * The admin behind this request, or null. Needs a signed session cookie AND an active Admin row
 * for that email, checked every time, so deactivating a row locks the person out at once.
 */
export async function currentAdmin(): Promise<CurrentAdmin | null> {
  const session = readAdminToken((await cookies()).get(ADMIN_COOKIE)?.value);
  if (!session) return null;

  const row = await db.admin.findUnique({ where: { email: session.email }, select: { name: true, active: true } });
  if (!row?.active) return null;

  return { email: session.email, name: row.name ?? session.name, picture: session.picture };
}

/** Call at the top of every admin page and server action. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await currentAdmin();
  if (!admin) redirect("/admin/entrar");
  return admin;
}
