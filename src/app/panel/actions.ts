"use server";

import { redirect } from "next/navigation";
import { expedienteToken } from "@/lib/panel";
import { requirePhone } from "@/lib/session";

/**
 * The buttons on an incident card. Both pages work with the member's personal token for that incident:
 * "Ver evento" opens /evento/<token>, every other button opens /expediente/<token>.
 */
export async function openIncident(formData: FormData) {
  const phone = await requirePhone();
  const id = Number(formData.get("incident"));
  if (!Number.isInteger(id) || id <= 0) redirect("/panel");
  const result = await expedienteToken(phone, id);
  if (!result.ok) redirect("/panel?error=expediente");
  redirect(`/${formData.get("to") === "evento" ? "evento" : "expediente"}/${result.data.token}`);
}
