import { fail, sameOrigin } from "@/lib/http";
import { forwardToApi } from "@/lib/proxy";

type Ctx = { params: Promise<{ token: string }> };

const path = async (ctx: Ctx) => `/api/v1/expedientes/${encodeURIComponent((await ctx.params).token)}`;

/** The expediente payload, or the PDF with ?formato=pdf. */
export async function GET(req: Request, ctx: Ctx) {
  return forwardToApi(req, await path(ctx));
}

/** Autosave, filings and reopen. */
export async function PATCH(req: Request, ctx: Ctx) {
  if (!sameOrigin(req)) return fail("Solicitud no permitida.", 403);
  return forwardToApi(req, await path(ctx));
}
