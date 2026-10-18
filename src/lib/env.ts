import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}

/** Read lazily so `next build` works without secrets; each getter throws on first real use. */
export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  get otpSecret() {
    return required("OTP_SECRET");
  },
  get googleClientId() {
    return required("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return required("GOOGLE_CLIENT_SECRET");
  },
  // The Django API (condorin-backend). Only this server talks to it (the /admin/en-vivo feed).
  get apiUrl() {
    return (process.env.CONDORIN_API_URL ?? "https://api.condorin.pe").replace(/\/$/, "");
  },
  get panelApiSecret() {
    return required("PANEL_API_SECRET");
  },
};
