import Link from "next/link";
import { CondorMark } from "@/components/brand/Logo";
import { BRAND_NAME } from "@/lib/site";
import type { Viewer } from "@/lib/mapa-types";
import "./console.css";

type Props = { viewer?: Viewer; /** Hide the right side (used on /entrar). */ minimal?: boolean };

/** 56 px dark bar shared by /, /entrar and /acerca. Server rendered. */
export function TopBar({ viewer, minimal = false }: Props) {
  return (
    <header className="odc sticky top-0 z-40 h-14 border-b border-(--c-line) bg-(--c-bg)">
      <nav aria-label="Principal" className="mx-auto flex h-full items-center justify-between gap-2 px-3 sm:px-4">
        <Link href="/" className="flex min-h-11 min-w-0 items-center gap-2" aria-label={`${BRAND_NAME}, mapa`}>
          <CondorMark size={36} className="shrink-0 rounded-full bg-white/95" />
          <span className="truncate text-[15px] font-black tracking-tight text-white sm:text-base">{BRAND_NAME}</span>
        </Link>
        {!minimal && (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {viewer?.admin && (
              <Link href="/admin" className="hidden min-h-11 items-center px-2 text-xs font-semibold text-(--c-amber) min-[400px]:flex">
                Admin
              </Link>
            )}
            <Link href="/acerca" className="flex min-h-11 items-center px-2 text-sm font-semibold text-(--c-muted) hover:text-white">
              Acerca
            </Link>
            {viewer?.signedIn ? (
              <Link
                href="/panel"
                className="flex min-h-11 max-w-[170px] items-center gap-2 rounded-full border border-(--c-line) bg-(--c-panel) py-1 pl-3 pr-1 text-sm hover:border-(--c-cyan)"
              >
                {viewer.label && <span className="hidden truncate text-(--c-text) min-[390px]:inline">{viewer.label}</span>}
                <span className="whitespace-nowrap rounded-full bg-(--c-cyan) px-3 py-1.5 text-xs font-bold text-(--c-bg)">Mi panel</span>
              </Link>
            ) : (
              <Link
                href="/entrar"
                className="flex min-h-11 items-center rounded-lg bg-(--c-red) px-4 text-sm font-bold text-white hover:bg-[#c40f20]"
              >
                Entrar
              </Link>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
