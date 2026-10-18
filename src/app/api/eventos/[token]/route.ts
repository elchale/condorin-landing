import { forwardToApi } from "@/lib/proxy";

/** The event page payload: read only, it never opens the expediente. */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  return forwardToApi(req, `/api/v1/eventos/${encodeURIComponent((await params).token)}`);
}
