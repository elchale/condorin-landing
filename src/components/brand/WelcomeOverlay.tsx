"use client";

import { useEffect, useRef, useState } from "react";
import { CondorMark } from "./Logo";

const SHOW_MS = 2200;
const FADE_MS = 450;

type Props = { ong: string; name?: string; onDone?: () => void };

/** Full screen "Sesión iniciada" card that covers the page for a moment, then fades away. Tap to skip. */
export function WelcomeOverlay({ ong, name, onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "out" | "gone">("in");
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const out = window.setTimeout(() => setPhase("out"), reduced ? 1200 : SHOW_MS);
    return () => window.clearTimeout(out);
  }, []);

  useEffect(() => {
    if (phase !== "out") return;
    const gone = window.setTimeout(() => {
      setPhase("gone");
      onDoneRef.current?.();
    }, FADE_MS);
    return () => window.clearTimeout(gone);
  }, [phase]);

  if (phase === "gone") return null;
  const first = name?.split(" ")[0];

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setPhase("out")}
      className={`fixed inset-0 z-50 flex items-center justify-center bg-marca p-6 text-white transition-opacity duration-[450ms] motion-reduce:transition-none ${
        phase === "out" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="welcome-rise flex max-w-sm flex-col items-center text-center">
        <span className="welcome-pop grid size-24 place-items-center rounded-full bg-white shadow-xl shadow-black/20">
          <CondorMark size={72} />
        </span>
        <span className="welcome-check mt-6 grid size-10 place-items-center rounded-full bg-white text-exito" aria-hidden>
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12.5l4.5 4.5L19 7" className="welcome-tick" />
          </svg>
        </span>
        <p className="mt-4 text-lg font-semibold text-white/85">{first ? `Hola, ${first}` : "Sesión iniciada"}</p>
        <p className="mt-1 text-2xl font-black leading-tight tracking-tight [overflow-wrap:anywhere]">
          Entraste como {ong}
        </p>
      </div>
    </div>
  );
}
