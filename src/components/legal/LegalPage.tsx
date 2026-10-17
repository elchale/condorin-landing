import type { ReactNode } from "react";
import { SiteFooter } from "@/components/brand/SiteFooter";
import { SiteNav } from "@/components/brand/SiteNav";
import { LEGAL_UPDATED_AT } from "@/lib/company";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <>
      <header className="bg-white shadow-sm">
        <SiteNav />
      </header>
      <main className="bg-fondo">
        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-gris">Última actualización: {LEGAL_UPDATED_AT}</p>
          <div className="mt-8 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-borde sm:p-10">{children}</div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 pt-4 first:pt-0 [&_li]:ml-5 [&_li]:list-disc [&_p]:leading-relaxed [&_ul]:space-y-1.5">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}
