import type { Metadata } from "next";
import { IncidentCard } from "@/components/panel/IncidentCard";
import { PanelShell } from "@/components/panel/PanelShell";
import { PanelTotals } from "@/components/panel/PanelTotals";
import { loadPanel } from "@/lib/panel";
import { requirePhone } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mi panel · Condorin", robots: { index: false, follow: false } };

export default async function PanelPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const phone = await requirePhone();
  const [result, { error }] = await Promise.all([loadPanel(phone), searchParams]);

  if (!result.ok) {
    return (
      <PanelShell>
        <p role="alert" className="rounded-2xl bg-marca-claro p-5 text-marca-3">
          {result.error.message}
        </p>
      </PanelShell>
    );
  }

  const { member, ong, totals, incidents } = result.data;
  return (
    <PanelShell member={member} ongName={ong.name}>
      <header>
        <p className="text-sm font-semibold text-gris">{ong.name}</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
          {member.name ? `Hola, ${member.name.split(" ")[0]}` : "Hola"}
        </h1>
        <p className="mt-2 text-gris">
          {ong.rivers.length
            ? `Tu ONG vigila ${ong.rivers.map((r) => `el río ${r.name}`).join(", ")}. Aquí están las detecciones y lo que puedes hacer con cada una.`
            : "Tu ONG todavía no vigila ningún río."}
        </p>
      </header>

      {member.joined_now && (
        <p className="mt-6 rounded-2xl bg-exito-claro p-4 text-sm text-tinta" role="status">
          Te uniste a {ong.name}. Desde ahora también te llegarán sus alertas por WhatsApp.
        </p>
      )}
      {error === "expediente" && (
        <p role="alert" className="mt-6 rounded-2xl bg-marca-claro p-4 text-sm text-marca-3">
          No pudimos abrir ese expediente. Inténtalo otra vez.
        </p>
      )}

      <PanelTotals totals={totals} />

      <h2 className="mt-10 text-lg font-bold">Detecciones</h2>
      {incidents.length ? (
        <ul className="mt-3 grid gap-4 lg:grid-cols-2">
          {incidents.map((incident) => (
            <li key={incident.id} className="min-w-0">
              <IncidentCard incident={incident} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 rounded-3xl bg-white p-6 text-gris ring-1 ring-borde">
          Todavía no hay detecciones en los ríos de tu ONG. Te avisaremos por WhatsApp apenas aparezca una.
        </p>
      )}
    </PanelShell>
  );
}
