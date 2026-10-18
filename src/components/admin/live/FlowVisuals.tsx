import type { CSSProperties } from "react";
import type { ActivityAlert, ActivityEvent } from "@/lib/admin/activity";
import { Icon } from "@/components/ui/Icon";
import { authorityName, pct, shortDate } from "./flowFormat";

/** `anim`: play the entrance animations now (the step was just revealed). */
type VisualProps = { event: ActivityEvent; anim: boolean };

const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export function DetectionBars({ event, threshold, anim }: VisualProps & { threshold: number }) {
  const t = pct(threshold);
  if (!event.detections.length) return null;
  return (
    <div className="mt-3 rounded-2xl bg-fondo p-3">
      <div className="relative mb-1 h-4 text-[11px] font-semibold text-tinta">
        <span
          className="absolute -translate-x-1/2 whitespace-nowrap"
          style={{ left: `clamp(2.5rem, ${t}%, calc(100% - 2.5rem))` }}
        >
          umbral {t}%
        </span>
      </div>
      <ul className="space-y-2.5">
        {event.detections.map((d, i) => {
          const c = pct(d.confidence);
          return (
            <li key={d.index} className="min-w-0">
              <div className="relative h-3.5 rounded-full bg-white ring-1 ring-borde">
                <div className="absolute inset-y-0 left-0 overflow-hidden rounded-full" style={{ width: `${c}%` }}>
                  <div
                    className={`size-full ${d.alerting ? "bg-exito" : "bg-zinc-300"} ${anim ? "df-fill-x" : ""}`}
                    style={anim ? delay(150 + i * 160) : undefined}
                  />
                </div>
                <span
                  aria-hidden
                  className="absolute -bottom-1 -top-1 w-0.5 -translate-x-1/2 rounded-full bg-tinta"
                  style={{ left: `${t}%` }}
                />
              </div>
              <div
                className={`mt-1 flex flex-wrap items-baseline justify-between gap-x-2 text-xs ${anim ? "df-rise" : ""}`}
                style={anim ? delay(700 + i * 160) : undefined}
              >
                <span className="text-gris">Detección {d.index}</span>
                <span className={`font-semibold tabular-nums ${d.alerting ? "text-exito" : "text-gris"}`}>
                  {c}% {d.alerting ? "pasa" : "descartada"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function EvidencePins({ event, anim }: VisualProps) {
  const items = [
    { key: "scene", label: "Escena", ok: event.scene.pinned },
    ...event.detections.map((d) => ({ key: `d${d.index}`, label: `Recorte ${d.index}`, ok: d.pinned })),
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((it, i) => (
        <li
          key={it.key}
          className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-semibold ring-1 ${
            it.ok ? "bg-exito-claro text-exito ring-exito/25" : "bg-fondo text-gris ring-borde"
          } ${anim ? "df-pop" : ""}`}
          style={anim ? delay(120 + i * 110) : undefined}
        >
          <Icon name={it.ok ? "lock" : "clock"} className="size-3.5" />
          {it.label}
        </li>
      ))}
    </ul>
  );
}

export function RoutingTree({ event, anim }: VisualProps) {
  if (!event.ongs.length) return null;
  const last = event.ongs.length - 1;
  return (
    <div className="mt-3">
      <div
        className={`inline-flex max-w-full items-center gap-2 rounded-xl bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-900 ring-1 ring-sky-200 ${
          anim ? "df-pop" : ""
        }`}
      >
        <Icon name="drop" className="size-4 shrink-0" />
        <span className="min-w-0 [overflow-wrap:anywhere]">{event.river.name}</span>
      </div>
      <ul className="ml-5">
        {event.ongs.map((o, i) => {
          const d = 250 + i * 260;
          return (
            <li key={o.id} className="relative pl-6 pt-2.5">
              <span
                aria-hidden
                className={`absolute left-0 top-0 w-0.5 bg-sky-300 ${i === last ? "h-[1.85rem]" : "h-full"} ${anim ? "df-fill-y" : ""}`}
                style={anim ? delay(d) : undefined}
              />
              <span
                aria-hidden
                className={`absolute left-0 top-[1.8rem] h-0.5 w-6 bg-sky-300 ${anim ? "df-fill-x" : ""}`}
                style={anim ? { ...delay(d + 300), animationDuration: "0.35s" } : undefined}
              />
              <div
                className={`flex min-h-10 min-w-0 flex-wrap items-center justify-between gap-x-3 rounded-xl bg-white px-3 py-1.5 ring-1 ring-borde ${
                  anim ? "df-rise" : ""
                }`}
                style={anim ? delay(d + 500) : undefined}
              >
                <span className="min-w-0 text-sm font-semibold [overflow-wrap:anywhere]">{o.name}</span>
                <span className="flex items-center gap-1 text-xs text-gris">
                  <Icon name="users" className="size-3.5" />
                  {o.members} {o.members === 1 ? "miembro" : "miembros"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const ALERT_ICON: Record<ActivityAlert["status"], { icon: "check" | "close" | "clock" | "grid"; tone: string; word: string }> = {
  sent: { icon: "check", tone: "bg-exito text-white", word: "enviado por WhatsApp" },
  failed: { icon: "close", tone: "bg-marca text-white", word: "no se pudo enviar" },
  pending: { icon: "clock", tone: "bg-naranja text-white", word: "en cola" },
  panel: { icon: "grid", tone: "bg-zinc-400 text-white", word: "solo en el panel" },
};

export function AlertChips({ event, anim }: VisualProps) {
  const groups = event.ongs.filter((o) => o.alerts.length);
  if (!groups.length) return null;
  let n = 0;
  return (
    <div className="mt-3 space-y-2.5">
      {groups.map((o) => (
        <div key={o.id} className="min-w-0">
          {groups.length > 1 ? <p className="mb-1.5 text-xs font-semibold text-gris [overflow-wrap:anywhere]">{o.name}</p> : null}
          <ul className="flex flex-wrap gap-2">
            {o.alerts.map((a, i) => {
              const meta = ALERT_ICON[a.status];
              const d = 150 + n++ * 150;
              return (
                <li
                  key={`${a.member}-${i}`}
                  className={`flex min-w-0 max-w-full items-center gap-2 rounded-xl bg-white py-1 pl-1 pr-3 ring-1 ring-borde ${anim ? "df-rise" : ""}`}
                  style={anim ? delay(d) : undefined}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-lg ${meta.tone} ${anim ? "df-pop" : ""}`}
                    style={anim ? delay(d + 220) : undefined}
                  >
                    <Icon name={meta.icon} className="size-3.5" />
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-sm font-semibold [overflow-wrap:anywhere]">{a.member}</span>
                    <span className="block font-mono text-[11px] text-gris">
                      {a.phone_hint}
                      <span className="sr-only">, {meta.word}</span>
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ExpedienteCards({ event, anim }: VisualProps) {
  const withExp = event.ongs.filter((o) => o.expediente);
  if (!withExp.length) return null;
  return (
    <div className="mt-3 grid gap-2.5 @lg:grid-cols-2">
      {withExp.map((o, i) => {
        const e = o.expediente!;
        const auths = e.authorities.length ? e.authorities : event.authorities_suggested;
        return (
          <div
            key={o.id}
            className={`min-w-0 rounded-2xl bg-fondo p-3 ${anim ? "df-rise" : ""}`}
            style={anim ? delay(120 + i * 200) : undefined}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gris">Folio</p>
            {e.folio ? (
              <p className={`font-mono text-lg font-black tracking-tight text-tinta ${anim ? "df-lock" : ""}`} style={anim ? delay(320 + i * 200) : undefined}>
                {e.folio}
              </p>
            ) : (
              <p className="text-base font-bold text-naranja">Sin folio todavía</p>
            )}
            <p className="mt-0.5 text-xs text-gris [overflow-wrap:anywhere]">
              {o.name}, {e.status_label.toLowerCase()}
            </p>
            {auths.length ? (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {auths.map((a) => (
                  <li key={a} className="rounded-lg bg-white px-2 py-0.5 text-xs font-semibold text-tinta ring-1 ring-borde">
                    {authorityName(a)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export function FilingList({ event, anim }: VisualProps) {
  const filings = event.ongs.flatMap((o) => o.expediente?.filings ?? []);
  const filedSet = new Set(filings.map((f) => f.authority.toUpperCase()));
  const missing = event.authorities_suggested.filter((a) => !filedSet.has(a.toUpperCase()));
  if (!filings.length && !missing.length) return null;
  return (
    <ul className="mt-3 space-y-2">
      {filings.map((f, i) => (
        <li
          key={`${f.authority}-${f.receipt_number}`}
          className={`flex min-w-0 items-center gap-3 rounded-2xl bg-exito-claro px-3 py-2 ring-1 ring-exito/20 ${anim ? "df-rise" : ""}`}
          style={anim ? delay(120 + i * 220) : undefined}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-exito text-white">
            <Icon name="landmark" className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-bold">{authorityName(f.authority)}</span>
            <span className="block text-xs text-gris [overflow-wrap:anywhere]">
              Constancia <span className="font-mono font-semibold text-tinta">{f.receipt_number}</span>
              {f.filed_at ? `, ${shortDate(f.filed_at)}` : ""}
            </span>
          </span>
        </li>
      ))}
      {missing.map((a, i) => (
        <li
          key={a}
          className={`flex min-w-0 items-center gap-3 rounded-2xl border border-dashed border-zinc-300 px-3 py-2 ${anim ? "df-rise" : ""}`}
          style={anim ? delay(120 + (filings.length + i) * 220) : undefined}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-fondo text-gris">
            <Icon name="landmark" className="size-4" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block text-sm font-bold text-gris">{authorityName(a)}</span>
            <span className="block text-xs text-gris">Por presentar</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
