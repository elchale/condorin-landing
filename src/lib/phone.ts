/** Digits only, with country code. Peruvian mobiles typed without it get 51. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (/^9\d{8}$/.test(digits)) return `51${digits}`;
  if (/^\d{10,15}$/.test(digits)) return digits;
  return null;
}

/** "51987654321" → "+51 987 654 321" */
export function formatPhone(phone: string): string {
  return `+${phone.slice(0, 2)} ${phone.slice(2).replace(/(\d{3})(?=\d)/g, "$1 ")}`;
}
