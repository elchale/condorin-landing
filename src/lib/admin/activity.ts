/**
 * Contract of GET {API}/api/v1/panel/actividad (condorin-backend, panel app), shown live in /admin/en-vivo.
 * One event per satellite scene the detector posted, with every decision Condorin took about it.
 * Steps are computed by the backend, in order; the frontend only shows and animates them.
 */

export type StepKey =
  | "received" // the webhook stored the scene
  | "detections" // confidence of each detection against the threshold
  | "evidence" // GCS hashes of the scene and crops pinned
  | "routing" // which ONGs watch the river
  | "alerts" // WhatsApp alerts to their members
  | "opened" // someone tapped "Crear expediente"
  | "expediente" // confirmed with the WhatsApp code, folio and PDF
  | "filed"; // receipt number from an authority recorded

/** done: happened. skipped: decided not to (e.g. below threshold). pending: may still happen. failed: tried and failed. */
export type StepState = "done" | "skipped" | "pending" | "failed";

export type ActivityStep = {
  key: StepKey;
  /** Short Spanish title, e.g. "Detecciones evaluadas". */
  label: string;
  /** One Spanish sentence with the decision and its reason, e.g. "2 de 3 superan el umbral de 50%." */
  detail: string;
  state: StepState;
  /** When it happened (ISO), null if it has not. */
  at: string | null;
};

export type ActivityDetection = {
  index: number;
  lat: string;
  lon: string;
  confidence: number;
  /** confidence >= threshold */
  alerting: boolean;
  crop_url: string | null;
  pinned: boolean;
};

export type ActivityAlert = {
  member: string;
  /** "+51 *** *** 808" */
  phone_hint: string;
  status: "pending" | "sent" | "failed" | "panel";
  sent_at: string | null;
  opened_at: string | null;
};

export type ActivityOng = {
  id: number;
  name: string;
  members: number;
  alerts: ActivityAlert[];
  expediente: null | {
    status: "draft" | "ready" | "filed";
    status_label: string;
    folio: string | null;
    authorities: string[];
    filings: { authority: string; receipt_number: string; filed_at: string }[];
    finalized_at: string | null;
  };
};

export type ActivityEvent = {
  /** SatelliteImage id; grows with every new scene. */
  id: number;
  received_at: string;
  captured_at: string;
  captured_at_label: string;
  satellite: string;
  model: string;
  river: { slug: string; name: string; protected_area: string };
  scene: { uri: string; pinned: boolean };
  detections: ActivityDetection[];
  /** The routing outcome in one word. */
  decision: "alerted" | "below_threshold" | "no_watchers";
  ongs: ActivityOng[];
  /** Authorities Condorin preselects for this river (primary, plus SERNANP inside a protected area). */
  authorities_suggested: string[];
  steps: ActivityStep[];
};

export type ActivityFeed = {
  generated_at: string;
  /** ALERT_MIN_CONFIDENCE */
  threshold: number;
  /** Newest first. */
  events: ActivityEvent[];
};
