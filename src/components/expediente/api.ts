import type { ApiError, Patch, Payload } from "./types";

/** Thrown for any non 2xx answer, carrying the API's error envelope. */
export class ExpedienteError extends Error {
  constructor(public status: number, public body: ApiError) {
    super(body.message);
  }
}

const FALLBACK: ApiError = { message: "Algo falló. Inténtalo otra vez.", type: "unknown", field_errors: {} };

async function call<T>(url: string, method: string, body?: unknown): Promise<{ status: number; data: T }> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ExpedienteError(0, { ...FALLBACK, message: "Sin conexión. Revisa tu internet e inténtalo otra vez.", type: "offline" });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ExpedienteError(res.status, data?.type ? data : FALLBACK);
  return { status: res.status, data: data as T };
}

const base = (token: string) => `/api/expedientes/${encodeURIComponent(token)}`;

export const pdfUrl = (token: string) => `${base(token)}?formato=pdf`;

export const loadExpediente = (token: string) => call<Payload>(base(token), "GET").then((r) => r.data);

export const saveExpediente = (token: string, patch: Patch) => call<Payload>(base(token), "PATCH", patch).then((r) => r.data);

export type SendResult =
  | { status: 202; data: { status: "code_sent"; phone_hint: string; expires_in: number } }
  | { status: 200; data: Payload };

/** `{}` asks for the WhatsApp code (202); `{code}` confirms (200 with the final expediente). */
export const sendExpediente = (token: string, code?: string) =>
  call<SendResult["data"]>(`${base(token)}/enviar`, "POST", code ? { code } : {}) as Promise<SendResult>;

export type LinkSignIn = { signedIn: boolean; fresh?: boolean; name?: string; ong?: string };

/** Ask this site to sign in the member the WhatsApp link was sent to. Never throws. */
export async function signInWithLink(token: string): Promise<LinkSignIn> {
  try {
    const res = await fetch("/api/enlace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    return (await res.json()) as LinkSignIn;
  } catch {
    return { signedIn: false };
  }
}
