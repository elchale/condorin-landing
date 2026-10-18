import { openIncident } from "@/app/panel/actions";
import { Icon } from "@/components/ui/Icon";
import type { Incident } from "@/lib/panel";

const STATUS_STYLE = {
  none: "bg-marca-claro text-marca-3",
  draft: "bg-naranja-claro text-tinta",
  ready: "bg-fondo text-tinta ring-1 ring-borde",
  filed: "bg-exito-claro text-exito",
} as const;

const primary =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marca px-5 py-3.5 font-bold text-white hover:bg-marca-2 sm:w-auto";
const outline =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 font-bold text-tinta ring-2 ring-inset ring-tinta hover:bg-tinta hover:text-white sm:w-auto";

const dragas = (n: number) => (n === 1 ? "1 posible draga" : `${n} posibles dragas`);

/** What the member can do next with this incident, as one sentence and one button. */
function nextStep(e: Incident["expediente"]) {
  if (!e) return { note: "Nadie de tu ONG ha empezado la denuncia.", button: "Crear expediente", style: primary };
  if (e.status === "draft") {
    const note = e.missing
      ? `Borrador${e.updated_by ? ` de ${e.updated_by}` : ""}. ${e.missing === 1 ? "Falta 1 dato" : `Faltan ${e.missing} datos`}.`
      : `Borrador${e.updated_by ? ` de ${e.updated_by}` : ""}, completo. Solo falta confirmarlo.`;
    return { note, button: "Continuar expediente", style: primary };
  }
  if (e.status === "ready") {
    return {
      note: `${e.folio} listo. Preséntalo ante ${e.authorities.join(" y ") || "las autoridades"} y registra el número.`,
      button: "Presentar a las autoridades",
      style: primary,
    };
  }
  return { note: `${e.folio} presentado ante ${e.filings === 1 ? "1 autoridad" : `${e.filings} autoridades`}.`, button: "Ver expediente", style: outline };
}

export function IncidentCard({ incident }: { incident: Incident }) {
  const e = incident.expediente;
  const step = nextStep(e);
  const [crop, ...more] = incident.crops;

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-borde">
      <div className="relative aspect-[16/9] bg-tinta">
        {crop ? (
          // Signed GCS links that expire: next/image would cache them past their life.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={crop} alt={`Recorte satelital de la detección en el río ${incident.river.name}`} className="size-full object-cover" />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-white/70">
            <Icon name="satellite" className="size-8" />
            <span className="text-sm">La imagen de evidencia se está preparando</span>
          </div>
        )}
        {more.length > 0 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-tinta/80 px-3 py-1 text-xs font-semibold text-white">
            {more.length === 1 ? "1 recorte más" : `${more.length} recortes más`}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-bold">Río {incident.river.name}</h3>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLE[e?.status ?? "none"]}`}>
            {e ? e.status_label : "Sin expediente"}
          </span>
        </div>
        <p className="mt-1 text-sm text-gris">
          {dragas(incident.detections)} · {incident.captured_at_label} · {incident.satellite}
        </p>
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
          <dt className="text-gris">Confianza</dt>
          <dd className="font-semibold tabular-nums">{Math.round(incident.top_confidence * 100)}%</dd>
          <dt className="text-gris">Ubicación</dt>
          <dd className="min-w-0 break-words tabular-nums">
            {incident.lat}, {incident.lon}
            <span className="block text-gris">UTM {incident.utm}</span>
          </dd>
          {incident.river.protected_area && (
            <>
              <dt className="text-gris">Área protegida</dt>
              <dd>{incident.river.protected_area}</dd>
            </>
          )}
        </dl>

        <p className="mt-4 text-sm">{step.note}</p>
        <div className="mt-auto flex flex-col gap-3 pt-4 sm:flex-row sm:flex-wrap">
          <form action={openIncident} className="flex flex-col gap-3 sm:contents">
            <input type="hidden" name="incident" value={incident.id} />
            <button type="submit" name="to" value="expediente" className={step.style}>
              {step.button}
              <Icon name="arrow" className="size-5" />
            </button>
            <button type="submit" name="to" value="evento" className="inline-flex items-center justify-center px-2 py-3 font-semibold text-marca underline underline-offset-2">
              Ver evento
            </button>
          </form>
        </div>
      </div>
    </article>
  );
}
