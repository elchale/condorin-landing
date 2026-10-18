// The four tab bodies of the console. Plain components: rendered on the server with the console,
// then hydrated, so the lists are HTML before any script runs.

import type { DetectionFeature, LayerEntry, Mapa, MapaRiver } from "@/lib/mapa-types";
import { kb, num, pct, shortDate, stamp } from "./format";

const MAX_ROWS = 150;

export function DetectionList({
  features,
  rivers,
  mine,
  selectedId,
  onPick,
}: {
  features: DetectionFeature[];
  rivers: Map<string, MapaRiver>;
  mine: Set<string>;
  selectedId: number | null;
  onPick: (id: number) => void;
}) {
  if (!features.length) {
    return <p className="px-4 py-6 text-sm text-(--c-muted)">No hay detecciones con estos filtros.</p>;
  }
  return (
    <>
      <ul className="divide-y divide-(--c-line)">
        {features.slice(0, MAX_ROWS).map((f) => {
          const p = f.properties;
          const selected = p.id === selectedId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                aria-pressed={selected}
                className={`grid min-h-14 w-full grid-cols-[4px_1fr_auto] items-center gap-3 px-4 py-2.5 text-left hover:bg-(--c-panel-2) ${
                  selected ? "bg-(--c-panel-2)" : ""
                }`}
              >
                <span className={`h-9 rounded-full ${p.alerting ? "bg-(--c-red)" : "bg-slate-600"}`} aria-hidden />
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`truncate font-semibold ${selected ? "text-(--c-cyan)" : "text-white"}`}>
                      Río {rivers.get(p.river)?.name ?? p.river}
                    </span>
                    {mine.has(p.river) && <span className="shrink-0 rounded bg-(--c-cyan)/15 px-1.5 text-[10px] font-bold text-(--c-cyan)">TU ONG</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-(--c-muted)">
                    {shortDate(p.captured_at)} · {p.satellite} · {p.alerting ? "alerta enviada" : "bajo el umbral"}
                  </span>
                </span>
                <span className="w-16 text-right">
                  <span className={`text-sm font-bold ${p.alerting ? "text-white" : "text-(--c-muted)"}`}>{pct(p.confidence)}</span>
                  <span className="mt-1 block h-1 overflow-hidden rounded bg-(--c-line)" aria-hidden>
                    <span className={`block h-full ${p.alerting ? "bg-(--c-red)" : "bg-slate-500"}`} style={{ width: pct(p.confidence) }} />
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {features.length > MAX_ROWS && (
        <p className="px-4 py-3 text-xs text-(--c-muted)">Mostramos las {MAX_ROWS} más recientes de {num(features.length)}. Todas están en el mapa.</p>
      )}
    </>
  );
}

export function RiverList({ rivers, mine, onPick }: { rivers: MapaRiver[]; mine: Set<string>; onPick: (slug: string) => void }) {
  const sorted = [...rivers].sort((a, b) => Number(mine.has(b.slug)) - Number(mine.has(a.slug)) || b.detections - a.detections);
  return (
    <ul className="space-y-2 p-3">
      {sorted.map((r) => (
        <li key={r.slug}>
          <button
            type="button"
            onClick={() => onPick(r.slug)}
            className={`w-full rounded-lg border p-3 text-left hover:bg-(--c-panel-2) ${mine.has(r.slug) ? "border-(--c-cyan)/60" : "border-(--c-line)"}`}
          >
            <span className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-white">Río {r.name}</span>
                <span className="block truncate text-xs text-(--c-muted)">{[r.region, r.province].filter(Boolean).join(", ")}</span>
              </span>
              {mine.has(r.slug) && <span className="shrink-0 rounded bg-(--c-cyan)/15 px-1.5 py-0.5 text-[10px] font-bold text-(--c-cyan)">TU ONG</span>}
            </span>
            {r.protected_area && (
              <span className="mt-2 inline-block max-w-full truncate rounded border border-(--c-green)/40 px-1.5 py-0.5 text-[11px] text-(--c-green)">
                {r.protected_area}
              </span>
            )}
            <span className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <span>
                <span className="odc-label block">ONG</span>
                <span className="font-bold text-white">{num(r.ongs)}</span>
              </span>
              <span>
                <span className="odc-label block">Detecciones</span>
                <span className="font-bold text-white">{num(r.detections)}</span>
              </span>
              <span>
                <span className="odc-label block">Última</span>
                <span className="font-bold text-white">{r.last_captured_at ? shortDate(r.last_captured_at) : "ninguna"}</span>
              </span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function LayerList({ layers, enabled, onToggle }: { layers: LayerEntry[]; enabled: Set<string>; onToggle: (id: string) => void }) {
  return (
    <ul className="divide-y divide-(--c-line)">
      {layers.map((l) => {
        const on = enabled.has(l.id);
        return (
          <li key={l.id}>
            <label className="flex min-h-14 cursor-pointer items-start gap-3 px-4 py-3 hover:bg-(--c-panel-2)">
              <input type="checkbox" checked={on} onChange={() => onToggle(l.id)} className="peer sr-only" />
              <span
                aria-hidden
                className={`mt-0.5 flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-(--c-cyan) ${on ? "" : "bg-slate-700"}`}
                style={on ? { background: l.color } : undefined}
              >
                <span className={`size-5 rounded-full bg-white transition-transform ${on ? "translate-x-4" : ""}`} />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-white">{l.title}</span>
                <span className="block text-xs text-(--c-muted)">
                  {num(l.features)} elementos · {kb(l.bytes_gzip)} · {l.year}
                </span>
                <span className="block text-xs text-(--c-muted)">
                  Fuente:{" "}
                  <a href={l.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-white">
                    {l.source}
                  </a>{" "}
                  ({l.license})
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

const ACTIVITY_DOT: Record<string, string> = {
  image: "bg-(--c-cyan)",
  alert: "bg-(--c-red)",
  expediente_opened: "bg-(--c-amber)",
  expediente_filed: "bg-(--c-green)",
};

export function ActivityList({ activity }: { activity: Mapa["activity"] }) {
  if (!activity.length) return <p className="px-4 py-6 text-sm text-(--c-muted)">Todavía no hay actividad.</p>;
  const sorted = [...activity].sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return (
    <ol className="relative mx-4 my-3 border-l border-(--c-line)">
      {sorted.map((a, i) => (
        <li key={`${a.at}-${i}`} className="relative py-2.5 pl-5">
          <span className={`absolute -left-[5px] top-4 size-2.5 rounded-full ${ACTIVITY_DOT[a.kind] ?? "bg-slate-500"}`} aria-hidden />
          <p className="text-sm text-(--c-text)">{a.label}</p>
          <p className="text-xs text-(--c-muted)">{stamp(a.at)}</p>
        </li>
      ))}
    </ol>
  );
}
