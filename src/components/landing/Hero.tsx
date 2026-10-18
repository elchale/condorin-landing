import Image from "next/image";
import { SiteNav } from "@/components/brand/SiteNav";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { PETITION_URL } from "@/lib/links";
import mascot from "../../../public/brand/condor-thumbsup.png";
import river from "../../../public/img/rio.jpg";

/** `nav={false}` when the page already has its own top bar (/acerca). */
export function Hero({ nav = true, entrarHref = "#entrar" }: { nav?: boolean; entrarHref?: string } = {}) {
  return (
    <header className="bg-white">
      {nav && <SiteNav />}

      {/* Text first on mobile, the river right under it; side by side from lg up */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 pb-12 pt-6 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pb-20 lg:pt-12 [&>*]:min-w-0">
        <div>
          <h1 className="text-[2.5rem] font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            Vigilamos la <span className="text-marca">minería ilegal</span> en la Amazonía.
          </h1>
          <p className="mt-4 text-lg text-gris sm:text-xl">
            Dragas y tajos abiertos, detectados por satélite. Te avisamos al instante por WhatsApp.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={entrarHref}>
              Entrar a Ojo de Cóndor <Icon name="arrow" className="size-5" />
            </ButtonLink>
            <ButtonLink href="#como-funciona" variant="outline">
              Cómo funciona
            </ButtonLink>
          </div>
          <a
            href={PETITION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 font-bold text-marca underline underline-offset-4 hover:text-marca-2"
          >
            <Icon name="pen" className="size-5" />
            Firma la petición por alertas satelitales
          </a>
        </div>

        {/* The mascot stays inside the photo's width so nothing pushes past the page gutter */}
        <div className="relative mb-5 lg:mb-0">
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl bg-tinta sm:aspect-[4/3] lg:aspect-[4/5]">
            <Image
              src={river}
              alt="Vista aérea del río Madre de Dios atravesando la selva amazónica"
              fill
              priority
              placeholder="blur"
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[48%_62%]"
            />
          </div>
          <Image
            src={mascot}
            alt=""
            sizes="160px"
            className="absolute -bottom-5 right-3 w-20 drop-shadow-xl sm:w-32 lg:-bottom-8 lg:right-4 lg:w-40"
          />
        </div>
      </div>
    </header>
  );
}
