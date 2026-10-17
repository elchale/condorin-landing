import { Icon, type IconName } from "@/components/ui/Icon";
import { AlertPreview } from "./AlertPreview";

const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "satellite", title: "Revisamos el satélite", text: "Cada nueva imagen de los ríos y bosques de tu región pasa por nuestro sistema." },
  { icon: "scan", title: "Encontramos la actividad", text: "Marcamos posibles dragas y tajos nuevos con su ubicación y la fecha de la imagen." },
  { icon: "bell", title: "Te avisamos por WhatsApp", text: "Si pasa en la zona que elegiste, te llega el aviso con el punto en el mapa." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-4 bg-tinta text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:py-20">
        <div>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">¿Cómo funciona?</h2>
          <ol className="mt-8 space-y-6">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-marca text-white">
                  <Icon name={s.icon} />
                </span>
                <div>
                  <h3 className="text-lg font-bold">
                    {i + 1}. {s.title}
                  </h3>
                  <p className="mt-1 text-white/70">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <AlertPreview />
      </div>
    </section>
  );
}
