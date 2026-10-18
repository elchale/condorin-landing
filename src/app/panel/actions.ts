"use server";

import { redirect } from "next/navigation";
import { expedienteToken } from "@/lib/panel";
import { requirePhone } from "@/lib/session";

/** "Crear expediente" and "Continuar" on an incident card: open that incident's expediente page. */
export async function openExpediente(formData: FormData) {
  const phone = await requirePhone();
  const id = Number(formData.get("incident"));
  if (!Number.isInteger(id) || id <= 0) redirect("/panel");
  const result = await expedienteToken(phone, id);
  if (!result.ok) redirect("/panel?error=expediente");
  redirect(`/expediente/${result.data.token}`);
}
