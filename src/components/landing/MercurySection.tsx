import { Icon } from "@/components/ui/Icon";

export function MercurySection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div>
          <span className="flex size-12 items-center justify-center rounded-2xl bg-marca-claro text-marca">
            <Icon name="drop" />
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">El problema es el mercurio</h2>
          <div className="mt-5 space-y-4 text-lg text-gris">
            <p>La minería ilegal usa mercurio para juntar las partículas finas de oro en pepitas. Una parte termina en el río, en el aire y en el suelo.</p>
            <p>En el agua pasa a los peces, y de ellos a las familias que se alimentan del río. Los niños y las mujeres embarazadas son los más afectados.</p>
            <p className="font-medium text-tinta">Encontrar una draga a tiempo permite actuar antes de que el daño se extienda río abajo.</p>
          </div>
        </div>
        <aside className="rounded-3xl bg-naranja-claro p-6 sm:p-8">
          <h3 className="text-xl font-bold">¿Viste una draga o una zona minera?</h3>
          <p className="mt-2">
            Denúnciala ante la fiscalía ambiental o la autoridad ambiental de tu región. Ojo de Cóndor te ayuda a vigilar, pero no reemplaza la denuncia oficial.
          </p>
        </aside>
      </div>
    </section>
  );
}
