import "server-only";
import { cookies } from "next/headers";
import snapshot from "@/data/mapa-snapshot.json";
import { ADMIN_COOKIE, readAdminToken } from "./admin/session";
import { env } from "./env";
import type { LayerEntry, Mapa, Viewer } from "./mapa-types";
import { loadPanel } from "./panel";
import { currentPhone } from "./session";
import layersManifest from "../../public/data/layers.json";

/**
 * Fallback river positions (CONTRACT.md) for rivers the payload sends without coordinates,
 * which happens when a river has no detection yet.
 */
const RIVER_FALLBACK: Record<string, [number, number]> = {
  yaguas: [-2.65, -71.35],
  malinowski: [-12.95, -69.95],
  nanay: [-3.75, -73.45],
  "madre-de-dios": [-12.6, -69.2],
  tambopata: [-12.85, -69.35],
  inambari: [-13.05, -70.1],
  napo: [-3.3, -72.8],
  putumayo: [-2.4, -72.8],
  "marañon": [-4.5, -77.5],
};

export type MapaSource = "live" | "snapshot";

function isMapa(value: unknown): value is Mapa {
  const v = value as Mapa | null;
  return Boolean(v && v.totals && Array.isArray(v.rivers) && Array.isArray(v.detections?.features) && Array.isArray(v.timeline));
}

function withRiverPositions(mapa: Mapa): Mapa {
  const rivers = mapa.rivers.map((r) => {
    if (Number.isFinite(r.lat) && Number.isFinite(r.lon)) return r;
    const [lat, lon] = RIVER_FALLBACK[r.slug] ?? [-9.2, -74.5];
    return { ...r, lat, lon };
  });
  return { ...mapa, rivers, activity: mapa.activity ?? [], images: mapa.images ?? [] };
}

/**
 * The public map payload. Live from the Django API (cached 60 s by Next), or the snapshot bundled at
 * build time when the API is down, slow or does not serve /api/v1/mapa yet (404). The page never fails.
 *
 * src/data/mapa-snapshot.json is exported from production by the backend (`manage.py export_mapa`).
 */
export async function loadMapa(): Promise<{ mapa: Mapa; source: MapaSource }> {
  try {
    const res = await fetch(`${env.apiUrl}/api/v1/mapa`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(6_000),
    });
    if (res.ok) {
      const data: unknown = await res.json();
      if (isMapa(data)) return { mapa: withRiverPositions(data), source: "live" };
    }
  } catch {
    // Network error or timeout: fall through to the snapshot.
  }
  return { mapa: withRiverPositions(snapshot as unknown as Mapa), source: "snapshot" };
}

/** Static open data layers, bundled from public/data/layers.json (an empty list hides the Capas tab). */
export const layers: LayerEntry[] = Array.isArray(layersManifest) ? (layersManifest as LayerEntry[]) : [];

/**
 * Member and admin state for the top bar and the "Mis detecciones" filter. Reads both cookies and,
 * for a signed in member, the panel route; any failure just means fewer personal touches.
 */
export async function loadViewer(): Promise<{ viewer: Viewer; welcome: { ong: string; name: string } | null }> {
  const [phone, jar] = await Promise.all([currentPhone(), cookies()]);
  const admin = Boolean(readAdminToken(jar.get(ADMIN_COOKIE)?.value));
  if (!phone) return { viewer: { signedIn: false, admin, label: null, mine: null }, welcome: null };

  const panel = await loadPanel(phone).catch(() => null);
  if (!panel?.ok) return { viewer: { signedIn: true, admin, label: null, mine: null }, welcome: null };

  const { member, ong } = panel.data;
  const first = member.name.trim().split(/\s+/)[0] || "";
  return {
    viewer: {
      signedIn: true,
      admin,
      label: first || ong.name || null,
      mine: { ong: ong.name, rivers: ong.rivers.map((r) => r.slug) },
    },
    welcome: { ong: ong.name, name: member.name },
  };
}
