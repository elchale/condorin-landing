import type { Metadata } from "next";
import { DecisionsSection } from "@/components/acerca/DecisionsSection";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { ClosingCta } from "@/components/landing/ClosingCta";
import { DetectsSection } from "@/components/landing/DetectsSection";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { MercurySection } from "@/components/landing/MercurySection";
import { TopBar } from "@/components/mapa/TopBar";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { Icon } from "@/components/ui/Icon";
import { loadViewer } from "@/lib/mapa";
import { BRAND_NAME } from "@/lib/site";

const TITLE = `Acerca de ${BRAND_NAME} · Vigilamos la minería ilegal en la Amazonía`;
const DESCRIPTION = "Cómo detectamos dragas por satélite, cómo llegan las alertas a las ONG y qué decidimos dejar fuera.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/acerca" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "es_PE", siteName: BRAND_NAME, title: TITLE, description: DESCRIPTION, url: "/acerca" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

/** The former landing page, under the console top bar, plus the decisions section for the jury. */
export default async function AcercaPage() {
  const { viewer } = await loadViewer();
  return (
    <>
      <TopBar viewer={viewer} />
      <Hero nav={false} entrarHref="/entrar" />
      <main id="contenido">
        <section className="bg-fondo">
          <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Entrar a {BRAND_NAME} es fácil</h2>
              <p className="mt-2 text-lg text-gris">Inicia sesión con tu número de WhatsApp. Te enviamos un código y listo.</p>
            </div>
            <ButtonLink href="/entrar" className="shrink-0">
              Entrar con WhatsApp <Icon name="arrow" className="size-5" />
            </ButtonLink>
          </div>
        </section>
        <DetectsSection />
        <HowItWorks />
        <MercurySection />
        <DecisionsSection />
        <div className="bg-fondo pt-2">
          <ClosingCta href="/entrar" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
