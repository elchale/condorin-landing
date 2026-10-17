import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { field, label, primaryButton, textLink } from "./styles";

type Props = {
  phone: string;
  busy: boolean;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onChangeNumber: () => void;
};

export function CodeStep({ phone, busy, onSubmit, onResend, onChangeNumber }: Props) {
  const [code, setCode] = useState("");

  return (
    <form onSubmit={(e) => (e.preventDefault(), onSubmit(code))} className="mt-6 space-y-4">
      <label htmlFor="code" className={label}>
        Ingresa el código enviado al {formatPhone(phone)}
      </label>
      <input
        id="code"
        className={`${field} text-center text-2xl tracking-[0.5em]`}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        autoFocus
        required
      />
      <button className={primaryButton} disabled={busy || code.length !== 6}>
        {busy ? "Verificando…" : "Entrar"}
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" className={textLink} onClick={onChangeNumber}>
          Cambiar número
        </button>
        <button type="button" className={textLink} onClick={onResend} disabled={busy}>
          Enviar otro código
        </button>
      </div>
    </form>
  );
}
