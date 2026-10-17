import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CondorMark } from "@/components/brand/Logo";
import { currentAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Entrar" };

// None of these say whether the account exists or is on the list.
const ERRORS: Record<string, string> = {
  cancelado: "Se canceló la entrada con Google.",
  estado: "El intento venció o empezó en otra pestaña. Vuelve a probar.",
  google: "Google no pudo confirmar la cuenta. Vuelve a probar.",
  permiso: "Esa cuenta no tiene acceso al panel.",
};

/** The only /admin page that answers without a session. It lives outside the (panel) group. */
export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await currentAdmin()) redirect("/admin");
  const { error } = await searchParams;
  const message = error ? ERRORS[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 ring-1 ring-borde">
        <CondorMark size={48} />
        <h1 className="mt-4 text-2xl font-black tracking-tight">Panel de Condorin</h1>
        <p className="mt-1 text-sm text-gris">Entra con tu cuenta de Google autorizada.</p>

        {message ? (
          <p role="alert" className="mt-6 rounded-xl bg-marca-claro px-4 py-3 text-sm text-marca-3">
            {message}
          </p>
        ) : null}

        {/* A plain link: the route handler redirects to Google, so client-side navigation must not intercept it. */}
        <a
          href="/api/admin/oauth/start"
          className="mt-8 flex w-full items-center justify-center rounded-xl bg-marca px-6 py-3.5 font-bold text-white hover:bg-marca-2"
        >
          Entrar con Google
        </a>
      </div>
    </main>
  );
}
