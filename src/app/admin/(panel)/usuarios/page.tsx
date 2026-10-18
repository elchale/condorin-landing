import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/AdminShell";
import { formatCount, formatDateTime, formatPhone } from "@/components/admin/format";
import { requireAdmin } from "@/lib/admin/guard";
import { listMembers } from "@/lib/admin/members";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Usuarios" };

type Search = Promise<{ q?: string; page?: string }>;

export default async function AdminUsersPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { q = "", page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const { total, rows, pages } = await listMembers({ page, query: q });

  const pageHref = (n: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (n > 1) params.set("page", String(n));
    const query = params.toString();
    return query ? `/admin/usuarios?${query}` : "/admin/usuarios";
  };

  return (
    <>
      <PageHeader title="Usuarios" description="Personas que entraron a Ojo de Cóndor con su número de WhatsApp." />

      <form className="flex gap-2" role="search">
        <label htmlFor="q" className="sr-only">
          Buscar por número
        </label>
        <input
          id="q"
          name="q"
          defaultValue={q}
          inputMode="tel"
          placeholder="Buscar por número"
          className="min-w-0 flex-1 rounded-xl bg-white px-4 py-2.5 ring-1 ring-borde focus:ring-2 focus:ring-marca focus:outline-none"
        />
        <button type="submit" className="rounded-xl bg-tinta px-4 py-2.5 font-semibold text-white hover:bg-tinta-2">
          Buscar
        </button>
      </form>

      <p className="mt-4 text-sm text-gris">
        {formatCount(total)} {total === 1 ? "usuario" : "usuarios"}
        {q ? ` con “${q}”` : ""}
      </p>

      {rows.length === 0 ? (
        <p className="mt-3 rounded-3xl bg-white p-8 text-center text-gris ring-1 ring-borde">No hay usuarios para mostrar.</p>
      ) : (
        <>
          {/* Cards on phones, a table from sm up, so nothing scrolls sideways at 360 px. */}
          <ul className="mt-3 space-y-2 sm:hidden">
            {rows.map((m) => (
              <li key={m.id} className="rounded-2xl bg-white p-4 ring-1 ring-borde">
                <p className="font-bold tabular-nums">{formatPhone(m.phone)}</p>
                <p className="mt-1 text-sm text-gris">Registro: {formatDateTime(m.createdAt)}</p>
                <p className="text-sm text-gris">Última entrada: {formatDateTime(m.lastSignInAt)}</p>
              </li>
            ))}
          </ul>

          <div className="mt-3 hidden overflow-hidden rounded-3xl bg-white ring-1 ring-borde sm:block">
            <table className="w-full text-left text-sm">
              <thead className="bg-fondo text-gris">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">WhatsApp</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Registro</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Última entrada</th>
                  <th scope="col" className="hidden px-5 py-3 font-semibold lg:table-cell">Aceptó términos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="px-5 py-3 font-semibold tabular-nums">
                      <a href={`https://wa.me/${m.phone}`} target="_blank" rel="noreferrer" className="hover:text-marca">
                        {formatPhone(m.phone)}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-gris">{formatDateTime(m.createdAt)}</td>
                    <td className="px-5 py-3 text-gris">{formatDateTime(m.lastSignInAt)}</td>
                    <td className="hidden px-5 py-3 text-gris lg:table-cell">{formatDateTime(m.consentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pages > 1 ? (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-borde">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-gris">
            Página {page} de {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className="rounded-xl bg-white px-4 py-2 font-semibold ring-1 ring-borde">
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </>
  );
}
