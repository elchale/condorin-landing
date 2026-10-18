import Link from "next/link";
import { PageHeader } from "@/components/admin/AdminShell";
import { formatCount } from "@/components/admin/format";
import { Icon } from "@/components/ui/Icon";
import { requireAdmin } from "@/lib/admin/guard";
import { memberStats } from "@/lib/admin/members";
import { ADMIN_SECTIONS } from "@/lib/admin/sections";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();
  const stats = await memberStats();

  const cards = [
    { label: "Usuarios", value: stats.total },
    { label: "Nuevos en 7 días", value: stats.newThisWeek },
    { label: "Entraron en 7 días", value: stats.activeThisWeek },
  ];

  return (
    <>
      <PageHeader title="Resumen" description="Lo principal de Ojo de Cóndor en un vistazo." />

      <dl className="grid gap-3 sm:grid-cols-3">
        {cards.map(({ label, value }) => (
          <div key={label} className="rounded-3xl bg-white p-5 ring-1 ring-borde">
            <dt className="text-sm text-gris">{label}</dt>
            <dd className="mt-1 text-3xl font-black tabular-nums">{formatCount(value)}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mt-10 text-lg font-bold">Secciones</h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {ADMIN_SECTIONS.filter((s) => s.href !== "/admin").map(({ href, label, description, icon }) => (
          <li key={href}>
            <Link href={href} className="flex items-start gap-3 rounded-3xl bg-white p-5 ring-1 ring-borde hover:ring-marca">
              <Icon name={icon} className="mt-0.5 size-6 shrink-0 text-marca" />
              <span>
                <span className="block font-bold">{label}</span>
                <span className="block text-sm text-gris">{description}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
