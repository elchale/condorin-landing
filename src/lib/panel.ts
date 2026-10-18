import "server-only";
import { headers } from "next/headers";
import { callApi } from "./api";

export type ExpedienteStatus = "draft" | "ready" | "filed";

export type Incident = {
  id: number;
  river: { slug: string; name: string; protected_area: string };
  place: string;
  satellite: string;
  captured_at: string;
  captured_at_label: string;
  model: string;
  detections: number;
  top_confidence: number;
  lat: string;
  lon: string;
  utm: string;
  maps_url: string;
  /** Signed links to the crops of the strongest detections; empty while the bucket is not readable. */
  crops: string[];
  evidence_pinned: boolean;
  expediente: null | {
    status: ExpedienteStatus;
    status_label: string;
    folio: string | null;
    updated_at: string;
    updated_by: string | null;
    missing: number;
    authorities: string[];
    filings: number;
  };
};

export type Panel = {
  member: { name: string; phone: string; joined_now: boolean };
  ong: { name: string; rivers: { slug: string; name: string; protected_area: string }[]; members: number };
  totals: { incidents: number; without_expediente: number; draft: number; ready: number; filed: number };
  incidents: Incident[];
};

const forwardedFor = async () => (await headers()).get("x-forwarded-for");

/** What the member sees on /panel. The API adds them to the demo ONG on their first visit. */
export async function loadPanel(phone: string) {
  return callApi<Panel>("/api/v1/panel", { phone, forwardedFor: await forwardedFor() });
}

/** The member's personal expediente token for one incident (created if they had no alert for it). */
export async function expedienteToken(phone: string, incidentId: number) {
  return callApi<{ token: string }>(`/api/v1/panel/incidentes/${incidentId}/expediente`, {
    method: "POST",
    phone,
    forwardedFor: await forwardedFor(),
  });
}
