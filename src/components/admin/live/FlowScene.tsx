import type { ActivityDetection, ActivityEvent } from "@/lib/admin/activity";
import { pct } from "./flowFormat";

/** Deterministic pseudo random numbers, so server and client draw the same placeholder. */
function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/** Dark satellite styled scene for when the crop has no image: canopy, a muddy meander and a dredge. */
function SatPlaceholder({ seed }: { seed: number }) {
  const r = rng(seed);
  const canopy = Array.from({ length: 260 }, () => ({
    x: r() * 160,
    y: r() * 100,
    rad: 1.2 + r() * 3.2,
    tone: ["#16371f", "#183b23", "#143420", "#1a3f25", "#133019", "#1c4227"][Math.floor(r() * 6)],
  }));
  const bend = 20 + r() * 20;
  return (
    <svg viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      <rect width="160" height="100" fill="#0e2418" />
      {canopy.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={c.rad} fill={c.tone} opacity="0.7" />
      ))}
      {/* sand bars and a cleared pit */}
      <ellipse cx="96" cy="58" rx="22" ry="9" fill="#8c7a55" opacity="0.55" />
      <ellipse cx="60" cy="40" rx="10" ry="5" fill="#a08b5f" opacity="0.4" />
      {/* the river */}
      <path
        d={`M-10 ${bend} C 30 ${bend + 10}, 50 70, 80 52 S 130 ${bend + 5}, 175 70`}
        fill="none"
        stroke="#6b5332"
        strokeWidth="16"
        strokeLinecap="round"
      />
      <path
        d={`M-10 ${bend} C 30 ${bend + 10}, 50 70, 80 52 S 130 ${bend + 5}, 175 70`}
        fill="none"
        stroke="#9b7a4a"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* sediment plume behind the dredge */}
      <ellipse cx="88" cy="50" rx="14" ry="4" fill="#c9ab78" opacity="0.5" transform="rotate(-18 88 50)" />
      {/* dredge */}
      <rect x="77" y="47" width="7" height="4" rx="0.8" fill="#e8e2d0" transform="rotate(-18 80 49)" />
      <rect x="79" y="45.6" width="3" height="2" rx="0.4" fill="#c7c0aa" transform="rotate(-18 80 49)" />
    </svg>
  );
}

function strongest(dets: ActivityDetection[]): ActivityDetection | null {
  return dets.reduce<ActivityDetection | null>((best, d) => (!best || d.confidence > best.confidence ? d : best), null);
}

type SceneProps = {
  event: ActivityEvent;
  /** The scan line sweeps while the scene is being read. */
  scanning: boolean;
  /** The bounding box is shown (detections step revealed). */
  boxed: boolean;
  /** Animate the box as it locks on. */
  animate: boolean;
};

export function FlowScene({ event, scanning, boxed, animate }: SceneProps) {
  const top = strongest(event.detections);
  const hit = top?.alerting ?? false;
  const boxTone = hit ? "border-emerald-400" : "border-white/70";
  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#0e2418] ring-1 ring-black/10">
      {top?.crop_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={top.crop_url}
          alt={`Recorte satelital de la detección más fuerte en ${event.river.name}`}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <SatPlaceholder seed={event.id} />
      )}

      {/* sensor grid and vignette */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgb(255_255_255/0.25)_1px,transparent_1px),linear-gradient(90deg,rgb(255_255_255/0.25)_1px,transparent_1px)] [background-size:28px_28px]"
      />
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(0_0_0/0.55))]" />

      {scanning ? (
        <div aria-hidden className="df-scan absolute inset-x-0 h-1/4">
          <div className="h-full bg-gradient-to-b from-transparent via-emerald-300/15 to-emerald-300/40" />
          <div className="h-px bg-emerald-200 shadow-[0_0_12px_2px_rgb(110_231_183/0.8)]" />
        </div>
      ) : null}

      {top && boxed ? (
        <div
          aria-hidden
          className={`absolute left-1/2 top-1/2 h-[38%] w-[30%] -translate-x-1/2 -translate-y-1/2`}
        >
          <div className={`relative size-full ${animate ? "df-lock" : ""}`}>
            <span className={`absolute left-0 top-0 size-4 border-l-2 border-t-2 ${boxTone}`} />
            <span className={`absolute right-0 top-0 size-4 border-r-2 border-t-2 ${boxTone}`} />
            <span className={`absolute bottom-0 left-0 size-4 border-b-2 border-l-2 ${boxTone}`} />
            <span className={`absolute bottom-0 right-0 size-4 border-b-2 border-r-2 ${boxTone}`} />
            <span
              className={`absolute -top-6 left-0 whitespace-nowrap rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                hit ? "bg-emerald-400 text-emerald-950" : "bg-white/80 text-zinc-800"
              }`}
            >
              {pct(top.confidence)}%
            </span>
          </div>
        </div>
      ) : null}

      <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide text-white/90">
        <span aria-hidden className={`size-1.5 rounded-full bg-marca ${scanning ? "df-blink" : ""}`} />
        {event.satellite}
      </div>
      {top ? (
        <div className="absolute bottom-2 left-2 right-2 truncate font-mono text-[11px] text-white/80 [text-shadow:0_1px_2px_rgb(0_0_0/0.8)]">
          {top.lat}, {top.lon}
        </div>
      ) : (
        <div className="absolute bottom-2 left-2 font-mono text-[11px] text-white/80">Sin detecciones</div>
      )}
    </div>
  );
}
