import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

// The layout guard keeps the shell from rendering for outsiders. It is not enough on its own
// (layouts do not re-run on client navigation), so each page calls requireAdmin() too.
export default async function PanelLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
