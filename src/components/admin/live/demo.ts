/**
 * Demo mode for /admin/en-vivo (?demo=1): a small simulated world that produces ActivityFeeds with the
 * same shape and wording as the backend. A scene arrives about every 12 s and the alerted ones advance
 * over time (alerts sent, expediente opened, confirmed, filed), so an audience can watch decisions move.
 *
 * DEMO ONLY, not real data. Every ONG, member, phone ending, river and scene below is made up, runs
 * only in the browser, and never touches the API. Only used when the page runs with ?demo=1, where
 * the status bar says "Demostración, datos simulados".
 */
import type {
  ActivityAlert,
  ActivityDetection,
  ActivityEvent,
  ActivityFeed,
  ActivityOng,
  ActivityStep,
  StepKey,
} from "@/lib/admin/activity";

export const DEMO_THRESHOLD = 0.5;
export const DEMO_INTERVAL_MS = 12_000;
const MAX_EVENTS = 20;

/** When each step happens, in ms after the scene arrives. */
const T = { alerts: 3_000, opened: 16_000, expediente: 30_000, filed: 46_000 } as const;

type Member = { name: string; phone: string };
type Ong = { id: number; name: string; members: Member[] };
type River = {
  slug: string;
  name: string;
  protected_area: string;
  lat: number;
  lon: number;
  ongs: Ong[];
  authorities: string[];
};

const AMAZONIA_VIVA: Ong = {
  id: 3,
  name: "Amazonía Viva",
  members: [
    { name: "Rosa Huamán", phone: "808" },
    { name: "Jorge Tapullima", phone: "512" },
  ],
};
const DEFENSORES_NANAY: Ong = {
  id: 7,
  name: "Defensores del Nanay",
  members: [
    { name: "Lucía Pacaya", phone: "274" },
    { name: "Wilder Ahuanari", phone: "931" },
    { name: "Elsa Murayari", phone: "406" },
  ],
};
const GUARDIANES_YAGUAS: Ong = {
  id: 11,
  name: "Guardianes del Yaguas",
  members: [
    { name: "Teodoro Ríos", phone: "157" },
    { name: "Marina Coquinche", phone: "683" },
    { name: "Ever Yaicate", phone: "320" },
  ],
};
const RED_MADRE_DE_DIOS: Ong = {
  id: 5,
  name: "Red Madre de Dios",
  members: [
    { name: "Carmen Quispe", phone: "745" },
    { name: "Hugo Mamani", phone: "062" },
    { name: "Nilda Condori", phone: "519" },
  ],
};
const VIGILANTES_TAMBOPATA: Ong = {
  id: 9,
  name: "Vigilantes de Tambopata",
  members: [
    { name: "Raúl Huayllani", phone: "388" },
    { name: "Sonia Ccahuana", phone: "947" },
  ],
};

const RIVERS: River[] = [
  {
    slug: "yaguas",
    name: "Yaguas",
    protected_area: "Parque Nacional Yaguas",
    lat: -2.618,
    lon: -71.352,
    ongs: [GUARDIANES_YAGUAS, AMAZONIA_VIVA],
    authorities: ["FEMA Loreto", "SERNANP"],
  },
  {
    slug: "nanay",
    name: "Nanay",
    protected_area: "Reserva Nacional Allpahuayo Mishana",
    lat: -3.874,
    lon: -73.518,
    ongs: [AMAZONIA_VIVA, DEFENSORES_NANAY],
    authorities: ["FEMA Loreto", "SERNANP"],
  },
  {
    slug: "madre-de-dios",
    name: "Madre de Dios",
    protected_area: "",
    lat: -12.704,
    lon: -69.642,
    ongs: [RED_MADRE_DE_DIOS],
    authorities: ["FEMA Madre de Dios", "OEFA"],
  },
  {
    slug: "malinowski",
    name: "Malinowski",
    protected_area: "Reserva Nacional Tambopata",
    lat: -13.018,
    lon: -69.951,
    ongs: [VIGILANTES_TAMBOPATA, RED_MADRE_DE_DIOS],
    authorities: ["FEMA Madre de Dios", "SERNANP"],
  },
  {
    slug: "inambari",
    name: "Inambari",
    protected_area: "",
    lat: -13.104,
    lon: -70.388,
    ongs: [],
    authorities: ["FEMA Madre de Dios", "OEFA"],
  },
];

type Reach = "alerts" | "opened" | "expediente" | "filed";

type Seed = {
  id: number;
  river: River;
  receivedAt: number;
  capturedAt: number;
  satellite: string;
  confidences: number[];
  offsets: [number, number][];
  /** How far this scene will get if it alerts. */
  reach: Reach;
  /** Index of a member whose WhatsApp fails, or -1. */
  failedAlert: number;
  folio: number;
  receipt: string;
};

/** Small seeded generator so a seed always yields the same scene. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The first scenes follow a script so the demo shows every kind of decision early. */
const SCRIPT: { river: string; confidences: number[]; reach: Reach }[] = [
  { river: "madre-de-dios", confidences: [0.91, 0.64], reach: "filed" },
  { river: "inambari", confidences: [0.78], reach: "filed" },
  { river: "malinowski", confidences: [0.42, 0.31], reach: "filed" },
  { river: "nanay", confidences: [0.87, 0.58, 0.36], reach: "expediente" },
  { river: "yaguas", confidences: [0.93, 0.71], reach: "filed" },
  { river: "madre-de-dios", confidences: [0.47], reach: "filed" },
  { river: "malinowski", confidences: [0.82, 0.69, 0.55], reach: "opened" },
  { river: "nanay", confidences: [0.62], reach: "filed" },
];

const LIMA_DATE = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Lima",
});

const iso = (ms: number | null) => (ms === null ? null : new Date(ms).toISOString());
const pct = (x: number) => `${Math.round(x * 100)}%`;
const folioOf = (n: number) => `CND-2026-${String(n).padStart(5, "0")}`;
const listJoin = (items: string[]) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;

export class DemoWorld {
  private seeds: Seed[] = [];
  private nextId = 1041;
  private nextFolio = 8;
  private nextAt: number;

  constructor(now: number) {
    // A short history, already advanced, so the list is not empty when the demo opens.
    for (const ago of [190_000, 130_000, 75_000]) this.add(now - ago);
    this.nextAt = now + 6_000;
  }

  private add(receivedAt: number) {
    const id = this.nextId++;
    const n = this.seeds.length;
    const rand = prng(id * 7919);
    const scripted = SCRIPT[n];

    const river = scripted ? RIVERS.find((r) => r.slug === scripted.river)! : RIVERS[Math.floor(rand() * RIVERS.length)];
    const count = scripted ? scripted.confidences.length : 1 + Math.floor(rand() * 3);
    const confidences = scripted
      ? scripted.confidences
      : Array.from({ length: count }, () => Math.round((0.22 + rand() * 0.74) * 100) / 100).sort((a, b) => b - a);
    const reaches: Reach[] = ["alerts", "opened", "expediente", "filed", "filed", "filed"];
    const reach = scripted ? scripted.reach : reaches[Math.floor(rand() * reaches.length)];
    const alerting = confidences.some((c) => c >= DEMO_THRESHOLD) && river.ongs.length > 0;
    const confirms = alerting && (reach === "expediente" || reach === "filed");

    this.seeds.push({
      id,
      river,
      receivedAt,
      capturedAt: receivedAt - (2 + Math.floor(rand() * 9)) * 3_600_000 - Math.floor(rand() * 3_600_000),
      satellite: rand() < 0.65 ? "Sentinel-2" : "Sentinel-1",
      confidences,
      offsets: confidences.map(() => [(rand() - 0.5) * 0.16, (rand() - 0.5) * 0.16]),
      reach,
      failedAlert: rand() < 0.25 ? 1 : -1,
      folio: confirms ? this.nextFolio++ : 0,
      receipt: `2026-${String(10_000 + Math.floor(rand() * 89_999))}`,
    });
    if (this.seeds.length > MAX_EVENTS) this.seeds.shift();
  }

  /** The feed as the API would return it at `now`, adding any scene that is due. */
  feed(now: number): ActivityFeed {
    // After a long pause (tab in background) catch up with at most two scenes, not a flood.
    if (now - this.nextAt > 2 * DEMO_INTERVAL_MS) this.nextAt = now - DEMO_INTERVAL_MS;
    while (now >= this.nextAt) {
      this.add(this.nextAt);
      this.nextAt += DEMO_INTERVAL_MS;
    }
    return {
      generated_at: new Date(now).toISOString(),
      threshold: DEMO_THRESHOLD,
      events: this.seeds
        .filter((s) => s.receivedAt <= now)
        .map((s) => buildEvent(s, now))
        .reverse(),
    };
  }
}

function buildEvent(s: Seed, now: number): ActivityEvent {
  const { river } = s;
  const at = (offset: number) => (now >= s.receivedAt + offset ? s.receivedAt + offset : null);

  const detections: ActivityDetection[] = s.confidences.map((confidence, i) => ({
    index: i + 1,
    lat: (river.lat + s.offsets[i][0]).toFixed(5),
    lon: (river.lon + s.offsets[i][1]).toFixed(5),
    confidence,
    alerting: confidence >= DEMO_THRESHOLD,
    crop_url: null,
    pinned: confidence >= DEMO_THRESHOLD,
  }));
  const hits = detections.filter((d) => d.alerting).length;
  const decision: ActivityEvent["decision"] = hits === 0 ? "below_threshold" : river.ongs.length === 0 ? "no_watchers" : "alerted";
  const alerted = decision === "alerted";

  const order: Reach[] = ["alerts", "opened", "expediente", "filed"];
  const reaches = (r: Reach) => alerted && order.indexOf(s.reach) >= order.indexOf(r);
  const sentAt = alerted ? at(T.alerts) : null;
  const openedAt = reaches("opened") ? at(T.opened) : null;
  const confirmedAt = reaches("expediente") ? at(T.expediente) : null;
  const filedAt = reaches("filed") ? at(T.filed) : null;

  // The first member of the first ONG is the one who opens the expediente.
  const opener = river.ongs[0]?.members[0]?.name ?? "";
  let memberIndex = 0;
  const ongs: ActivityOng[] = alerted
    ? river.ongs.map((ong, o) => {
        const alerts: ActivityAlert[] = ong.members.map((m, i) => {
          const failed = memberIndex++ === s.failedAlert;
          return {
            member: m.name,
            phone_hint: `+51 *** *** ${m.phone}`,
            status: sentAt === null ? "pending" : failed ? "failed" : "sent",
            sent_at: failed ? null : iso(sentAt),
            opened_at: o === 0 && i === 0 ? iso(openedAt) : null,
          };
        });
        const expediente: ActivityOng["expediente"] =
          o !== 0 || openedAt === null
            ? null
            : {
                status: filedAt !== null ? "filed" : confirmedAt !== null ? "ready" : "draft",
                status_label: filedAt !== null ? "Presentado" : confirmedAt !== null ? "Listo para presentar" : "Borrador",
                folio: confirmedAt !== null ? folioOf(s.folio) : null,
                authorities: confirmedAt !== null ? river.authorities : [],
                filings:
                  filedAt !== null
                    ? [{ authority: river.authorities[0], receipt_number: s.receipt, filed_at: iso(filedAt)! }]
                    : [],
                finalized_at: iso(confirmedAt),
              };
        return { id: ong.id, name: ong.name, members: ong.members.length, alerts, expediente };
      })
    : [];

  const members = river.ongs.reduce((sum, o) => sum + o.members.length, 0);
  const failed = ongs.flatMap((o) => o.alerts).filter((a) => a.status === "failed").length;
  const top = Math.max(...s.confidences);
  const where = `el río ${river.name}`;

  const step = (key: StepKey, label: string, detail: string, state: ActivityStep["state"], when: number | null): ActivityStep => ({
    key,
    label,
    detail,
    state,
    at: state === "done" || state === "failed" ? iso(when) : null,
  });

  const total = detections.length;
  const detectionsDetail =
    total === 1
      ? hits
        ? `La única detección supera el umbral de ${pct(DEMO_THRESHOLD)} (${pct(top)}).`
        : `La única detección no supera el umbral de ${pct(DEMO_THRESHOLD)} (${pct(top)}).`
      : hits === 0
        ? `Ninguna de las ${total} detecciones supera el umbral de ${pct(DEMO_THRESHOLD)} (la más alta, ${pct(top)}).`
        : `${hits} de ${total} detecciones ${hits === 1 ? "supera" : "superan"} el umbral de ${pct(DEMO_THRESHOLD)} (la más alta, ${pct(top)}).`;

  const notAlerted =
    decision === "below_threshold"
      ? "No aplica porque ninguna detección supera el umbral."
      : "No aplica porque ninguna ONG vigila este río todavía.";

  const steps: ActivityStep[] = [
    step(
      "received",
      "Imagen recibida",
      `Llegó una escena de ${s.satellite} captada el ${LIMA_DATE.format(s.capturedAt)} sobre ${where}.`,
      "done",
      s.receivedAt,
    ),
    step("detections", "Detecciones evaluadas", detectionsDetail, "done", s.receivedAt + 400),
    hits
      ? step(
          "evidence",
          "Evidencia fijada",
          `La escena y ${hits === 1 ? "1 recorte quedaron guardados" : `${hits} recortes quedaron guardados`} con su huella SHA-256, para que nadie pueda alterarlos.`,
          "done",
          s.receivedAt + 900,
        )
      : step("evidence", "Evidencia fijada", "No se fija evidencia porque ninguna detección supera el umbral.", "skipped", null),
    decision === "alerted"
      ? step(
          "routing",
          "ONG que vigilan el río",
          river.ongs.length === 1
            ? `Lo vigila 1 ONG: ${river.ongs[0].name} (${members} miembros).`
            : `Lo vigilan ${river.ongs.length} ONG: ${listJoin(river.ongs.map((o) => o.name))} (${members} miembros).`,
          "done",
          s.receivedAt + 1_400,
        )
      : decision === "no_watchers"
        ? step("routing", "ONG que vigilan el río", `Ninguna ONG vigila ${where} todavía, así que nadie recibe la alerta.`, "skipped", null)
        : step("routing", "ONG que vigilan el río", "No se busca a quién avisar porque la confianza es baja.", "skipped", null),
    !alerted
      ? step("alerts", "Alertas por WhatsApp", notAlerted, "skipped", null)
      : sentAt === null
        ? step("alerts", "Alertas por WhatsApp", `Enviando la alerta por WhatsApp a ${members} miembros.`, "pending", null)
        : failed === members
          ? step("alerts", "Alertas por WhatsApp", "Ningún mensaje de WhatsApp pudo entregarse.", "failed", sentAt)
          : step(
              "alerts",
              "Alertas por WhatsApp",
              failed
                ? `Se avisó por WhatsApp a ${members - failed} de ${members} miembros; ${failed === 1 ? "1 mensaje falló" : `${failed} mensajes fallaron`}.`
                : `Se avisó por WhatsApp a los ${members} miembros.`,
              "done",
              sentAt,
            ),
    !alerted
      ? step("opened", "Expediente abierto", notAlerted, "skipped", null)
      : openedAt === null
        ? step("opened", "Expediente abierto", "Esperando que algún miembro toque Crear expediente en la alerta.", "pending", null)
        : step("opened", "Expediente abierto", `${opener}, de ${river.ongs[0].name}, tocó Crear expediente.`, "done", openedAt),
    !alerted
      ? step("expediente", "Expediente confirmado", notAlerted, "skipped", null)
      : confirmedAt === null
        ? step("expediente", "Expediente confirmado", "Falta confirmarlo con el código de WhatsApp para generar el folio y el PDF.", "pending", null)
        : step(
            "expediente",
            "Expediente confirmado",
            `${opener} lo confirmó con su código, así que el folio ${folioOf(s.folio)} y su PDF quedaron listos.`,
            "done",
            confirmedAt,
          ),
    !alerted
      ? step("filed", "Denuncia presentada", notAlerted, "skipped", null)
      : filedAt === null
        ? step("filed", "Denuncia presentada", `Falta registrar el cargo de ${river.authorities.join(" o ")}.`, "pending", null)
        : step("filed", "Denuncia presentada", `Presentada ante ${river.authorities[0]} con el cargo N.° ${s.receipt}.`, "done", filedAt),
  ];

  return {
    id: s.id,
    received_at: iso(s.receivedAt)!,
    captured_at: iso(s.capturedAt)!,
    captured_at_label: LIMA_DATE.format(s.capturedAt),
    satellite: s.satellite,
    model: "condorin-dragas-v3",
    river: { slug: river.slug, name: river.name, protected_area: river.protected_area },
    scene: { uri: `gs://condorin-escenas/demo/${s.id}.tif`, pinned: hits > 0 },
    detections,
    decision,
    ongs,
    authorities_suggested: river.authorities,
    steps,
  };
}
