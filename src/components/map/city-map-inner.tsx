"use client";

import * as React from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { NEIGHBORHOODS, SEVERITY_COLOR } from "@/lib/constants";
import type { Report, Severity } from "@/lib/types";
import { CATEGORY_LABEL, SEVERITY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Flame, Plus, Minus, LocateFixed } from "lucide-react";

// Centro aproximado de CABA
export const MAP_CENTER: [number, number] = [-34.6037, -58.3816];
export const MAP_BOUNDS_LLA = {
  north: -34.53,
  south: -34.67,
  west: -58.53,
  east: -58.33,
};

// Marcador personalizado (divIcon) coloreado por severidad
function makeIcon(severity: Severity, selected: boolean, status?: string): L.DivIcon {
  const color = SEVERITY_COLOR[severity].hex;
  const size = selected ? 30 : 22;
  const isResolved = status === "resuelto";
  const ring = selected ? "box-shadow: 0 0 0 4px rgba(255,255,255,0.9), 0 0 0 6px " + color + ";" : "box-shadow: 0 1px 4px rgba(0,0,0,0.4);";
  const checkSvg = isResolved
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size * 0.7}" height="${size * 0.7}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"><polyline points="20 6 9 17 4 12"/></svg>`
    : "";
  const opacity = isResolved ? "opacity:0.7;" : "";
  return L.divIcon({
    className: "accesar-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:2.5px solid #fff;${ring}${opacity}transition:all .15s ease;position:relative;">${checkSvg}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

// Componente que re-acciona a la seleccion de marcador centrando el mapa
function FocusSelected({
  selectedId,
  reports,
}: {
  selectedId: string | null;
  reports: Report[];
}) {
  const map = useMap();
  React.useEffect(() => {
    if (!selectedId) return;
    const r = reports.find((x) => x.id === selectedId);
    if (!r) return;
    map.flyTo([r.lat, r.lng], Math.max(map.getZoom(), 16), { duration: 0.6 });
  }, [selectedId, reports, map]);
  return null;
}

// Componente que re-centra cuando cambian los reportes a mostrar (solo si no hay seleccion)
function FitBounds({
  reports,
  selectedId,
}: {
  reports: Report[];
  selectedId: string | null;
}) {
  const map = useMap();
  const didFit = React.useRef(false);
  React.useEffect(() => {
    if (selectedId) return;
    if (didFit.current) return;
    if (reports.length === 0) return;
    if (reports.length === 1) {
      map.setView([reports[0].lat, reports[0].lng], 16);
      didFit.current = true;
      return;
    }
    const bounds = L.latLngBounds(reports.map((r) => [r.lat, r.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    didFit.current = true;
  }, [reports, selectedId, map]);
  return null;
}

// Componente para clicks en el mapa (usado en modo selector de ubicacion)
function ClickHandler({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Botones de control custom sobre el mapa
function ZoomControls({ onZoomIn, onZoomOut, onLocate }: { onZoomIn: () => void; onZoomOut: () => void; onLocate: () => void; }) {
  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-1.5">
      <button
        onClick={onZoomIn}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
        aria-label="Acercar"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        onClick={onZoomOut}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
        aria-label="Alejar"
      >
        <Minus className="h-4 w-4" />
      </button>
      <button
        onClick={onLocate}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
        aria-label="Mi ubicación"
      >
        <LocateFixed className="h-4 w-4" />
      </button>
    </div>
  );
}

function HeatToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "absolute right-3 bottom-16 z-[1000] flex h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium shadow-md backdrop-blur transition-colors focus-ring",
        active
          ? "border-red-300 bg-red-500 text-white hover:bg-red-600 dark:border-red-700"
          : "border-border bg-background/95 text-foreground hover:bg-muted"
      )}
      aria-pressed={active}
      title="Zonas críticas"
    >
      <Flame className="h-3.5 w-3.5" />
      Zonas críticas
    </button>
  );
}

function Legend() {
  return (
    <div className="absolute bottom-3 left-3 z-[1000] flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-md backdrop-blur">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        Barrera grave
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
        Moderada
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
        Accesible
      </span>
    </div>
  );
}

interface CityMapProps {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  highlightNeighborhood?: string | null;
}

function computeCriticalZones(reports: Report[]) {
  const byNeigh = new Map<string, { grave: number; total: number; lat: number; lng: number }>();
  for (const n of NEIGHBORHOODS) {
    byNeigh.set(n.name, { grave: 0, total: 0, lat: n.lat, lng: n.lng });
  }
  for (const r of reports) {
    const entry = byNeigh.get(r.neighborhood);
    if (!entry) continue;
    entry.total++;
    if (r.severity === "grave") entry.grave++;
  }
  const zones: { name: string; lat: number; lng: number; intensity: number; grave: number; total: number }[] = [];
  for (const [name, e] of byNeigh.entries()) {
    const intensity = Math.min(1, e.grave * 0.4 + e.total * 0.1);
    if (intensity >= 0.35 && e.grave >= 1) {
      zones.push({ name, lat: e.lat, lng: e.lng, intensity, grave: e.grave, total: e.total });
    }
  }
  return zones.sort((a, b) => b.intensity - a.intensity);
}

export function CityMap({
  reports,
  selectedId,
  onSelect,
  highlightNeighborhood,
}: CityMapProps) {
  const [showHeat, setShowHeat] = React.useState(false);
  const mapRef = React.useRef<L.Map | null>(null);

  const criticalZones = React.useMemo(() => computeCriticalZones(reports), [reports]);

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 16, { duration: 0.8 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      className="relative h-[60vh] min-h-[420px] w-full overflow-hidden rounded-xl border border-border"
      style={{ isolation: "isolate", zIndex: 0 }}
    >
      <MapContainer
        center={MAP_CENTER}
        zoom={12}
        minZoom={11}
        maxZoom={19}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ zIndex: 0 }}
        ref={(m) => {
          mapRef.current = m;
        }}
        whenReady={(e) => {
          mapRef.current = e.target as L.Map;
        }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        {/* Capa de tonos para mejor contraste (opcional, encima del callejero) */}

        {/* Zonas criticas (heat zones) */}
        {showHeat &&
          criticalZones.map((zone, i) => {
            const radius = 250 + zone.intensity * 350; // metros aprox
            return (
              <Circle
                key={`heat-${i}`}
                center={[zone.lat, zone.lng]}
                radius={radius}
                pathOptions={{
                  color: "#ef4444",
                  fillColor: "#ef4444",
                  fillOpacity: 0.15 + zone.intensity * 0.2,
                  weight: 1,
                  opacity: 0.4,
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong>{zone.name}</strong>
                    <br />
                    {zone.grave} graves · {zone.total} reportes
                  </div>
                </Popup>
              </Circle>
            );
          })}

        {/* Marcadores de reportes */}
        {reports.map((r) => {
          const selected = r.id === selectedId;
          return (
            <Marker
              key={r.id}
              position={[r.lat, r.lng]}
              icon={makeIcon(r.severity as Severity, selected, r.status)}
              eventHandlers={{
                click: () => onSelect(selected ? null : r.id),
              }}
              zIndexOffset={selected ? 1000 : 0}
            >
              <Popup>
                <div className="min-w-[220px] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ background: SEVERITY_COLOR[r.severity as Severity].hex }}
                    />
                    <strong className="text-sm">
                      {CATEGORY_LABEL[r.category as keyof typeof CATEGORY_LABEL]}
                    </strong>
                  </div>
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.address}
                      className="h-24 w-full rounded object-cover"
                    />
                  )}
                  <p className="text-xs text-gray-600">{r.address}</p>
                  <p className="text-[11px] text-gray-500">
                    {SEVERITY_LABEL[r.severity as Severity]} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {r.description && (
                    <p className="text-xs text-gray-700">{r.description}</p>
                  )}
                  <div className="flex items-center gap-2 border-t border-gray-200 pt-1.5 text-[10px]">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-medium"
                      style={{
                        background: r.status === "resuelto" ? "#d1fae5" : r.status === "en_proceso" ? "#ede9fe" : "#e0f2fe",
                        color: r.status === "resuelto" ? "#047857" : r.status === "en_proceso" ? "#6d28d9" : "#0369a1",
                      }}
                    >
                      {r.status === "resuelto" ? "Resuelto" : r.status === "en_proceso" ? "En proceso" : "Activo"}
                    </span>
                    {(r.upvotes || 0) > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21h2V9H2v12zm20-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L13.17 1 7.59 6.59C7.22 6.95 7 7.45 7 8v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>
                        {r.upvotes}
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Resaltar barrio seleccionado (circulo suave) */}
        {highlightNeighborhood &&
          (() => {
            const n = NEIGHBORHOODS.find((x) => x.name === highlightNeighborhood);
            if (!n) return null;
            return (
              <Circle
                center={[n.lat, n.lng]}
                radius={600}
                pathOptions={{
                  color: "#10b981",
                  fillColor: "#10b981",
                  fillOpacity: 0.08,
                  weight: 2,
                  dashArray: "4 6",
                }}
              />
            );
          })()}

        <FocusSelected selectedId={selectedId} reports={reports} />
        <FitBounds reports={reports} selectedId={selectedId} />
      </MapContainer>

      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onLocate={handleLocate}
      />
      <HeatToggle active={showHeat} onToggle={() => setShowHeat((v) => !v)} />
      <Legend />

      {/* Contador */}
      <div className="absolute right-3 bottom-3 z-[1000] rounded-lg border border-border bg-background/95 px-3 py-1.5 text-xs font-medium shadow-md backdrop-blur">
        {reports.length} marcadores
      </div>
    </div>
  );
}

// Mapa selector de ubicacion (para el formulario de reporte)
interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

const pickerIcon = L.divIcon({
  className: "accesar-picker",
  html: `<div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:9999px;background:#10b981;border:3px solid #fff;box-shadow:0 0 0 4px rgba(16,185,129,0.3),0 2px 8px rgba(0,0,0,0.4);">
    <span style="display:block;width:8px;height:8px;border-radius:9999px;background:#fff;"></span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = React.useRef<L.Map | null>(null);
  const initial: [number, number] =
    lat != null && lng != null ? [lat, lng] : MAP_CENTER;

  const handleZoomIn = () => mapRef.current?.zoomIn();
  const handleZoomOut = () => mapRef.current?.zoomOut();
  const handleLocate = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        onChange(latitude, longitude);
        mapRef.current?.flyTo([latitude, longitude], 16, { duration: 0.8 });
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div
      className="relative h-[320px] w-full overflow-hidden rounded-xl border border-border"
      style={{ isolation: "isolate", zIndex: 0 }}
    >
      <MapContainer
        center={initial}
        zoom={lat != null ? 16 : 12}
        minZoom={11}
        maxZoom={19}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
        style={{ zIndex: 0 }}
        ref={(m) => {
          mapRef.current = m;
        }}
        whenReady={(e) => {
          mapRef.current = e.target as L.Map;
        }}
      >
        <TileLayer
          attribution=""
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ClickHandler onClick={onChange} />
        {lat != null && lng != null && (
          <Marker position={[lat, lng]} icon={pickerIcon} />
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex justify-center p-2">
        <span className="pointer-events-none rounded-full bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow-md backdrop-blur">
          Tocá el mapa para marcar la ubicación de la barrera
        </span>
      </div>

      <div className="absolute right-3 top-12 z-[1000] flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
          aria-label="Acercar"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
          aria-label="Alejar"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          onClick={handleLocate}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/95 text-foreground shadow-md backdrop-blur transition-colors hover:bg-muted focus-ring"
          aria-label="Mi ubicación"
        >
          <LocateFixed className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
