import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/mapa/TopBar";
import { SignInCard } from "@/components/signin/SignInCard";
import { safeNextPath } from "@/lib/next-path";
import { currentPhone } from "@/lib/session";
import { BRAND_NAME } from "@/lib/site";

const TITLE = `Entrar · ${BRAND_NAME}`;
const DESCRIPTION = "Entra con tu número de WhatsApp para recibir alertas de tus ríos y armar expedientes.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: true },
  openGraph: { type: "website", locale: "es_PE", siteName: BRAND_NAME, title: TITLE, description: DESCRIPTION, url: "/entrar" },
};

export const viewport: Viewport = { themeColor: "#0b1120" };

/** WhatsApp sign in. Afterwards: back to `next` when it is a same site path, else the map with the welcome overlay. */
export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const [{ next }, phone] = await Promise.all([searchParams, currentPhone()]);
  const back = safeNextPath(Array.isArray(next) ? next[0] : next, "");
  if (phone) redirect(back || "/");

  return (
    <div className="odc min-h-dvh">
      <TopBar minimal />
      <main className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14 lg:py-16 [&>*]:min-w-0">
        <div>
          <p className="odc-label">Acceso para ONG y comunidades</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Entra con tu WhatsApp</h1>
          <p className="mt-3 text-(--c-muted)">
            Te enviamos un código de 6 dígitos. Con tu cuenta ves las detecciones de los ríos de tu ONG, recibes las alertas por WhatsApp y
            preparas el expediente para denunciar ante la FEMA o el OEFA.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-(--c-text)">
            <li className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--c-cyan)" aria-hidden />
              Sin contraseña: tu número es tu cuenta.
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-(--c-cyan)" aria-hidden />
              No compartimos tu número con nadie.
            </li>
          </ul>
          <Link href="/" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-(--c-cyan) underline underline-offset-4">
            Volver al mapa
          </Link>
        </div>
        {/* The card keeps its light style; reset the console text color inside it. */}
        <div className="text-tinta">
          <SignInCard nextPath={back || "/?bienvenida=1"} />
        </div>
      </main>
    </div>
  );
}
