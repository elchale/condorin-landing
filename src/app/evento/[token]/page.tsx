import type { Metadata } from "next";
import { EventoApp } from "@/components/evento/EventoApp";
import { currentPhone } from "@/lib/session";

export const dynamic = "force-dynamic";

// Same rules as the expediente page: the token opens it, so it must not leak or be indexed.
export const metadata: Metadata = {
  title: "Evento · Ojo de Cóndor",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/** Opened from the "Ver evento" button of the WhatsApp alert, or from the panel. Fetches in the browser only. */
export default async function EventoPage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, phone] = await Promise.all([params, currentPhone()]);
  return <EventoApp token={token} signedIn={Boolean(phone)} />;
}
