import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { entrarHref } from "./next-path";
import { SESSION_COOKIE, readSession } from "./otp";

/** Phone of the member signed in on this request (WhatsApp code or alert link), or null. */
export async function currentPhone(): Promise<string | null> {
  return readSession((await cookies()).get(SESSION_COOKIE)?.value);
}

/** Call at the top of every member page and server action; `back` is where /entrar returns afterwards. */
export async function requirePhone(back = "/panel"): Promise<string> {
  const phone = await currentPhone();
  if (!phone) redirect(entrarHref(back));
  return phone;
}
