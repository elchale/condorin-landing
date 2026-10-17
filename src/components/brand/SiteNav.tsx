import Link from "next/link";
import { Logo } from "./Logo";

export function SiteNav() {
  return (
    <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6" aria-label="Principal">
      <Link href="/" aria-label="Condorin, inicio">
        <Logo />
      </Link>
      <Link href="/#entrar" className="rounded-full bg-marca px-4 py-2 text-sm font-bold text-white hover:bg-marca-2">
        Entrar
      </Link>
    </nav>
  );
}
