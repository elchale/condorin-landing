// "Qué decidimos y qué quedó fuera": the honest limits of the product, written for the jury and for partners.

const DECISIONS: { title: string; body: string }[] = [
  {
    title: "Radar gratis, solo en ríos anchos",
    body: "Usamos Sentinel-1 de Copernicus porque ve a través de las nubes y pasa cada 2 a 6 días sobre Madre de Dios (cada 12 en Loreto). Su resolución alcanza para dragas en ríos anchos, no para todo.",
  },
  {
    title: "Las balsas chicas no se ven con datos gratis",
    body: "En ríos de menos de 30 m de ancho una balsa pequeña cabe en uno o dos píxeles del radar gratuito. No la detectamos y preferimos decirlo antes que prometerlo.",
  },
  {
    title: "El siguiente paso es radar pagado",
    body: "Con radar comercial de alta resolución (por ejemplo ICEYE) se ven balsas chicas y se puede revisar un río en menos de un día. Cuesta por escena, así que lo dejamos como mejora para pilotos con financiamiento.",
  },
  {
    title: "Las escenas de la demo son reales, las fechas no",
    body: "Las imágenes del río Malinowski son de Planet, tomadas en 2016 y 2017. En la demo las mostramos con fechas simuladas para recorrer el flujo completo de alerta a expediente.",
  },
  {
    title: "Entrar desde la alerta, con límites",
    body: "El enlace de la alerta de WhatsApp inicia sesión por 7 días y nunca reemplaza una sesión abierta. Los bots que generan vistas previas no lo activan.",
  },
  {
    title: "Sin cola de tareas",
    body: "Las alertas salen con on_commit y un hilo en el mismo servidor. Para el volumen de hoy alcanza; una cola real llega cuando haya más ríos y más ONG.",
  },
  {
    title: "Un solo dueño del esquema",
    body: "Django es dueño de la base de datos y de todas las migraciones. Esta web solo mapea dos tablas (miembros y administradores) y pide todo lo demás a la API.",
  },
];

export function DecisionsSection() {
  return (
    <section id="decisiones" className="scroll-mt-16 bg-fondo">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
        <p className="text-sm font-bold uppercase tracking-widest text-marca">Para el jurado y los aliados</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Qué decidimos y qué quedó fuera</h2>
        <p className="mt-3 max-w-2xl text-lg text-gris">Lo que el sistema hace hoy, lo que no puede hacer con datos gratuitos y por qué tomamos cada decisión.</p>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {DECISIONS.map((d, i) => (
            <li key={d.title} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-borde">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tinta text-sm font-bold text-white tabular-nums">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="font-bold">{d.title}</h3>
                <p className="mt-1 text-[15px] text-gris">{d.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
