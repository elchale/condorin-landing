"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { ActivityEvent, ActivityFeed, StepState } from "@/lib/admin/activity";
import { DecisionFlow } from "./DecisionFlow";
import { DemoWorld } from "./demo";
import { decisionSummary, detectionCount, formatTime, furthestStep, pct, signature } from "./summary";

const POLL_MS = 4_000;
const MAX_BACKOFF_MS = 60_000;
/** If the animation never reports onDone, the queue moves on after this long. */
const PLAY_FALLBACK_MS = 10_000;
/** Pause between two queued scenes, so each one can be read. */
const QUEUE_GAP_MS = 1_500;
const FLASH_MS = 2_600;
const TOAST_MS = 4_500;

type Conn = "live" | "reconnecting" | "offline";
type Toast = { id: number; title: string; text: string; tone: "nuevo" | "avance" };
type Known = { max: number; sigs: Map<number, string> };

const TONE_TEXT = { marca: "text-marca", naranja: "text-naranja", gris: "text-gris" } as const;
const TONE_DOT = { marca: "bg-marca", naranja: "bg-naranja", gris: "bg-gris" } as const;
const STEP_BAR: Record<StepState, string> = {
  done: "bg-exito",
  failed: "bg-marca",
  skipped: "bg-borde",
  pending: "bg-fondo ring-1 ring-inset ring-borde",
};

function indexFeed(feed: ActivityFeed | null): Known {
  const sigs = new Map<number, string>();
  let max = 0;
  for (const e of feed?.events ?? []) {
    sigs.set(e.id, signature(e));
    max = Math.max(max, e.id);
  }
  return { max, sigs };
}

export function LiveFeed({ initial, demo }: { initial: ActivityFeed | null; demo: boolean }) {
  const [feed, setFeed] = useState<ActivityFeed | null>(initial);
  const [conn, setConn] = useState<Conn>(demo || initial ? "live" : "reconnecting");
  const [selectedId, setSelectedId] = useState<number | null>(initial?.events[0]?.id ?? null);
  // Bumped on every replay; it is part of DecisionFlow's key so the animation restarts from zero.
  const [run, setRun] = useState(0);
  const [flash, setFlash] = useState<number[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const known = useRef<Known>(indexFeed(initial));
  const queue = useRef<number[]>([]);
  const busy = useRef(Boolean(initial?.events.length));
  const runRef = useRef(0);
  const fallback = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const gap = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const toastSeq = useRef(0);

  // These only touch refs and state setters, so timers holding an older copy still behave.
  function pushToast(toast: Omit<Toast, "id">) {
    const id = ++toastSeq.current;
    setToasts((list) => [...list.slice(-2), { ...toast, id }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), TOAST_MS);
  }

  function play(id: number) {
    const next = runRef.current + 1;
    runRef.current = next;
    busy.current = true;
    clearTimeout(gap.current);
    clearTimeout(fallback.current);
    fallback.current = setTimeout(() => finish(next), PLAY_FALLBACK_MS);
    setSelectedId(id);
    setRun(next);
  }

  function playNext() {
    const id = queue.current.shift();
    if (id !== undefined) play(id);
  }

  /** The animation of run `forRun` ended (or timed out): wait a moment, then play the next queued scene. */
  function finish(forRun: number) {
    if (forRun !== runRef.current || !busy.current) return;
    busy.current = false;
    clearTimeout(fallback.current);
    if (queue.current.length) gap.current = setTimeout(playNext, QUEUE_GAP_MS);
  }

  /** Compares a fresh feed with what is known: new ids get queued, changed ones flash. */
  const ingest = useEffectEvent((next: ActivityFeed) => {
    const prev = known.current;
    const fresh = next.events.filter((e) => e.id > prev.max).sort((a, b) => a.id - b.id);
    const changed = next.events.filter((e) => prev.sigs.has(e.id) && prev.sigs.get(e.id) !== signature(e));
    known.current = { ...indexFeed(next), max: Math.max(prev.max, ...next.events.map((e) => e.id)) };
    setFeed(next);

    if (prev.max === 0 && prev.sigs.size === 0) {
      // First data ever (demo start, or the API woke up): show the newest one, no toasts.
      if (fresh.length) play(fresh[fresh.length - 1].id);
      return;
    }

    for (const e of fresh) {
      pushToast({ title: `Nueva detección en el río ${e.river.name}`, text: decisionSummary(e).text, tone: "nuevo" });
    }
    if (fresh.length) {
      queue.current.push(...fresh.map((e) => e.id));
      if (!busy.current) playNext();
    }

    if (changed.length) {
      const ids = changed.map((e) => e.id);
      setFlash((list) => [...new Set([...list, ...ids])]);
      setTimeout(() => setFlash((list) => list.filter((id) => !ids.includes(id))), FLASH_MS);
      for (const e of changed) {
        const step = furthestStep(e);
        if (step) pushToast({ title: `Río ${e.river.name}`, text: step.label, tone: "avance" });
      }
    }
  });

  // Demo: a simulated world ticks every second. Live: poll the proxy, paused while the tab is hidden.
  useEffect(() => {
    if (demo) {
      const world = new DemoWorld(Date.now());
      const tick = () => ingest(world.feed(Date.now()));
      const first = setTimeout(tick, 300);
      const every = setInterval(tick, 1_000);
      return () => {
        clearTimeout(first);
        clearInterval(every);
      };
    }

    let stopped = false;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (stopped || inFlight || document.hidden) return;
      inFlight = true;
      try {
        const res = await fetch("/api/admin/actividad", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as ActivityFeed;
        failures = 0;
        setConn("live");
        ingest(data);
      } catch {
        failures += 1;
        setConn(failures >= 3 ? "offline" : "reconnecting");
      } finally {
        inFlight = false;
      }
      if (stopped || document.hidden) return;
      const delay = failures ? Math.min(POLL_MS * 2 ** failures, MAX_BACKOFF_MS) : POLL_MS;
      timer = setTimeout(poll, delay);
    };
    const onVisible = () => {
      if (document.hidden) return;
      clearTimeout(timer);
      poll();
    };

    timer = setTimeout(poll, POLL_MS);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [demo]);

  // The server rendered feed starts playing on mount; make sure the queue cannot stall on it.
  useEffect(() => {
    if (busy.current) fallback.current = setTimeout(() => finish(0), PLAY_FALLBACK_MS);
    return () => {
      clearTimeout(fallback.current);
      clearTimeout(gap.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const events = feed?.events ?? [];
  const selected = events.find((e) => e.id === selectedId) ?? events[0] ?? null;
  const threshold = feed?.threshold ?? 0.5;

  return (
    <div className="min-w-0">
      <StatusBar demo={demo} conn={conn} generatedAt={feed?.generated_at ?? null} />

      {events.length > 0 ? <Stats events={events} /> : null}

      {events.length === 0 ? (
        demo ? (
          <div className="rounded-3xl bg-white p-8 text-center text-gris ring-1 ring-borde">Preparando la demostración…</div>
        ) : (
          <EmptyState unavailable={!feed} />
        )
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          {selected ? (
            <section aria-labelledby="evento-actual" className="min-w-0 rounded-3xl bg-white p-4 ring-1 ring-borde sm:p-6">
              <EventHeader event={selected} onReplay={() => play(selected.id)} />
              <div className="mt-5 min-w-0">
                <DecisionFlow
                  key={`${selected.id}:${run}`}
                  event={selected}
                  threshold={threshold}
                  play
                  onDone={() => finish(run)}
                />
              </div>
            </section>
          ) : null}

          <section aria-labelledby="recientes" className="min-w-0 rounded-3xl bg-white p-3 ring-1 ring-borde sm:p-4">
            <h2 id="recientes" className="px-2 pt-1 pb-2 text-sm font-bold text-gris">
              Escenas recientes
            </h2>
            <ul className="space-y-1.5 lg:-m-1 lg:max-h-[calc(100vh-14rem)] lg:overflow-y-auto lg:p-1">
              {events.map((e) => (
                <li key={e.id}>
                  <EventItem
                    event={e}
                    selected={e.id === selected?.id}
                    flashing={flash.includes(e.id)}
                    onSelect={() => play(e.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <Toasts toasts={toasts} />
    </div>
  );
}

function StatusBar({ demo, conn, generatedAt }: { demo: boolean; conn: Conn; generatedAt: string | null }) {
  const label = conn === "live" ? "En vivo" : conn === "reconnecting" ? "Reconectando" : "Sin conexión";
  const color = conn === "live" ? "bg-exito" : conn === "reconnecting" ? "bg-naranja" : "bg-gris";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
      <p className="flex items-center gap-2 text-sm font-bold" role="status" aria-live="polite">
        <span className="relative flex size-3">
          {conn === "live" ? (
            <span className={`absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping ${color}`} />
          ) : null}
          <span className={`relative inline-flex size-3 rounded-full ${color}`} />
        </span>
        {label}
        {generatedAt && conn === "live" ? (
          <span className="font-normal text-gris">· actualizado {formatTime(generatedAt)}</span>
        ) : null}
      </p>

      {demo ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-naranja-claro px-3 py-1.5 text-sm">
          <span className="font-bold text-tinta">Demostración, datos simulados</span>
          <Link href="/admin/en-vivo" className="font-semibold text-gris underline underline-offset-2 hover:text-tinta">
            Ver datos reales
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function Stats({ events }: { events: ActivityEvent[] }) {
  const alerts = events.flatMap((e) => e.ongs.flatMap((o) => o.alerts));
  const cards = [
    { label: "Escenas", value: events.length },
    { label: "Detecciones", value: events.reduce((n, e) => n + e.detections.length, 0) },
    { label: "Alertas enviadas", value: alerts.filter((a) => a.status === "sent").length },
    {
      label: "Expedientes",
      value: events.reduce((n, e) => n + e.ongs.filter((o) => o.expediente?.folio).length, 0),
    },
  ];
  return (
    <dl className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {cards.map(({ label, value }) => (
        <div key={label} className="rounded-3xl bg-white px-4 py-3 ring-1 ring-borde">
          <dt className="text-xs text-gris sm:text-sm">{label}</dt>
          <dd className="text-2xl font-black tabular-nums sm:text-3xl">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function EventHeader({ event, onReplay }: { event: ActivityEvent; onReplay: () => void }) {
  const summary = decisionSummary(event);
  const top = event.detections.reduce<ActivityEvent["detections"][number] | null>(
    (best, d) => (!best || d.confidence > best.confidence ? d : best),
    null,
  );

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 id="evento-actual" className="text-2xl font-black tracking-tight sm:text-3xl">
          Río {event.river.name}
        </h2>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className={`flex items-center gap-1.5 font-bold ${TONE_TEXT[summary.tone]}`}>
            <span className={`size-2 rounded-full ${TONE_DOT[summary.tone]}`} />
            {summary.text}
          </span>
          <span className="text-gris">{detectionCount(event.detections.length)}</span>
          {top ? <span className="text-gris tabular-nums">la más alta, {pct(top.confidence)}</span> : null}
          <span className="text-gris tabular-nums">recibida {formatTime(event.received_at)}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onReplay}
        className="flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-tinta px-4 py-2.5 text-sm font-semibold text-white hover:bg-tinta-2"
      >
        <Icon name="radar" className="size-5" />
        Repetir animación
      </button>
    </header>
  );
}

function EventItem({
  event,
  selected,
  flashing,
  onSelect,
}: {
  event: ActivityEvent;
  selected: boolean;
  flashing: boolean;
  onSelect: () => void;
}) {
  const summary = decisionSummary(event);
  const step = furthestStep(event);

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`block w-full rounded-2xl p-3 text-left ring-1 transition-[background-color,box-shadow,opacity,translate] duration-500 motion-safe:starting:-translate-y-2 motion-safe:starting:opacity-0 ${
        flashing ? "bg-naranja-claro ring-2 ring-naranja" : selected ? "bg-marca-claro ring-marca" : "bg-white ring-borde hover:bg-fondo"
      }`}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate font-bold">Río {event.river.name}</span>
        <span className="shrink-0 text-xs text-gris tabular-nums">{formatTime(event.received_at)}</span>
      </span>
      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
        <span className={`flex items-center gap-1.5 font-semibold ${TONE_TEXT[summary.tone]}`}>
          <span className={`size-2 rounded-full ${TONE_DOT[summary.tone]}`} />
          {summary.text}
        </span>
        <span className="text-gris">{detectionCount(event.detections.length)}</span>
      </span>
      <span className="mt-2 flex gap-1" aria-hidden>
        {event.steps.map((s) => (
          <span key={s.key} className={`h-1.5 flex-1 rounded-full transition-colors duration-700 ${STEP_BAR[s.state]}`} />
        ))}
      </span>
      <span className="mt-1.5 block truncate text-xs text-gris">{step ? step.label : "Recibida"}</span>
    </button>
  );
}

function EmptyState({ unavailable }: { unavailable: boolean }) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center ring-1 ring-borde sm:p-10">
      <Icon name="radar" className="mx-auto size-10 text-marca" />
      <h2 className="mt-3 text-lg font-bold">
        {unavailable ? "La actividad todavía no responde" : "Aún no hay detecciones"}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-gris">
        {unavailable
          ? "Seguimos intentando. Mientras tanto puedes ver cómo se verá con datos simulados."
          : "Cuando el satélite envíe una escena aparecerá aquí al instante, con cada decisión que tome Condorin."}
      </p>
      <Link
        href="/admin/en-vivo?demo=1"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-marca px-5 py-2.5 font-semibold text-white hover:bg-marca-2"
      >
        <Icon name="satellite" className="size-5" />
        Ver demostración
      </Link>
    </div>
  );
}

function Toasts({ toasts }: { toasts: Toast[] }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-stretch gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-80"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-start gap-3 rounded-2xl bg-tinta px-4 py-3 text-white shadow-lg transition-[opacity,translate] duration-300 motion-safe:starting:translate-y-3 motion-safe:starting:opacity-0"
        >
          <Icon name={t.tone === "nuevo" ? "satellite" : "bell"} className={`mt-0.5 size-5 shrink-0 ${t.tone === "nuevo" ? "text-naranja" : "text-exito"}`} />
          <p className="min-w-0">
            <span className="block text-sm font-bold">{t.title}</span>
            <span className="block truncate text-sm text-white/80">{t.text}</span>
          </p>
        </div>
      ))}
    </div>
  );
}
