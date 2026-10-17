import Image from "next/image";
import dredge from "../../../public/img/draga.jpg";
import openPit from "../../../public/img/tajo.jpg";

const TARGETS = [
  {
    img: dredge,
    alt: "Draga minera de madera y metal trabajando en la orilla del río Madre de Dios",
    title: "Dragas y balsas en los ríos",
    text: "Embarcaciones pequeñas que succionan el lecho del río para separar el oro. El radar satelital las distingue sobre el agua incluso con nubes, de día o de noche.",
  },
  {
    img: openPit,
    alt: "Imagen satelital de La Pampa, Madre de Dios: grandes manchas de bosque destruido y pozas mineras junto al río",
    title: "Minería de tajo abierto",
    text: "Bosque removido, pozas y suelo expuesto que aparecen de una semana a otra. Comparamos imágenes recientes para encontrar cada nuevo frente minero.",
  },
];

export function DetectsSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
      <h2 className="text-3xl font-black tracking-tight sm:text-4xl">¿Qué detecta Condorin?</h2>
      <p className="mt-3 max-w-2xl text-lg text-gris">Dos formas de minería ilegal de oro que dejan huella visible desde el espacio.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {TARGETS.map((t) => (
          <article key={t.title} className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-tinta/5 ring-1 ring-borde">
            <div className="relative aspect-[16/10]">
              <Image src={t.img} alt={t.alt} fill placeholder="blur" sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div className="p-6">
              <h3 className="text-2xl font-bold">{t.title}</h3>
              <p className="mt-2 text-gris">{t.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
