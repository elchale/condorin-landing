import "server-only";
import { env } from "./env";

export type ApiError = { message: string; type: string; field_errors: Record<string, string[]> };
export type ApiResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; error: ApiError };

type Options = {
  method?: string;
  body?: unknown;
  /** The signed in member; sent with the panel secret so the API knows who is asking. */
  phone?: string;
  /** The visitor's X-Forwarded-For, so the API rate limits each person and not this server. */
  forwardedFor?: string | null;
};

const UNREACHABLE: ApiError = {
  message: "No pudimos conectarnos con Ojo de Cóndor. Inténtalo otra vez en un momento.",
  type: "api_unreachable",
  field_errors: {},
};

/** Panel routes need the shared secret; it is attached for every call that names a member or `panel`. */
export async function callApi<T>(path: string, { method = "GET", body, phone, forwardedFor }: Options = {}): Promise<ApiResult<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (path.startsWith("/api/v1/panel")) headers.Authorization = `Bearer ${env.panelApiSecret}`;
  if (phone) headers["X-Condorin-Phone"] = phone;
  if (forwardedFor) headers["X-Forwarded-For"] = forwardedFor;

  let res: Response;
  try {
    res = await fetch(`${env.apiUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false, status: 503, error: UNREACHABLE };
  }
  const data = await res.json().catch(() => null);
  if (res.ok) return { ok: true, status: res.status, data: data as T };
  return { ok: false, status: res.status, error: data?.type ? (data as ApiError) : { ...UNREACHABLE, type: "unknown" } };
}
