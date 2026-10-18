import Link from "next/link";
import type { ReactNode } from "react";
import { formatPhone } from "@/components/admin/format";
import { Logo } from "@/components/brand/Logo";
import { Icon } from "@/components/ui/Icon";

type Props = { member?: { name: string; phone: string }; ongName?: string; children: ReactNode };

/** Header and frame of the member pages: /panel and the expediente page when signed in. */
export function PanelShell({ member, ongName, children }: Props) {
  return (
    <div className="min-h-dvh bg-fondo">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/panel" aria-label="Mi panel">
            <Logo />
          </Link>
          <div className="flex min-w-0 items-center gap-4">
            {member && (
              <p className="hidden min-w-0 text-right text-sm sm:block">
                <span className="block truncate font-semibold">{member.name || formatPhone(member.phone)}</span>
                {ongName && <span className="block truncate text-gris">{ongName}</span>}
              </p>
            )}
            <form action="/api/salir" method="post">
              <button type="submit" className="flex items-center gap-1 text-sm font-semibold text-gris hover:text-tinta">
                <Icon name="logout" className="size-5" />
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>
    </div>
  );
}
