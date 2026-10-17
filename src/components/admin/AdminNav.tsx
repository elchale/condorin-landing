"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { ADMIN_SECTIONS } from "@/lib/admin/sections";

/** Horizontal scrollable tabs on phones, a vertical list from md up. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
      <ul className="flex gap-1 md:flex-col">
        {ADMIN_SECTIONS.map(({ href, label, icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold ${
                  active ? "bg-marca-claro text-marca-3" : "text-tinta-2 hover:bg-fondo"
                }`}
              >
                <Icon name={icon} className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
