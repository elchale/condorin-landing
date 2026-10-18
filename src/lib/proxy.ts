import "server-only";
import { env } from "./env";

// Headers of the API response the browser needs: the PDF ones and the request id for support.
const PASS_THROUGH = ["content-type", "content-disposition", "cache-control", "x-request-id"];

/**
 * Forwards an expediente call to the Django API as is. The token in the path is the whole auth,
 * so nothing is added except the visitor's address for the API's per person rate limits.
 */
export async function forwardToApi(req: Request, path: string) {
  const search = new URL(req.url).search;
  const headers: Record<string, string> = { Accept: req.headers.get("accept") ?? "application/json" };
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  if (hasBody) headers["Content-Type"] = "application/json";

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}${search}`, {
      method: req.method,
      headers,
      body: hasBody ? await req.text() : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    return Response.json(
      { message: "No pudimos conectarnos con Ojo de Cóndor. Inténtalo otra vez.", type: "api_unreachable", field_errors: {} },
      { status: 503 },
    );
  }
  const out = new Headers();
  for (const name of PASS_THROUGH) {
    const value = res.headers.get(name);
    if (value) out.set(name, value);
  }
  return new Response(res.body, { status: res.status, headers: out });
}
