"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { AlertSection } from "@/components/expediente/AlertSection";
import { OpenInBrowser } from "@/components/expediente/OpenInBrowser";
import type { ApiError, Payload, Status } from "@/components/expediente/types";
import { card, outlineButton, primaryButton } from "@/components/expediente/ui";
import { useLinkSignIn } from "@/components/expediente/useLinkSignIn";
import { Icon } from "@/components/ui/Icon";

type Evento = {
  member: { name: string; first_name: string };
  ong: { name: string };
  incident: Payload["incident"];
  expediente: null | { status: Status; status_label: string; folio: string | null; missing: number; updated_by: string | null };
};

/** What to do next with this event, as one button to the expediente page. */
function nextAction(e: Evento["expediente"]) {
  if (!e) return { note: "Nadie de tu ONG ha empezado la denuncia todavía.", button: "Crear expediente" };
  if (e.status === "draft") {
    return {
      note: e.missing ? `Hay un borrador. ${e.missing === 1 ? "Falta 1 dato" : `Faltan ${e.missing} datos`}.` : "Hay un borrador listo para revisar y confirmar.",
      button: "Continuar expediente",
    };
  }
  if (e.status === "ready") return { note: `${e.folio} está listo. Falta presentarlo ante las autoridades.`, button: "Presentar a las autoridades" };
  return { note: `${e.folio} ya fue presentado.`, button: "Ver expediente" };
}

/**
 * condorin.pe/evento/<token>: the detection itself (evidence, satellite map, coordinates) and the choice
 * to start the denuncia. Opened from "Ver evento" in the WhatsApp alert or from the panel.
 */
export function EventoApp({ token, signedIn: initiallySignedIn }: { token: string; signedIn: boolean }) {
  const [data, setData] = useState<Evento | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const { signedIn, overlay } = useLinkSignIn(token, initiallySignedIn);

  const load = useCallback(() => {
    fetch(`/api/eventos/${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (res.ok) setData(body as Evento);
        else setError(body?.type ? body : { message: "No pudimos abrir el evento.", type: "unknown", field_errors: {} });
      })
      .catch(() => setError({ message: "Sin conexión. Revisa tu internet e inténtalo otra vez.", type: "offline", field_errors: {} }));
  }, [token]);

  useEffect(load, [load]);

  const best = data?.incident.detections[0];
  const action = data && nextAction(data.expediente);

  return (
    <div className="min-h-dvh bg-fondo">
      {overlay}
      <header className="sticky top-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
          {signedIn ? (
            <Link href="/panel" className="flex items-center gap-1 font-semibold text-tinta">
              <Icon name="back" className="size-5" />
              Todos los eventos
            </Link>
          ) : (
            <Link href="/" aria-label="Ojo de Cóndor, inicio">
              <Logo />
            </Link>
          )}
          <div className="flex min-w-0 items-center gap-3">
            {data && <span className="hidden truncate text-sm text-gris sm:inline">{data.ong.name}</span>}
            <Link href="/" className="flex min-h-11 shrink-0 items-center text-sm font-semibold text-marca hover:text-marca-2">
              Volver al mapa
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <OpenInBrowser token={token} />

        {error ? (
          <section className={`${card} text-center`}>
            <h1 className="text-xl font-black">{error.type === "link_expired" ? "Este enlace venció" : "No pudimos abrir el evento"}</h1>
            <p className="mt-2 text-gris">{error.type === "not_found" ? "Revisa que el enlace esté completo." : error.message}</p>
            <Link href="/panel" className={`${primaryButton} mt-6 inline-block`}>
              Ir a mis eventos
            </Link>
          </section>
        ) : !data ? (
          <p className={`${card} text-center text-gris`} role="status">
            Abriendo el evento…
          </p>
        ) : (
          <>
            <AlertSection incident={data.incident} />

            {best && (
              <section aria-labelledby="ubicacion" className={card}>
                <h2 id="ubicacion" className="text-lg font-bold">
                  Ubicación
                </h2>
                <p className="mt-1 text-sm text-gris">
                  {best.lat}, {best.lon} · UTM {best.utm}
                </p>
                <div className="mt-4 aspect-[4/3] overflow-hidden rounded-2xl bg-tinta ring-1 ring-borde">
                  <iframe
                    title={`Mapa satelital del punto en el río ${data.incident.river.name}`}
                    src={`https://maps.google.com/maps?q=${best.lat},${best.lon}&t=k&z=15&output=embed`}
                    className="size-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <a href={best.maps_url} target="_blank" rel="noopener noreferrer" className={`${outlineButton} mt-4`}>
                  Abrir en Google Maps
                </a>
                {data.incident.discarded > 0 && (
                  <p className="mt-4 text-sm text-gris">
                    {data.incident.discarded === 1 ? "Otra detección quedó" : `Otras ${data.incident.discarded} detecciones quedaron`} por debajo
                    del umbral de {Math.round(data.incident.threshold * 100)}% y no se incluyen.
                  </p>
                )}
              </section>
            )}

            {action && (
              <section aria-labelledby="accion" className={card}>
                <h2 id="accion" className="text-lg font-bold">
                  ¿Qué quieres hacer?
                </h2>
                <p className="mt-1 text-gris">{action.note}</p>
                <Link href={`/expediente/${token}`} className={`${primaryButton} mt-4 inline-flex items-center justify-center gap-2`}>
                  {action.button}
                  <Icon name="arrow" className="size-5" />
                </Link>
                {signedIn && (
                  <Link href="/panel" className={`${outlineButton} mt-3 w-full`}>
                    Ver todos los eventos
                  </Link>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
