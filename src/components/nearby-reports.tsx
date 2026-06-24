"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppStore } from "@/lib/store";
import type { Report } from "@/lib/types";
import {
  CATEGORY_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  NEIGHBORHOODS,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  MapPin,
  Navigation,
  LocateFixed,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

// Haversine distance en metros
function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// Barrio más cercano a una coordenada
function nearestNeighborhood(lat: number, lng: number): string {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const n of NEIGHBORHOODS) {
    const d = distanceMeters(lat, lng, n.lat, n.lng);
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best.name;
}

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; lat: number; lng: number };

export function NearbyReports() {
  const go = useAppStore((s) => s.go);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const [geo, setGeo] = React.useState<GeoState>({ status: "idle" });

  const { data: reportsData, isLoading: reportsLoading } = useQuery<{
    reports: Report[];
  }>({
    queryKey: ["reports-all", "nearby"],
    queryFn: async () => {
      const res = await fetch("/api/reports?limit=1000");
      if (!res.ok) throw new Error("reports");
      return res.json();
    },
    enabled: geo.status === "success",
  });

  const requestGeo = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo({
        status: "error",
        message: "Tu navegador no soporta geolocalización.",
      });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          status: "success",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        let message = "No pudimos obtener tu ubicación.";
        if (err.code === err.PERMISSION_DENIED) {
          message =
            "Permiso de ubicación denegado. Activalo en tu navegador para ver reportes cercanos.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Ubicación no disponible en este momento.";
        } else if (err.code === err.TIMEOUT) {
          message = "Tiempo agotado al obtener tu ubicación. Intentá de nuevo.";
        }
        setGeo({ status: "error", message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const nearby = React.useMemo(() => {
    if (geo.status !== "success" || !reportsData?.reports) return [];
    return reportsData.reports
      .map((r) => ({
        report: r,
        distance: distanceMeters(geo.lat, geo.lng, r.lat, r.lng),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 6);
  }, [geo, reportsData]);

  const userNeighborhood =
    geo.status === "success" ? nearestNeighborhood(geo.lat, geo.lng) : null;

  return (
    <Card className="relative overflow-hidden border-primary/15 p-6">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-2xl" aria-hidden />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Navigation className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Reportes cercanos</h2>
            <p className="text-sm text-muted-foreground">
              {geo.status === "success"
                ? userNeighborhood
                  ? `Cerca de ${userNeighborhood}`
                  : "Tu ubicación actual"
                : "Encontrá barreras reportadas cerca tuyo"}
            </p>
          </div>
        </div>

        {geo.status === "idle" && (
          <Button onClick={requestGeo} variant="outline" size="sm">
            <LocateFixed className="mr-2 h-4 w-4" />
            Usar mi ubicación
          </Button>
        )}
        {geo.status === "loading" && (
          <Button disabled variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            Obteniendo...
          </Button>
        )}
        {geo.status === "success" && (
          <Button onClick={requestGeo} variant="ghost" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        )}
        {geo.status === "error" && (
          <Button onClick={requestGeo} variant="outline" size="sm">
            <LocateFixed className="mr-2 h-4 w-4" />
            Reintentar
          </Button>
        )}
      </div>

      {/* Estados */}
      {geo.status === "error" && (
        <div className="relative mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span className="text-amber-800 dark:text-amber-200">{geo.message}</span>
        </div>
      )}

      {geo.status === "success" && reportsLoading && (
        <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {geo.status === "success" && !reportsLoading && nearby.length === 0 && (
        <div className="relative mt-4 flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
          <MapPin className="h-6 w-6 text-primary" />
          <p className="text-sm font-medium">No hay reportes cerca tuyo</p>
          <p className="text-xs text-muted-foreground">
            Sé la primera persona en reportar una barrera en esta zona.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            onClick={() => go("reportar")}
          >
            Reportar barrera
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {geo.status === "success" && nearby.length > 0 && (
        <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
          {nearby.map(({ report: r, distance }) => {
            const sc = SEVERITY_COLOR[r.severity as Report["severity"]];
            return (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedReportId(r.id);
                  go("mapa");
                }}
                className="card-elevated card-hover-lift group flex items-center gap-3 rounded-lg border border-border/60 bg-card p-3 text-left focus-ring"
              >
                {r.imageUrl ? (
                  <img
                    src={r.imageUrl}
                    alt={CATEGORY_LABEL[r.category as Report["category"]]}
                    className="h-14 w-14 shrink-0 rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-muted">
                    <MapPin className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {CATEGORY_LABEL[r.category as Report["category"]]}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        "bg-primary/10 text-primary"
                      )}
                    >
                      <Navigation className="h-2.5 w-2.5" />
                      {formatDistance(distance)}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.address}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/70">
                    {r.neighborhood} ·{" "}
                    {SEVERITY_LABEL[r.severity as Report["severity"]]}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </Card>
  );
}
