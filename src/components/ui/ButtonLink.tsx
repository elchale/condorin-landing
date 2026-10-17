import Link from "next/link";
import type { ReactNode } from "react";

const VARIANTS = {
  primary: "bg-marca text-white hover:bg-marca-2",
  outline: "bg-white text-tinta ring-2 ring-inset ring-tinta hover:bg-tinta hover:text-white",
} as const;

type Props = {
  href: string;
  variant?: keyof typeof VARIANTS;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ href, variant = "primary", className = "", children }: Props) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-bold transition-colors ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
