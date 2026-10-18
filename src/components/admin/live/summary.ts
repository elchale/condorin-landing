import type { ActivityEvent, ActivityStep } from "@/lib/admin/activity";

const TIME = new Intl.DateTimeFormat("es-PE", { timeStyle: "medium", timeZone: "America/Lima" });

/** 15:42:07 in Lima, the same on server and browser. */
export const formatTime = (iso: string) => TIME.format(new Date(iso));

export const pct = (x: number) => `${Math.round(x * 100)}%`;

/** The routing outcome in a few words, with the color it is drawn in. */
export function decisionSummary(event: ActivityEvent): { text: string; tone: "marca" | "naranja" | "gris" } {
  if (event.decision === "alerted") {
    const n = event.ongs.length;
    return { text: n === 1 ? "Alerta a 1 ONG" : `Alerta a ${n} ONG`, tone: "marca" };
  }
  if (event.decision === "no_watchers") return { text: "Ninguna ONG vigila el río", tone: "naranja" };
  return { text: "Bajo el umbral", tone: "gris" };
}

/** The last step that happened (done or failed). */
export function furthestStep(event: ActivityEvent): ActivityStep | undefined {
  return event.steps.findLast((s) => s.state === "done" || s.state === "failed");
}

/** Changes whenever any step moves, so the feed can tell which events advanced. */
export const signature = (event: ActivityEvent) => event.steps.map((s) => `${s.key}:${s.state}:${s.detail}`).join("|");

export const detectionCount = (n: number) => (n === 1 ? "1 detección" : `${n} detecciones`);
