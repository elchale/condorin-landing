"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatPhone } from "@/lib/phone";
import { requestCode, verifyCode } from "./api";
import { CodeStep } from "./CodeStep";
import { PhoneStep } from "./PhoneStep";

type Step = "phone" | "code" | "done";

/** Phone number → WhatsApp code → signed in, then to `nextPath` (the member panel by default). */
export function SignInCard({ nextPath = "/panel?bienvenida=1" }: { nextPath?: string } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const sendCode = (rawPhone: string, accepted: boolean) =>
    run(async () => {
      const { phone: normalized } = await requestCode(rawPhone, accepted);
      setPhone(normalized);
      setConsent(accepted);
      setStep("code");
    });

  const enter = (code: string) =>
    run(async () => {
      await verifyCode(code);
      setStep("done");
      router.push(nextPath);
    });

  return (
    <div className="rounded-3xl bg-white p-5 shadow-xl shadow-tinta/5 ring-1 ring-borde sm:p-8">
      <h2 className="text-xl font-bold">{step === "done" ? "Ya estás dentro" : "Inicia sesión"}</h2>

      {step === "phone" && <PhoneStep busy={busy} onSubmit={sendCode} />}
      {step === "code" && (
        <CodeStep
          phone={phone}
          busy={busy}
          onSubmit={enter}
          onResend={() => sendCode(phone, consent)}
          onChangeNumber={() => setStep("phone")}
        />
      )}
      {step === "done" && (
        <p className="mt-4 rounded-2xl bg-exito-claro p-5 text-tinta" role="status">
          Entraste a Ojo de Cóndor con el {formatPhone(phone)}. {nextPath.startsWith("/panel") ? "Te llevamos a tu panel…" : "Te llevamos de vuelta…"}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-marca-claro px-4 py-3 text-sm text-marca-3">
          {error}
        </p>
      )}
    </div>
  );
}
