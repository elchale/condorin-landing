import Link from "next/link";
import { Logo } from "./Logo";

const PHOTO_CREDITS = [
  {
    text: "río Madre de Dios por Murray Foubister",
    license: "CC BY-SA 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Flight_from_Cusco_to_Puerto_Moldinado%E2%80%A6Rio_Madre_de_Dios_(8445823960).jpg",
  },
  {
    text: "draga en el río Madre de Dios por USDA Forest Service",
    license: "dominio público",
    href: "https://commons.wikimedia.org/wiki/File:Gold_Suction_Dredge_-_Madre_de_Dios_River_(8183089237).jpg",
  },
  {
    text: "minería en Madre de Dios, imagen satelital de INPE",
    license: "CC BY-SA 2.0",
    href: "https://commons.wikimedia.org/wiki/File:Garimpo_de_ouro_ilegal_na_Amaz%C3%B4nia_em_Madre_de_Dios,_Per%C3%BA.jpg",
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-tinta text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <Logo light />
        <p className="max-w-xl text-[15px] text-white/75">Monitoreo de minería ilegal en la Amazonía con imágenes satelitales.</p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 text-[15px]">
          <Link href="/privacidad" className="underline underline-offset-4 hover:text-white/80">Política de privacidad</Link>
          <Link href="/terminos" className="underline underline-offset-4 hover:text-white/80">Términos y condiciones</Link>
        </nav>
        <p className="text-sm text-white/60">Condorin no es una entidad del Estado peruano.</p>
        <p className="text-xs leading-relaxed text-white/45">
          Fotos:{" "}
          {PHOTO_CREDITS.map((c, i) => (
            <span key={c.href}>
              {c.text} (<a className="underline" href={c.href}>{c.license}</a>){i < PHOTO_CREDITS.length - 1 ? "; " : "."}
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
