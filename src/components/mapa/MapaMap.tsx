"use client";

// Leaflet map of the console. Loaded with next/dynamic (ssr: false) only after the page is idle or
// touched, so the text of the dashboard paints first. Everything draws on one canvas renderer.

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { DetectionFeature, LayerEntry, Mapa } from "@/lib/mapa-types";
import { longDate, mapsUrl, pct } from "./format";

export type Basemap = "dark" | "satellite";
export type Focus = { kind: "det"; id: number; n: number } | { kind: "river"; slug: string; n: number };
export type Insets = { top: number; bottom: number };

type Props = {
  mapa: Mapa;
  features: DetectionFeature[];
  mineRivers: string[];
  focus: Focus | null;
  onSelect: (id: number) => void;
  basemap: Basemap;
  activeLayers: LayerEntry[];
  saveData: boolean;
  signedIn: boolean;
  insets: Insets;
};

const BASEMAPS: Record<Basemap, { url: string; attribution: string; maxZoom: number }> = {
  // CARTO dark_all (the contract's first choice) now answers keyless requests with "API KEY REQUIRED"
  // watermarked tiles (ETag "wm-..."), checked 2026-10-18. Esri's dark gray canvas is keyless and 1x.
  dark: {
    url: "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, HERE, Garmin, © OpenStreetMap contributors",
    maxZoom: 16,
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Esri, Maxar, Earthstar Geographics",
    maxZoom: 18,
  },
};

const RED = "#e11d2e";
const MUTED = "#64748b";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

function detectionPopup(f: DetectionFeature, mapa: Mapa, signedIn: boolean) {
  const p = f.properties;
  const [lon, lat] = f.geometry.coordinates;
  const river = mapa.rivers.find((r) => r.slug === p.river);
  const image = mapa.images.find((i) => i.id === p.image);
  const status = p.alerting
    ? `<span style="color:${RED};font-weight:700">Alerta enviada</span>`
    : `<span style="color:#94a3b8">Bajo el umbral, sin alerta</span>`;
  return `
    <div style="min-width:210px">
      <div style="font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#94a3b8">Draga detectada</div>
      <div style="font-size:15px;font-weight:700;margin-top:2px">Río ${esc(river?.name ?? p.river)}</div>
      <div style="color:#cbd5e1">${esc(longDate(p.captured_at))}</div>
      <div style="margin-top:8px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">
        <span style="color:#94a3b8">Confianza</span><b>${pct(p.confidence)}</b>
        <span style="color:#94a3b8">Satélite</span><span>${esc(p.satellite)}</span>
        ${image?.model ? `<span style="color:#94a3b8">Modelo</span><span>${esc(image.model)}</span>` : ""}
        <span style="color:#94a3b8">Estado</span>${status}
      </div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:12px">
        <a href="${mapsUrl(lat, lon)}" target="_blank" rel="noopener noreferrer">Ver en Google Maps</a>
        ${signedIn ? `<a href="/panel">Abrir en mi panel</a>` : `<a href="/entrar?next=/panel">Entrar para actuar</a>`}
      </div>
    </div>`;
}

function layerPopup(layer: LayerEntry, props: Record<string, unknown> | null) {
  const rows = Object.entries(layer.property_labels ?? {})
    .filter(([key]) => props?.[key] !== undefined && props?.[key] !== null && props?.[key] !== "")
    .map(([key, label]) => `<span style="color:#94a3b8">${esc(label)}</span><span>${esc(props?.[key])}</span>`)
    .join("");
  return `<div style="min-width:180px"><div style="font-weight:700;color:${esc(layer.color)}">${esc(layer.short || layer.title)}</div>
    ${rows ? `<div style="margin-top:6px;display:grid;grid-template-columns:auto 1fr;gap:2px 10px">${rows}</div>` : ""}
    <div style="margin-top:6px;font-size:11px;color:#94a3b8">${esc(layer.source)} (${esc(layer.license)})</div></div>`;
}

export default function MapaMap(props: Props) {
  const { mapa, features, mineRivers, focus, onSelect, basemap, activeLayers, saveData, signedIn, insets } = props;
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const renderer = useRef<L.Canvas | null>(null);
  const tiles = useRef<L.TileLayer | null>(null);
  const detGroup = useRef<L.LayerGroup | null>(null);
  const riverGroup = useRef<L.LayerGroup | null>(null);
  const markers = useRef(new Map<number, L.CircleMarker>());
  const overlays = useRef(new Map<string, L.GeoJSON | "loading">());
  const latest = useRef({ onSelect, insets, activeLayers });
  useEffect(() => {
    latest.current = { onSelect, insets, activeLayers };
  });

  // Create the map once.
  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { preferCanvas: true, zoomControl: false, attributionControl: true, worldCopyJump: false });
    m.attributionControl.setPrefix(false);
    // Phones pinch to zoom, and the top right corner belongs to the KPI strip buttons.
    if (window.matchMedia("(min-width: 1024px)").matches) L.control.zoom({ position: "bottomright" }).addTo(m);
    renderer.current = L.canvas({ padding: 0.5 });
    detGroup.current = L.layerGroup().addTo(m);
    riverGroup.current = L.layerGroup().addTo(m);
    map.current = m;

    // Save Data starts on the detections only; otherwise the whole watched area.
    const pts = mapa.detections.features.map((f) => L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0]));
    const [minLon, minLat, maxLon, maxLat] = mapa.bbox;
    const bounds = saveData && pts.length ? L.latLngBounds(pts) : L.latLngBounds([minLat, minLon], [maxLat, maxLon]);
    const { top, bottom } = latest.current.insets;
    m.fitBounds(bounds.isValid() ? bounds : L.latLngBounds([-13.5, -77.5], [-2, -69]), {
      paddingTopLeft: [24, top + 16],
      paddingBottomRight: [24, bottom + 16],
      maxZoom: 12,
    });

    const overlayMap = overlays.current;
    const markerMap = markers.current;
    return () => {
      m.remove();
      map.current = null;
      overlayMap.clear();
      markerMap.clear();
    };
    // The map is created once; later prop changes are handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Basemap (1x tiles only, never retina).
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    tiles.current?.remove();
    const b = BASEMAPS[basemap];
    m.getContainer().classList.toggle("odc-tiles-dark", basemap === "dark");
    tiles.current = L.tileLayer(b.url, { attribution: b.attribution, maxZoom: b.maxZoom, detectRetina: false }).addTo(m);
  }, [basemap]);

  // Detections: circle markers sized and colored by confidence.
  useEffect(() => {
    const group = detGroup.current;
    if (!group || !renderer.current) return;
    group.clearLayers();
    markers.current.clear();
    const sorted = [...features].sort((a, b) => Number(a.properties.alerting) - Number(b.properties.alerting));
    for (const f of sorted) {
      const p = f.properties;
      const [lon, lat] = f.geometry.coordinates;
      const color = p.alerting ? RED : MUTED;
      const marker = L.circleMarker([lat, lon], {
        renderer: renderer.current,
        radius: 5 + Math.round(p.confidence * 7),
        color: p.alerting ? "#fecaca" : "#94a3b8",
        weight: 1.5,
        fillColor: color,
        fillOpacity: p.alerting ? 0.85 : 0.5,
      });
      marker.bindPopup(() => detectionPopup(f, mapa, signedIn), { maxWidth: 280, autoPanPadding: [16, 80] });
      marker.on("click", () => latest.current.onSelect(p.id));
      marker.addTo(group);
      markers.current.set(p.id, marker);
    }
  }, [features, mapa, signedIn]);

  // Rivers: a labelled diamond, cyan for the member's own rivers.
  useEffect(() => {
    const group = riverGroup.current;
    if (!group) return;
    group.clearLayers();
    for (const r of mapa.rivers) {
      const mine = mineRivers.includes(r.slug);
      L.marker([r.lat, r.lon], {
        icon: L.divIcon({ className: "", html: `<span class="odc-river-pin${mine ? " mine" : ""}"><i></i>${esc(r.name)}</span>`, iconSize: [0, 0], iconAnchor: [5, 5] }),
        keyboard: false,
        zIndexOffset: -100,
      })
        .bindTooltip(`Río ${r.name}: ${r.detections} detecciones, ${r.ongs} ONG`, { direction: "top", offset: [0, -8] })
        .addTo(group);
    }
  }, [mapa.rivers, mineRivers]);

  // Fly to a detection or a river, keeping it clear of the bottom sheet.
  useEffect(() => {
    const m = map.current;
    if (!m || !focus) return;
    let target: L.LatLng | null = null;
    let zoom = 13;
    if (focus.kind === "det") {
      const marker = markers.current.get(focus.id);
      if (!marker) return;
      target = marker.getLatLng();
      zoom = Math.max(m.getZoom(), 14);
    } else {
      const r = mapa.rivers.find((x) => x.slug === focus.slug);
      if (!r) return;
      target = L.latLng(r.lat, r.lon);
      zoom = 12;
    }
    const { top, bottom } = latest.current.insets;
    const point = m.project(target, zoom).add([0, (bottom - top) / 2]);
    const center = m.unproject(point, zoom);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const open = () => {
      if (focus.kind === "det") markers.current.get(focus.id)?.openPopup();
    };
    if (reduced) {
      m.setView(center, zoom);
      open();
    } else {
      m.once("moveend", open);
      m.flyTo(center, zoom, { duration: 0.9 });
    }
  }, [focus, mapa.rivers]);

  // Static open data layers: fetched on first toggle, then kept in memory.
  useEffect(() => {
    const m = map.current;
    if (!m || !renderer.current) return;
    const wanted = new Set(activeLayers.map((l) => l.id));
    for (const [id, layer] of overlays.current) {
      if (layer !== "loading" && !wanted.has(id) && m.hasLayer(layer)) m.removeLayer(layer);
    }
    for (const entry of activeLayers) {
      const existing = overlays.current.get(entry.id);
      if (existing === "loading") continue;
      if (existing) {
        if (!m.hasLayer(existing)) existing.addTo(m);
        continue;
      }
      overlays.current.set(entry.id, "loading");
      const canvas = renderer.current;
      fetch(`/data/${entry.file}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
        .then((geojson) => {
          if (!map.current) return;
          // Polygons use the map's default canvas renderer (preferCanvas); points share the explicit one.
          const layer = L.geoJSON(geojson, {
            style: () => ({ color: entry.color, weight: 1, opacity: 0.9, fillColor: entry.color, fillOpacity: 0.18 }),
            pointToLayer: (_f, latlng) => L.circleMarker(latlng, { renderer: canvas, radius: 4, color: entry.color, weight: 1, fillOpacity: 0.6 }),
            onEachFeature: (f, l) => l.bindPopup(() => layerPopup(entry, f.properties)),
          });
          overlays.current.set(entry.id, layer);
          if (latest.current.activeLayers.some((l) => l.id === entry.id)) {
            layer.addTo(map.current);
            layer.bringToBack();
          }
        })
        .catch(() => overlays.current.delete(entry.id));
    }
  }, [activeLayers]);

  return <div ref={box} className="absolute inset-0 z-0" role="region" aria-label="Mapa de detecciones" />;
}
