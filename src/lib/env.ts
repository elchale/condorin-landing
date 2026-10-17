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
  get waToken() {
    return required("WA_TOKEN");
  },
  get waPhoneNumberId() {
    return required("WA_PHONE_NUMBER_ID");
  },
  get waTemplate() {
    return process.env.WA_TEMPLATE ?? "condorin_codigo";
  },
  get waTemplateLang() {
    return process.env.WA_TEMPLATE_LANG ?? "es";
  },
  get googleClientId() {
    return required("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return required("GOOGLE_CLIENT_SECRET");
  },
};
