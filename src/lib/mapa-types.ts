// Shapes of the public map payload (GET /api/v1/mapa, see mapa-data/CONTRACT.md "Data contract A")
// and of the static layers manifest (public/data/layers.json, "Data contract C").
// Shared by the server loader and the client console, so this file has no server imports.

export type MapaRiver = {
  slug: string;
  name: string;
  basin: string;
  region: string;
  province: string;
  district: string;
  protected_area: string;
  lat: number;
  lon: number;
  ongs: number;
  images: number;
  detections: number;
  last_captured_at: string | null;
};

export type MapaImage = {
  id: number;
  river: string;
  satellite: string;
  captured_at: string;
  model: string;
  detections: number;
  alerting: number;
  top_confidence: number;
  lat: number;
  lon: number;
  alerts_sent: number;
  expedientes: { draft: number; ready: number; filed: number };
};

export type DetectionProps = {
  id: number;
  image: number;
  river: string;
  confidence: number;
  captured_at: string;
  alerting: boolean;
  satellite: string;
  kind: string;
};

export type DetectionFeature = {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: DetectionProps;
};

export type ActivityKind = "image" | "alert" | "expediente_opened" | "expediente_filed";

export type Mapa = {
  generated_at: string;
  brand: string;
  bbox: [number, number, number, number];
  totals: {
    images: number;
    detections: number;
    alerting_detections: number;
    alerts_sent: number;
    expedientes: number;
    expedientes_filed: number;
    ongs: number;
    members: number;
    rivers: number;
  };
  rivers: MapaRiver[];
  images: MapaImage[];
  detections: { type: "FeatureCollection"; features: DetectionFeature[] };
  timeline: { month: string; images: number; detections: number }[];
  activity: { at: string; kind: ActivityKind | string; river: string; label: string }[];
  mine: null | { member: { name: string; phone: string }; ong: { name: string; rivers: string[] } };
};

export type LayerEntry = {
  id: string;
  file: string;
  title: string;
  short: string;
  source: string;
  license: string;
  url: string;
  year: string;
  color: string;
  geometry: string;
  features: number;
  bytes_gzip: number;
  property_labels?: Record<string, string>;
};

/** Who is looking at the map. Never carries a phone or a token to the browser. */
export type Viewer = {
  signedIn: boolean;
  admin: boolean;
  /** First name of the member, or their ONG when the name is empty. */
  label: string | null;
  /** The member's ONG and the rivers it watches, for highlighting and the "Mis detecciones" filter. */
  mine: { ong: string; rivers: string[] } | null;
};
