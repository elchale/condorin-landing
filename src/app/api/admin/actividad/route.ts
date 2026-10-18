import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin/guard";
import type { ActivityFeed } from "@/lib/admin/activity";
import { callApi } from "@/lib/api";

export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Live feed for /admin/en-vivo. Proxies the panel API so the shared secret never reaches the browser. */
export async function GET() {
  if (!(await currentAdmin())) {
    return NextResponse.json(
      { message: "Inicia sesión como administrador.", type: "unauthorized", field_errors: {} },
      { status: 401, headers: NO_STORE },
    );
  }

  const result = await callApi<ActivityFeed>("/api/v1/panel/actividad?limit=20");
  if (result.ok) return NextResponse.json(result.data, { headers: NO_STORE });
  return NextResponse.json(result.error, { status: result.status, headers: NO_STORE });
}
