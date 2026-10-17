import "server-only";
import { env } from "./env";

const GRAPH = "https://graph.facebook.com/v23.0";

/**
 * Sends the AUTHENTICATION template (default `condorin_codigo`) with a one-time code.
 * Auth templates take the code twice: once for the body, once for the copy-code button.
 * A 200 only means Meta accepted the message, not that it was delivered.
 */
export async function sendCode(phone: string, code: string): Promise<void> {
  const res = await fetch(`${GRAPH}/${env.waPhoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.waToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: env.waTemplate,
        language: { code: env.waTemplateLang },
        components: [
          { type: "body", parameters: [{ type: "text", text: code }] },
          { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] },
        ],
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("whatsapp send failed", res.status, JSON.stringify(data?.error ?? data));
    throw new Error(data?.error?.message ?? `HTTP ${res.status}`);
  }
}
