import { CondorMark } from "@/components/brand/Logo";

/** A sample WhatsApp alert, clearly labeled as an example. */
export function AlertPreview() {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <figcaption className="mb-3 text-center text-sm font-medium text-white/60">Así se ve una alerta (ejemplo)</figcaption>
      <div className="rounded-[2rem] bg-tinta-2 p-4 ring-1 ring-white/10">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-white">
            <CondorMark size={30} />
          </span>
          <div className="text-sm">
            <p className="font-bold">Condorin</p>
            <p className="text-white/60">Cuenta de empresa</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl rounded-tl-sm bg-white p-4 text-[15px] text-tinta">
          <p className="font-bold text-marca">Alerta de minería ilegal</p>
          <p className="mt-2">Detectamos 3 posibles dragas en el río Nanay (Loreto), a 8 km de tu zona.</p>
          <p className="mt-2 text-sm text-gris">Imagen satelital del 15 de octubre</p>
          <p className="mt-3 rounded-xl bg-fondo py-2 text-center font-medium text-marca">Ver en el mapa</p>
        </div>
      </div>
    </figure>
  );
}
