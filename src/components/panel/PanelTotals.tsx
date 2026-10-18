import type { Panel } from "@/lib/panel";

export function PanelTotals({ totals }: { totals: Panel["totals"] }) {
  const cards = [
    { label: "Sin expediente", value: totals.without_expediente, tone: "text-marca" },
    { label: "En borrador", value: totals.draft, tone: "text-naranja" },
    { label: "Listos para presentar", value: totals.ready, tone: "text-tinta" },
    { label: "Presentados", value: totals.filed, tone: "text-exito" },
  ];
  return (
    <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map(({ label, value, tone }) => (
        <div key={label} className="rounded-3xl bg-white p-4 ring-1 ring-borde sm:p-5">
          <dt className="text-sm text-gris">{label}</dt>
          <dd className={`mt-1 text-3xl font-black tabular-nums ${tone}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
