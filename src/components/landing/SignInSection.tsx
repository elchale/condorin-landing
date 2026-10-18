import { SignInCard } from "@/components/signin/SignInCard";

export function SignInSection() {
  return (
    <section id="entrar" className="scroll-mt-4 bg-fondo">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-16 lg:py-20 [&>*]:min-w-0">
        <div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Entrar a Ojo de Cóndor es fácil</h2>
          <p className="mt-3 text-lg text-gris">Inicia sesión con tu número de WhatsApp. Te enviamos un código y listo.</p>
        </div>
        <SignInCard />
      </div>
    </section>
  );
}
