import type { ActivityEvent, ActivityStep, StepKey, StepState } from "@/lib/admin/activity";
import type { IconName } from "@/components/ui/Icon";

/** Confidence and threshold arrive as 0..1; tolerate 0..100 too. */
export function pct(v: number): number {
  return Math.round(v <= 1 ? v * 100 : v);
}

const clockFmt = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Lima",
});

const dateFmt = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Lima",
});

export function clock(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : clockFmt.format(d);
}

export function shortDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : dateFmt.format(d);
}

export const STEP_ICON: Record<StepKey, IconName> = {
  received: "inbox",
  detections: "scan",
  evidence: "lock",
  routing: "route",
  alerts: "message",
  opened: "pointer",
  expediente: "file",
  filed: "landmark",
};

export const STATE_WORD: Record<StepState, string> = {
  done: "Hecho",
  skipped: "Omitido",
  pending: "En espera",
  failed: "Falló",
};

export const STATE_TEXT: Record<StepState, string> = {
  done: "text-exito",
  skipped: "text-gris",
  pending: "text-naranja",
  failed: "text-marca",
};

export const STATE_NODE: Record<StepState, string> = {
  done: "bg-exito text-white",
  skipped: "bg-fondo text-zinc-400 border border-dashed border-zinc-300",
  pending: "bg-naranja-claro text-naranja ring-2 ring-naranja df-pulse",
  failed: "bg-marca text-white",
};

export const STATE_FILL: Record<StepState, string> = {
  done: "bg-exito",
  skipped: "bg-zinc-300",
  pending: "bg-naranja",
  failed: "bg-marca",
};

const AUTHORITY_NAME: Record<string, string> = {
  FEMA: "Fiscalía FEMA",
  OEFA: "OEFA",
  SERNANP: "SERNANP",
};

export function authorityName(a: string): string {
  return AUTHORITY_NAME[a.toUpperCase()] ?? a;
}

/** How long each step stays on screen before the next one, in ms. Visual steps get a little more. */
export function stepDuration(step: ActivityStep, event: ActivityEvent): number {
  if (step.state === "skipped") return 620;
  switch (step.key) {
    case "detections":
      return 900 + Math.min(event.detections.length, 5) * 120;
    case "routing":
      return 750 + Math.min(event.ongs.length, 4) * 200;
    case "alerts": {
      const n = event.ongs.reduce((s, o) => s + o.alerts.length, 0);
      return 700 + Math.min(n, 8) * 140;
    }
    case "expediente":
    case "filed":
      return 900;
    default:
      return 700;
  }
}

/** Final outcome in one line, for the scene footer. */
export function outcome(event: ActivityEvent): { text: string; tone: "ok" | "wait" | "off" | "bad" } {
  const step = (k: StepKey) => event.steps.find((s) => s.key === k);
  if (event.decision === "below_threshold") return { text: "Descartada, ninguna detección supera el umbral", tone: "off" };
  if (event.decision === "no_watchers") return { text: "Sin ONG que vigile este río", tone: "off" };
  const filed = step("filed");
  if (filed?.state === "done") {
    const names = event.ongs.flatMap((o) => o.expediente?.filings.map((f) => authorityName(f.authority)) ?? []);
    const unique = [...new Set(names)];
    return { text: unique.length ? `Denuncia presentada ante ${unique.join(" y ")}` : "Denuncia presentada", tone: "ok" };
  }
  const exp = step("expediente");
  if (exp?.state === "done") return { text: "Expediente listo, falta presentarlo", tone: "wait" };
  if (step("alerts")?.state === "failed") return { text: "Las alertas no llegaron", tone: "bad" };
  if (step("opened")?.state === "done") return { text: "Expediente abierto, esperando confirmación", tone: "wait" };
  return { text: "Alerta enviada, esperando que abran un expediente", tone: "wait" };
}
