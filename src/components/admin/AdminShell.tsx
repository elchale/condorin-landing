import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";
import type { CurrentAdmin } from "@/lib/admin/guard";
import { AdminNav } from "./AdminNav";

export function AdminShell({ admin, children }: { admin: CurrentAdmin; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl md:flex md:gap-8 md:px-6 md:py-6">
      <aside className="bg-white px-4 pb-3 pt-4 shadow-sm md:sticky md:top-6 md:h-fit md:w-60 md:shrink-0 md:rounded-3xl md:p-5 md:shadow-none md:ring-1 md:ring-borde">
        <div className="flex items-center justify-between gap-3 md:block">
          <Link href="/admin" aria-label="Panel, resumen">
            <Logo />
          </Link>
          <form action="/api/admin/logout" method="post" className="md:hidden">
            <button type="submit" className="flex items-center gap-1 text-sm font-semibold text-gris hover:text-tinta">
              <Icon name="logout" className="size-5" />
              Salir
            </button>
          </form>
        </div>

        <div className="mt-4 md:mt-6">
          <AdminNav />
        </div>

        <div className="mt-6 hidden border-t border-borde pt-4 md:block">
          <p className="truncate text-sm font-semibold">{admin.name || admin.email}</p>
          <p className="truncate text-xs text-gris">{admin.email}</p>
          <form action="/api/admin/logout" method="post" className="mt-3">
            <button type="submit" className="flex items-center gap-1 text-sm font-semibold text-gris hover:text-tinta">
              <Icon name="logout" className="size-5" />
              Salir
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-0 md:py-0">{children}</main>
    </div>
  );
}

export function PageHeader({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
      {description ? <p className="mt-1 text-gris">{description}</p> : null}
    </header>
  );
}
