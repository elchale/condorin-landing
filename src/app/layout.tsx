import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Admin only app (admin.condorin.pe): nothing here is meant for search engines or link previews.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: "Panel · Ojo de Cóndor",
  applicationName: "Ojo de Cóndor",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className={geist.variable}>{children}</body>
    </html>
  );
}
