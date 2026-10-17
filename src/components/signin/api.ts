async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Algo falló. Inténtalo otra vez.");
  return data as T;
}

export const requestCode = (phone: string, consent: boolean) =>
  post<{ phone: string }>("/api/otp/send", { phone, consent });

export const verifyCode = (code: string) => post<{ ok: true }>("/api/otp/verify", { code });
