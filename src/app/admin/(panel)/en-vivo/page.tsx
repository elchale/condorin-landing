import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/AdminShell";
import { LiveFeed } from "@/components/admin/live/LiveFeed";
import type { ActivityFeed } from "@/lib/admin/activity";
import { requireAdmin } from "@/lib/admin/guard";
import { callApi } from "@/lib/api";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "En vivo" };

type Search = Promise<{ demo?: string }>;

export default async function AdminLivePage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { demo } = await searchParams;
  const demoMode = demo === "1";

  // The first feed comes from the server so the page paints with data; the client polls after that.
  const result = demoMode ? null : await callApi<ActivityFeed>("/api/v1/panel/actividad?limit=20");
  const initial = result?.ok ? result.data : null;

  return (
    <>
      <PageHeader title="En vivo" description="Cada detección del satélite y lo que Ojo de Cóndor decidió, en tiempo real." />
      <LiveFeed initial={initial} demo={demoMode} />
    </>
  );
}
