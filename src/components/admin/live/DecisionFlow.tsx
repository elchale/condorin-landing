"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { ActivityEvent, ActivityStep } from "@/lib/admin/activity";
import { Icon } from "@/components/ui/Icon";
import { FlowScene } from "./FlowScene";
import { AlertChips, DetectionBars, EvidencePins, ExpedienteCards, FilingList, RoutingTree } from "./FlowVisuals";
import { STATE_FILL, STATE_NODE, STATE_TEXT, STATE_WORD, STEP_ICON, clock, outcome, stepDuration } from "./flowFormat";

export type DecisionFlowProps = {
  event: ActivityEvent;
  /** ALERT_MIN_CONFIDENCE, to draw the threshold line. */
  threshold: number;
  /** When it turns true (or `event.id` changes while true), the steps play one by one from the start. */
  play: boolean;
  /** Called once the last step has been revealed. */
  onDone?: () => void;
};

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const m = window.matchMedia(REDUCED);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(REDUCED).matches;
const getReducedServer = () => false;

const FIRST_STEP_MS = 450;
const DONE_AFTER_LAST_MS = 700;

export function DecisionFlow({ event, threshold, play, onDone }: DecisionFlowProps) {
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);
  const steps = event.steps;
  const total = steps.length;

  // Restart from zero whenever play turns on or a new event arrives while playing.
  const runKey = play ? event.id : null;
  const [prevKey, setPrevKey] = useState(runKey);
  const [run, setRun] = useState(0);
  const [revealed, setRevealed] = useState(0);
  if (runKey !== prevKey) {
    setPrevKey(runKey);
    setRevealed(0);
    setRun((r) => r + 1);
  }

  const onDoneRef = useRef(onDone);
  const eventRef = useRef(event);
  useEffect(() => {
    onDoneRef.current = onDone;
    eventRef.current = event;
  });

  useEffect(() => {
    if (!play) return;
    if (reduced) {
      onDoneRef.current?.();
      return;
    }
    const ev = eventRef.current;
    const timers: number[] = [];
    let at = FIRST_STEP_MS;
    ev.steps.forEach((s, i) => {
      timers.push(window.setTimeout(() => setRevealed(i + 1), at));
      if (i < ev.steps.length - 1) at += stepDuration(s, ev);
    });
    // Let the last step finish its entrance before handing control back.
    timers.push(window.setTimeout(() => onDoneRef.current?.(), at + DONE_AFTER_LAST_MS));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [play, reduced, event.id]);

  const animating = play && !reduced;
  const shown = animating ? revealed : total;
  const finished = shown >= total;
  const stepByKey = (k: ActivityStep["key"]) => steps.findIndex((s) => s.key === k);
  const detIdx = stepByKey("detections");
  const boxed = detIdx < 0 || shown > detIdx;
  const scanning = animating && !boxed;
  const result = outcome(event);
  const passing = event.detections.filter((d) => d.alerting).length;
  const alerts = event.ongs.flatMap((o) => o.alerts);
  const sent = alerts.filter((a) => a.status === "sent").length;
  const current = animating && shown > 0 ? steps[shown - 1] : null;

  return (
    <div className="@container min-w-0 rounded-3xl bg-white p-4 ring-1 ring-borde sm:p-5">
      <p aria-live="polite" className="sr-only">
        {current ? `Paso ${shown} de ${total}: ${current.label}. ${STATE_WORD[current.state]}.` : ""}
      </p>

      <div className="grid gap-5 @3xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] @3xl:gap-7">
        {/* Visual header: the scene and where it came from */}
        <section className="min-w-0 @3xl:sticky @3xl:top-4 @3xl:self-start" aria-label="Escena satelital">
          <FlowScene event={event} scanning={scanning} boxed={boxed} animate={animating} />
          <div className="mt-3 min-w-0">
            <p className="text-xl font-black leading-tight tracking-tight [overflow-wrap:anywhere]">{event.river.name}</p>
            {event.river.protected_area ? (
              <p className="text-sm text-gris [overflow-wrap:anywhere]">{event.river.protected_area}</p>
            ) : null}
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <Meta label="Satélite">{event.satellite}</Meta>
              <Meta label="Captura">{event.captured_at_label}</Meta>
              <Meta label="Modelo">{event.model}</Meta>
              <Meta label="Escena">N° {event.id}</Meta>
              <Meta label="Pasan el umbral">
                {passing} de {event.detections.length}
              </Meta>
              <Meta label="Alertas enviadas">{alerts.length ? `${sent} de ${alerts.length}` : "Ninguna"}</Meta>
            </dl>
          </div>
          <Outcome tone={animating && !finished ? "live" : result.tone} text={animating && !finished ? "Decidiendo en vivo" : result.text} />
        </section>

        {/* The decisions, one by one */}
        <ol key={run} className="min-w-0" aria-label="Decisiones tomadas">
          {steps.map((s, i) => {
            const isShown = i < shown;
            const hidden = animating && !isShown;
            const anim = animating && isShown;
            const active = animating && !finished && i === shown - 1;
            const isLast = i === total - 1;
            const next = steps[i + 1];
            const nextShown = i + 1 < shown;
            return (
              <li key={s.key} className="relative grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-1.5 @md:grid-cols-[2.5rem_minmax(0,1fr)] @md:gap-x-2 pb-3 last:pb-0" aria-hidden={hidden || undefined}>
                {!isLast ? (
                  <span aria-hidden className="absolute bottom-0 left-[1.125rem] top-10 @md:left-5 @md:top-11 w-0.5 -translate-x-1/2 overflow-hidden rounded-full bg-borde">
                    <span
                      className={`block size-full ${STATE_FILL[next.state]} ${
                        hidden || (animating && !nextShown) ? "scale-y-0" : anim ? "df-fill-y" : ""
                      }`}
                    />
                  </span>
                ) : null}

                <span
                  aria-hidden
                  className={`relative z-10 mt-1 grid size-9 @md:size-10 place-items-center rounded-full transition-colors ${
                    hidden ? "bg-white text-zinc-300 ring-1 ring-borde" : `${STATE_NODE[s.state]} ${anim ? "df-pop" : ""}`
                  }`}
                >
                  <Icon name={STEP_ICON[s.key]} className="size-5" />
                </span>

                <div
                  className={`min-w-0 rounded-2xl px-2.5 py-2 transition-colors @md:px-3 duration-500 ${active ? "bg-fondo" : "bg-transparent"}`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <p
                      className={`min-w-0 font-bold leading-6 [overflow-wrap:anywhere] ${
                        hidden
                          ? "text-zinc-400"
                          : s.state === "skipped"
                            ? "text-gris line-through decoration-zinc-400"
                            : s.state === "failed"
                              ? "text-marca"
                              : "text-tinta"
                      }`}
                    >
                      {s.label}
                    </p>
                    <p className={`text-xs font-semibold tabular-nums ${hidden ? "opacity-0" : STATE_TEXT[s.state]} ${anim ? "df-rise" : ""}`}>
                      {STATE_WORD[s.state]}
                      {s.at ? <span className="font-normal text-gris"> {clock(s.at)}</span> : null}
                    </p>
                  </div>
                  {/* Not rendered until revealed: reserving the space left big empty gaps mid animation. */}
                  {!hidden && (
                    <div className={anim ? "df-rise" : ""} style={anim ? { animationDelay: "120ms" } : undefined}>
                      <p className={`mt-0.5 text-sm [overflow-wrap:anywhere] ${s.state === "skipped" ? "text-zinc-500" : "text-gris"}`}>
                        {s.detail}
                      </p>
                      <StepVisual step={s} event={event} threshold={threshold} anim={anim} />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function StepVisual({ step, event, threshold, anim }: { step: ActivityStep; event: ActivityEvent; threshold: number; anim: boolean }) {
  switch (step.key) {
    case "detections":
      return <DetectionBars event={event} threshold={threshold} anim={anim} />;
    case "evidence":
      return step.state === "skipped" ? null : <EvidencePins event={event} anim={anim} />;
    case "routing":
      return step.state === "skipped" ? null : <RoutingTree event={event} anim={anim} />;
    case "alerts":
      return step.state === "skipped" ? null : <AlertChips event={event} anim={anim} />;
    case "expediente":
      return step.state === "skipped" ? null : <ExpedienteCards event={event} anim={anim} />;
    case "filed":
      return step.state === "skipped" ? null : <FilingList event={event} anim={anim} />;
    default:
      return null;
  }
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-gris">{label}</dt>
      <dd className="font-semibold [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

const TONE: Record<"ok" | "wait" | "off" | "bad" | "live", { box: string; dot: string; icon: "check" | "clock" | "close" | "scan" }> = {
  ok: { box: "bg-exito-claro text-exito", dot: "bg-exito text-white", icon: "check" },
  wait: { box: "bg-naranja-claro text-naranja", dot: "bg-naranja text-white", icon: "clock" },
  off: { box: "bg-fondo text-gris", dot: "bg-zinc-400 text-white", icon: "close" },
  bad: { box: "bg-marca-claro text-marca", dot: "bg-marca text-white", icon: "close" },
  live: { box: "bg-fondo text-tinta", dot: "bg-tinta text-white df-pulse", icon: "scan" },
};

function Outcome({ tone, text }: { tone: keyof typeof TONE; text: string }) {
  const t = TONE[tone];
  return (
    <div className={`mt-4 flex min-w-0 items-center gap-3 rounded-2xl px-3 py-2.5 ${t.box}`}>
      <span aria-hidden className={`grid size-8 shrink-0 place-items-center rounded-xl ${t.dot}`}>
        <Icon name={t.icon} className="size-4" />
      </span>
      <p className="min-w-0 text-sm font-bold leading-snug [overflow-wrap:anywhere]">{text}</p>
    </div>
  );
}
