import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

const TITLE = "Ojo de Cóndor · Vigilamos la minería ilegal en la Amazonía";
const DESCRIPTION =
  "Dragas y tajos abiertos, detectados por satélite. Te avisamos al instante por WhatsApp.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: "Ojo de Cóndor",
  openGraph: {
    type: "website",
    locale: "es_PE",
    siteName: "Ojo de Cóndor",
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
  },
  // Preview images come from app/opengraph-image.jpg and app/twitter-image.jpg
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
