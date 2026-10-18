"use client";

// The interactive part of "/": filters, the bottom sheet (mobile) or left panel (from 1024 px), and the
// lazily mounted Leaflet map. The server renders this whole tree to HTML first; only the map waits for JS.

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { LayerEntry, Mapa, Viewer } from "@/lib/mapa-types";
import { ActivityList, DetectionList, LayerList, RiverList } from "./ConsoleLists";
import { monthKey, monthLabel, num } from "./format";
import type { Basemap, Focus } from "./MapaMap";

const MapaMap = dynamic(() => import("./MapaMap"), { ssr: false });

type Tab = "det" | "rios" | "capas" | "act";
type Snap = 0 | 1 | 2;

/** Visible height of the sheet at each snap point, as CSS so the server render already has the right layout. */
const PEEK_PX = 136;
const TOP_GAP_PX = 12;
const SNAP_Y = ["calc(100% - 136px)", "50%", `${TOP_GAP_PX}px`] as const;
const SNAP_SCROLL = ["40px", "calc(50% - 96px)", "calc(100% - 108px)"] as const;
const LAYERS_KEY = "odc.capas";
/** Space the KPI strip takes over the map, so flyTo keeps targets visible. */
const MAP_INSETS = { top: 120, bottom: 0 };

type Props = { mapa: Mapa; layers: LayerEntry[]; viewer: Viewer; kpis: ReactNode };

function readStoredLayers(valid: Set<string>): string[] {
  try {
    const raw = JSON.parse(window.localStorage.getItem(LAYERS_KEY) ?? "[]");
    return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === "string" && valid.has(id)) : [];
  } catch {
    return [];
  }
}

function storeLayers(ids: string[]) {
  try {
    window.localStorage.setItem(LAYERS_KEY, JSON.stringify(ids));
  } catch {
    // Private mode or blocked storage: the toggle still works for this visit.
  }
}

function prefersSaveData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c && (c.saveData || c.effectiveType === "2g" || c.effectiveType === "slow-2g"));
}

export function MapaConsole({ mapa, layers, viewer, kpis }: Props) {
  const [tab, setTab] = useState<Tab>("det");
  const [snap, setSnap] = useState<Snap>(0);
  const [mineOnly, setMineOnly] = useState(false);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [basemap, setBasemap] = useState<Basemap>("dark");
  const [enabled, setEnabled] = useState<string[]>([]);
  const [saveData, setSaveData] = useState(false);
  const [mountMap, setMountMap] = useState(false);
  const [playing, setPlaying] = useState(false);

  const months = useMemo(() => {
    const set = new Set(mapa.timeline.map((t) => t.month));
    for (const f of mapa.detections.features) set.add(monthKey(f.properties.captured_at));
    return [...set].sort();
  }, [mapa]);
  const [monthIdx, setMonthIdx] = useState(months.length - 1);

  const rivers = useMemo(() => new Map(mapa.rivers.map((r) => [r.slug, r])), [mapa.rivers]);
  const mineRivers = useMemo(() => viewer.mine?.rivers ?? [], [viewer.mine]);
  const mine = useMemo(() => new Set(mineRivers), [mineRivers]);

  const features = useMemo(() => {
    const until = months[monthIdx];
    return mapa.detections.features
      .filter((f) => (!until || monthKey(f.properties.captured_at) <= until) && (!mineOnly || mine.has(f.properties.river)))
      .sort((a, b) => b.properties.captured_at.localeCompare(a.properties.captured_at) || b.properties.confidence - a.properties.confidence);
  }, [mapa, months, monthIdx, mineOnly, mine]);

  const activeLayers = useMemo(() => layers.filter((l) => enabled.includes(l.id)), [layers, enabled]);
  const selectedId = focus?.kind === "det" ? focus.id : null;

  // Browser only settings, read after hydration so the server HTML stays identical.
  useEffect(() => {
    const slow = prefersSaveData();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser only state, unknown during the server render
    setSaveData(slow);
    if (!slow) setEnabled(readStoredLayers(new Set(layers.map((l) => l.id))));
  }, [layers]);

  // Mount the map when the browser is idle or on the first interaction, whichever comes first.
  useEffect(() => {
    if (mountMap) return;
    const go = () => setMountMap(true);
    const events = ["pointerdown", "keydown", "wheel", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 2500 }) : window.setTimeout(go, 600);
    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [mountMap]);

  // Time scrubber playback: walk the months from the first to the last.
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setMonthIdx((i) => {
        if (i >= months.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [playing, months.length]);

  const isDesktop = () => window.matchMedia("(min-width: 1024px)").matches;

  const pickDetection = useCallback((id: number) => {
    setFocus((f) => ({ kind: "det", id, n: (f?.n ?? 0) + 1 }));
    setMountMap(true);
    if (!isDesktop()) setSnap(0);
  }, []);

  const pickRiver = (slug: string) => {
    setFocus((f) => ({ kind: "river", slug, n: (f?.n ?? 0) + 1 }));
    setMountMap(true);
    if (!isDesktop()) setSnap(0);
  };

  const toggleLayer = (id: string) => {
    setMountMap(true);
    setEnabled((cur) => {
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
      storeLayers(next);
      return next;
    });
  };

  const openTab = (t: Tab) => {
    setTab(t);
    if (snap === 0 && !isDesktop()) setSnap(1);
  };

  // Bottom sheet drag: the offset is written straight to the element while dragging (no re-render per frame),
  // then it settles on the nearest snap point.
  const sheet = useRef<HTMLElement>(null);
  const drag = useRef<{ startY: number; startOffset: number; height: number; moved: boolean } | null>(null);

  const offsetFor = (s: Snap, h: number) => (s === 0 ? h - PEEK_PX : s === 1 ? h / 2 : TOP_GAP_PX);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = sheet.current;
    if (!el || isDesktop()) return;
    const height = el.getBoundingClientRect().height;
    drag.current = { startY: e.clientY, startOffset: offsetFor(snap, height), height, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = sheet.current;
    if (!d || !el) return;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.abs(dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      el.dataset.dragging = "true";
    }
    const y = Math.min(d.height - PEEK_PX, Math.max(TOP_GAP_PX, d.startOffset + dy));
    el.style.setProperty("--sheet-y", `${y}px`);
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    const el = sheet.current;
    drag.current = null;
    if (!d || !el) return;
    el.dataset.dragging = "false";
    let next: Snap;
    if (!d.moved) {
      next = ((snap + 1) % 3) as Snap;
    } else {
      const y = d.startOffset + (e.clientY - d.startY);
      const options: Snap[] = [0, 1, 2];
      next = options.reduce((best, s) => (Math.abs(offsetFor(s, d.height) - y) < Math.abs(offsetFor(best, d.height) - y) ? s : best), snap);
    }
    el.style.setProperty("--sheet-y", SNAP_Y[next]);
    setSnap(next);
  }

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "det", label: "Detecciones", count: features.length },
    { id: "rios", label: "Ríos", count: mapa.rivers.length },
    ...(layers.length ? [{ id: "capas" as const, label: "Capas" }] : []),
    { id: "act", label: "Actividad" },
  ];

  const sources = [...new Set(layers.map((l) => `${l.source} (${l.license})`))];
  const sheetStyle = { "--sheet-y": SNAP_Y[snap], "--sheet-scroll": SNAP_SCROLL[snap] } as CSSProperties;

  return (
    <div className="odc relative h-[calc(100dvh-56px)] overflow-hidden">
      {/* Map area: the static placeholder is the same box, so mounting the map never moves anything. */}
      <div className="odc-placeholder absolute inset-x-0 top-0 bottom-[124px] isolate lg:bottom-0 lg:left-[360px]">
        {mountMap && (
          <MapaMap
            mapa={mapa}
            features={features}
            mineRivers={mineRivers}
            focus={focus}
            onSelect={pickDetection}
            basemap={basemap}
            activeLayers={activeLayers}
            saveData={saveData}
            signedIn={viewer.signedIn}
            insets={MAP_INSETS}
          />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-2 sm:p-3">
          {kpis}
          <div className="pointer-events-auto absolute right-2 top-[86px] flex gap-2 sm:right-3 sm:top-[80px]">
            <button
              type="button"
              onClick={() => {
                setMountMap(true);
                setBasemap((b) => (b === "dark" ? "satellite" : "dark"));
              }}
              aria-pressed={basemap === "satellite"}
              className={`min-h-11 rounded-lg border px-3 text-xs font-bold ${
                basemap === "satellite" ? "border-(--c-cyan) bg-(--c-cyan) text-(--c-bg)" : "border-(--c-line) bg-(--c-panel) text-(--c-text)"
              }`}
            >
              Satélite
            </button>
            {layers.length > 0 && (
              <button
                type="button"
                onClick={() => openTab("capas")}
                className="min-h-11 rounded-lg border border-(--c-line) bg-(--c-panel) px-3 text-xs font-bold text-(--c-text)"
              >
                Capas{enabled.length ? ` (${enabled.length})` : ""}
              </button>
            )}
          </div>
          {saveData && (
            <p className="pointer-events-auto mt-2 inline-block rounded border border-(--c-amber)/50 bg-(--c-bg)/90 px-2 py-1 text-[11px] text-(--c-amber)">
              Modo ahorro: solo detecciones, sin capas precargadas
            </p>
          )}
        </div>
        {!mountMap && <p className="absolute inset-x-0 bottom-3 text-center text-xs text-(--c-muted)">Cargando mapa…</p>}
      </div>

      <section
        ref={sheet}
        style={sheetStyle}
        aria-label="Panel de detecciones"
        className="odc-sheet absolute inset-x-0 top-0 bottom-0 z-20 flex flex-col rounded-t-2xl border-t border-(--c-line) bg-(--c-panel) shadow-[0_-8px_24px_rgba(0,0,0,.45)] lg:right-auto lg:w-[360px] lg:rounded-none lg:border-t-0 lg:border-r lg:shadow-none"
      >
        <div
          className="shrink-0 cursor-grab touch-none select-none lg:cursor-auto"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <button
            type="button"
            className="flex h-6 w-full items-center justify-center lg:hidden"
            aria-label={snap === 2 ? "Bajar el panel" : "Subir el panel"}
            onClick={(e) => {
              // Pointer taps are handled by onPointerUp; this covers the keyboard.
              if (e.detail === 0) setSnap(((snap + 1) % 3) as Snap);
            }}
          >
            <span className="h-1 w-10 rounded-full bg-slate-500" aria-hidden />
          </button>
          <p className="truncate px-4 pb-1 text-xs text-(--c-muted) lg:pt-3">
            <b className="text-white">{num(mapa.totals.alerts_sent)}</b> alertas enviadas ·{" "}
            <b className="text-white">{num(mapa.totals.ongs)}</b> ONG · <b className="text-white">{num(mapa.totals.members)}</b> personas
            {viewer.mine && <span className="text-(--c-cyan)"> · {viewer.mine.ong}</span>}
          </p>
        </div>

        <div role="tablist" aria-label="Vistas" className="flex shrink-0 border-b border-(--c-line) px-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => openTab(t.id)}
              className={`min-h-12 flex-1 whitespace-nowrap border-b-2 px-1 text-[13px] font-semibold ${
                tab === t.id ? "border-(--c-cyan) text-white" : "border-transparent text-(--c-muted) hover:text-white"
              }`}
            >
              {t.label}
              {t.count !== undefined && <span className="ml-1 text-[11px] text-(--c-muted)">{t.count}</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" className="h-(--sheet-scroll) min-h-0 overflow-y-auto overscroll-contain lg:h-auto lg:flex-1">
          {tab === "det" && (
            <>
              {months.length > 1 && (
                <div className="border-b border-(--c-line) px-4 pb-1 pt-2">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="odc-months" className="odc-label">
                      Hasta {monthLabel(months[monthIdx])}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!playing && monthIdx >= months.length - 1) setMonthIdx(0);
                        setPlaying((p) => !p);
                      }}
                      className="min-h-11 px-2 text-xs font-bold text-(--c-cyan)"
                    >
                      {playing ? "Pausar" : "Reproducir"}
                    </button>
                  </div>
                  <input
                    id="odc-months"
                    type="range"
                    min={0}
                    max={months.length - 1}
                    step={1}
                    value={monthIdx}
                    onChange={(e) => {
                      setPlaying(false);
                      setMonthIdx(Number(e.target.value));
                    }}
                    aria-valuetext={monthLabel(months[monthIdx])}
                    className="odc-range w-full"
                  />
                  <div className="flex justify-between text-[11px] text-(--c-muted)">
                    <span>{monthLabel(months[0])}</span>
                    <span>{monthLabel(months[months.length - 1])}</span>
                  </div>
                </div>
              )}
              {viewer.mine && viewer.mine.rivers.length > 0 && (
                <div className="flex gap-2 border-b border-(--c-line) px-4 py-2">
                  {[
                    { on: !mineOnly, label: "Todas", value: false },
                    { on: mineOnly, label: "Mis detecciones", value: true },
                  ].map((c) => (
                    <button
                      key={c.label}
                      type="button"
                      aria-pressed={c.on}
                      onClick={() => setMineOnly(c.value)}
                      className={`min-h-11 rounded-full border px-4 text-xs font-bold ${
                        c.on ? "border-(--c-cyan) bg-(--c-cyan)/15 text-(--c-cyan)" : "border-(--c-line) text-(--c-muted)"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
              <DetectionList features={features} rivers={rivers} mine={mine} selectedId={selectedId} onPick={pickDetection} />
            </>
          )}
          {tab === "rios" && <RiverList rivers={mapa.rivers} mine={mine} onPick={pickRiver} />}
          {tab === "capas" && <LayerList layers={layers} enabled={new Set(enabled)} onToggle={toggleLayer} />}
          {tab === "act" && <ActivityList activity={mapa.activity} />}

          <footer className="border-t border-(--c-line) px-4 py-4 text-[11px] leading-relaxed text-(--c-muted)">
            <p>
              <span className="odc-label mr-1">Datos</span>
              Copernicus Sentinel (ESA), escenas Planet de demostración
              {sources.length ? `, ${sources.join(", ")}` : ""}. Mapa base Esri, HERE, Garmin, © OpenStreetMap contributors; imagen satelital Esri, Maxar,
              Earthstar Geographics.
            </p>
            <p className="mt-2 flex flex-wrap gap-x-4">
              <a href="/acerca" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-white">Qué decidimos y qué quedó fuera</a>
              <a href="/privacidad" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-white">Privacidad</a>
              <a href="/terminos" className="inline-flex min-h-11 items-center underline underline-offset-2 hover:text-white">Términos</a>
            </p>
          </footer>
        </div>
      </section>
    </div>
  );
}
