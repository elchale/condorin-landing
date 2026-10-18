import { fail, sameOrigin } from "@/lib/http";
import { forwardToApi } from "@/lib/proxy";

/** `{}` sends the WhatsApp code; `{code}` confirms the expediente. */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!sameOrigin(req)) return fail("Solicitud no permitida.", 403);
  return forwardToApi(req, `/api/v1/expedientes/${encodeURIComponent((await params).token)}/enviar`);
}
