import type { Metadata } from "next";
import { ExpedienteApp } from "@/components/expediente/ExpedienteApp";
import { currentPhone } from "@/lib/session";

export const dynamic = "force-dynamic";

// The token in the URL opens the expediente, so it must not leak to other sites or search engines.
export const metadata: Metadata = {
  title: "Expediente · Condorin",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * Opened from the WhatsApp alert button or from the panel. Nothing is fetched here on purpose:
 * link preview bots load this page too, and they must not open the expediente or sign anyone in.
 * The browser does both (see ExpedienteApp).
 */
export default async function ExpedientePage({ params }: { params: Promise<{ token: string }> }) {
  const [{ token }, phone] = await Promise.all([params, currentPhone()]);
  return <ExpedienteApp token={token} signedIn={Boolean(phone)} />;
}
