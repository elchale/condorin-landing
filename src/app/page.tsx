import type { Metadata, Viewport } from "next";
import { KpiStrip } from "@/components/mapa/KpiStrip";
import { MapaConsole } from "@/components/mapa/MapaConsole";
import { MapaWelcome } from "@/components/mapa/MapaWelcome";
import { TopBar } from "@/components/mapa/TopBar";
import { layers, loadMapa, loadViewer } from "@/lib/mapa";
import { BRAND_NAME } from "@/lib/site";

const TITLE = `${BRAND_NAME} · Mapa en vivo de la minería ilegal en la Amazonía`;
const DESCRIPTION =
  "Dragas detectadas por satélite en los ríos de la Amazonía peruana, alertas por WhatsApp a las ONG y expedientes para denunciar.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: { type: "website", locale: "es_PE", siteName: BRAND_NAME, title: TITLE, description: DESCRIPTION, url: "/" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#0b1120" };

/**
 * The map dashboard. Map data (live API, or the bundled snapshot) and the viewer (member and admin
 * cookies, plus the member's panel for their ONG rivers) load in parallel on the server.
 */
export default async function Home({ searchParams }: { searchParams: Promise<{ bienvenida?: string }> }) {
  const [{ mapa, source }, { viewer, welcome }, { bienvenida }] = await Promise.all([loadMapa(), loadViewer(), searchParams]);

  return (
    <div className="odc min-h-dvh">
      <TopBar viewer={viewer} />
      <main>
        <h1 className="sr-only">{TITLE}</h1>
        <MapaConsole
          mapa={mapa}
          layers={layers}
          viewer={viewer}
          kpis={<KpiStrip totals={mapa.totals} generatedAt={mapa.generated_at} live={source === "live"} />}
        />
      </main>
      {bienvenida === "1" && welcome && <MapaWelcome ong={welcome.ong} name={welcome.name} />}
    </div>
  );
}
