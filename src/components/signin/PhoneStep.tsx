import Link from "next/link";
import { useState } from "react";
import { field, label, primaryButton, textLink } from "./styles";

type Props = {
  busy: boolean;
  onSubmit: (phone: string, consent: boolean) => void;
};

export function PhoneStep({ busy, onSubmit }: Props) {
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const ready = consent && phone.replace(/\D/g, "").length >= 9;

  return (
    <form onSubmit={(e) => (e.preventDefault(), onSubmit(phone, consent))} className="mt-6 space-y-4">
      <label htmlFor="phone" className={label}>
        Número de celular con WhatsApp
      </label>
      <div className="flex gap-2">
        <span className="flex items-center rounded-xl border border-borde bg-fondo px-3 text-gris">+51</span>
        <input
          id="phone"
          className={field}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="987 654 321"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>

      <label className="flex items-start gap-3 text-sm text-gris">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[#e11d2e]"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
        />
        <span>
          Acepto los{" "}
          <Link href="/terminos" target="_blank" className={textLink}>
            Términos y condiciones
          </Link>{" "}
          y la{" "}
          <Link href="/privacidad" target="_blank" className={textLink}>
            Política de privacidad
          </Link>
          , y autorizo el tratamiento de mis datos para recibir alertas.
        </span>
      </label>

      <button className={primaryButton} disabled={busy || !ready}>
        {busy ? "Enviando código…" : "Enviar código por WhatsApp"}
      </button>
      <p className="text-sm text-gris">Recibirás un código de 6 dígitos por WhatsApp.</p>
    </form>
  );
}
