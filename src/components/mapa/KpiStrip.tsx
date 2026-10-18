import type { Mapa } from "@/lib/mapa-types";
import { num, stamp } from "./format";

type Props = { totals: Mapa["totals"]; generatedAt: string; live: boolean };

/** Four headline numbers over the map plus the freshness pill. Server rendered, so it paints before any JS. */
export function KpiStrip({ totals, generatedAt, live }: Props) {
  const tiles = [
    { label: "Detecciones", value: totals.detections, tone: "text-white" },
    { label: "Dragas con alerta", value: totals.alerting_detections, tone: "text-(--c-red)" },
    { label: "Expedientes", value: totals.expedientes, tone: "text-(--c-green)" },
    { label: "Ríos vigilados", value: totals.rivers, tone: "text-(--c-cyan)" },
  ];
  return (
    <div className="pointer-events-none flex flex-col items-start gap-2">
      <dl className="pointer-events-auto grid w-full grid-cols-4 overflow-hidden rounded-lg border border-(--c-line) bg-(--c-panel)/95 lg:max-w-xl">
        {tiles.map((t, i) => (
          <div key={t.label} className={`min-w-0 px-2 py-2 sm:px-3 ${i ? "border-l border-(--c-line)" : ""}`}>
            <dt className="odc-label min-h-[2lh] !text-[9.5px] !leading-tight !tracking-[0.06em] sm:min-h-0 sm:truncate sm:!text-[10.5px] sm:!tracking-[0.12em]">{t.label}</dt>
            <dd className={`mt-0.5 text-xl font-bold leading-none sm:text-2xl ${t.tone}`}>{num(t.value)}</dd>
          </div>
        ))}
      </dl>
      <p className="pointer-events-auto flex items-center gap-2 rounded-full border border-(--c-line) bg-(--c-bg)/90 px-2.5 py-1 text-[11px] text-(--c-muted)">
        {live ? (
          <>
            <span className="odc-live-dot size-2 rounded-full bg-(--c-cyan)" aria-hidden />
            <span className="font-bold tracking-widest text-(--c-cyan)">EN VIVO</span>
          </>
        ) : (
          <>
            <span className="size-2 rounded-full bg-(--c-amber)" aria-hidden />
            <span className="font-bold tracking-widest text-(--c-amber)">RESPALDO</span>
          </>
        )}
        <span>
          <span className="sr-only">Datos generados el </span>
          {stamp(generatedAt)}
        </span>
      </p>
    </div>
  );
}
