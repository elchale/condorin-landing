import "server-only";
import { db } from "./db";

/** Creates the member on first sign-in, or refreshes consent and sign-in time on later ones. */
export async function recordSignIn(phone: string) {
  const now = new Date();
  await db.member.upsert({
    where: { phone },
    create: { phone, consentAt: now, lastSignInAt: now },
    update: { consentAt: now, lastSignInAt: now },
  });
}
