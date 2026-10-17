import "server-only";
import { db } from "./db";

/**
 * Creates the member on first sign-in, or refreshes consent and sign-in time on later ones.
 * Returns true only when this sign-in created the member.
 */
export async function recordSignIn(phone: string): Promise<boolean> {
  const now = new Date();
  const existing = await db.member.findUnique({ where: { phone }, select: { id: true } });
  if (existing) {
    await db.member.update({ where: { phone }, data: { consentAt: now, lastSignInAt: now } });
    return false;
  }
  // upsert, not create: two verifies racing for the same new number must not fail the second one.
  await db.member.upsert({
    where: { phone },
    create: { phone, consentAt: now, lastSignInAt: now },
    update: { consentAt: now, lastSignInAt: now },
  });
  return true;
}
