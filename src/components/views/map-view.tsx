"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { CityMap } from "@/components/map/city-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter, DATE_PRESET_DAYS } from "@/components/date-filter";
import { ReportDetailDialog } from "@/components/report-detail-dialog";
import { useAppStore } from "@/lib/store";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  NEIGHBORHOOD_NAMES,
} from "@/lib/constants";
import type { Category, Report, Severity } from "@/lib/types";
import { MapPin, Filter, X, ImageIcon, Calendar, Plus, Search, ThumbsUp, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { STATUS_META, STATUS_LABEL } from "@/lib/constants";
import type { ReportStatus } from "@/lib/types";

export function MapView() {
  const categoryFilter = useAppStore((s) => s.categoryFilter);
  const severityFilter = useAppStore((s) => s.severityFilter);
  const setCategoryFilter = useAppStore((s) => s.setCategoryFilter);
  const setSeverityFilter = useAppStore((s) => s.setSeverityFilter);
  const datePreset = useAppStore((s) => s.datePreset);
  const setDatePreset = useAppStore((s) => s.setDatePreset);
  const selectedId = useAppStore((s) => s.selectedReportId);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const go = useAppStore((s) => s.go);

  const days = DATE_PRESET_DAYS[datePreset];
  const { data: reports, isLoading } = useQuery<Report[]>({
    queryKey: ["reports-all", days ?? "all"],
    queryFn: async () => {
      const url = new URL("/api/reports", window.location.origin);
      url.searchParams.set("limit", "1000");
      if (days) url.searchParams.set("days", String(days));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("reports");
      const json = await res.json();
      return json.reports as Report[];
    },
  });

  const [neighborhoodFilter, setNeighborhoodFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<ReportStatus | "all">("all");
  const [query, setQuery] = React.useState("");
  const [dialogReport, setDialogReport] = React.useState<Report | null>(null);

  const filtered = React.useMemo(() => {
    if (!reports) return [];
    return reports.filter((r) => {
      if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
      if (severityFilter !== "all" && r.severity !== severityFilter) return false;
      if (neighborhoodFilter !== "all" && r.neighborhood !== neighborhoodFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (
          !r.address.toLowerCase().includes(q) &&
          !r.neighborhood.toLowerCase().includes(q) &&
          !(r.description || "").toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reports, categoryFilter, severityFilter, neighborhoodFilter, statusFilter, query]);

  const selected = React.useMemo(
    () => reports?.find((r) => r.id === selectedId) || null,
    [reports, selectedId]
  );

  const hasActiveFilters =
    categoryFilter !== "all" ||
    severityFilter !== "all" ||
    neighborhoodFilter !== "all" ||
    statusFilter !== "all" ||
    datePreset !== "all" ||
    query.trim() !== "";

  const clearFilters = () => {
    setCategoryFilter("all");
    setSeverityFilter("all");
    setNeighborhoodFilter("all");
    setStatusFilter("all");
    setQuery("");
    setDatePreset("all");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mapa interactivo</h1>
          <p className="mt-1 text-muted-foreground">
            Explorá las barreras urbanas relevadas por la comunidad. Tocá un
            marcador para ver el detalle.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button onClick={() => go("reportar")} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Reportar barrera
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            Filtrar
          </div>
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Select
              value={categoryFilter}
              onValueChange={(v) => setCategoryFilter(v as Category | "all")}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por categoría">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={severityFilter}
              onValueChange={(v) => setSeverityFilter(v as Severity | "all")}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por severidad">
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las severidades</SelectItem>
                <SelectItem value="grave">Barrera grave</SelectItem>
                <SelectItem value="moderada">Barrera moderada</SelectItem>
                <SelectItem value="accesible">Espacio accesible</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={neighborhoodFilter}
              onValueChange={setNeighborhoodFilter}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por barrio">
                <SelectValue placeholder="Barrio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los barrios</SelectItem>
                {NEIGHBORHOOD_NAMES.map((n) => (
                  <SelectItem key={n} value={n}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ReportStatus | "all")}
            >
              <SelectTrigger className="w-full" aria-label="Filtrar por estado">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="en_proceso">En proceso</SelectItem>
                <SelectItem value="resuelto">Resueltos</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar dirección, barrio..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
              <X className="mr-1.5 h-4 w-4" />
              Limpiar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <span className="text-xs font-medium text-muted-foreground">Período:</span>
          <DateFilter value={datePreset} onChange={setDatePreset} />
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Mapa */}
        <div className="lg:col-span-2">
          {isLoading ? (
            <Skeleton className="h-[60vh] min-h-[420px] w-full rounded-xl" />
          ) : (
            <CityMap
              reports={filtered}
              selectedId={selectedId}
              onSelect={setSelectedReportId}
            />
          )}
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1">
          {selected ? (
            <ReportDetail
              report={selected}
              onClose={() => setSelectedReportId(null)}
              onExpand={() => setDialogReport(selected)}
            />
          ) : (
            <Card className="flex h-full min-h-[420px] flex-col">
              <div className="border-b border-border/60 p-4">
                <h2 className="font-semibold">
                  {filtered.length} reporte{filtered.length === 1 ? "" : "s"}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Seleccioná un marcador en el mapa o un reporte de la lista.
                </p>
              </div>
              <div className="max-h-[52vh] flex-1 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
                    <MapPin className="mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">
                      No hay reportes que coincidan con los filtros.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {filtered.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => setSelectedReportId(r.id)}
                          className={cn(
                            "flex w-full items-start gap-3 rounded-lg border border-transparent p-2.5 text-left transition-colors hover:bg-muted focus-ring",
                            selectedId === r.id && "border-primary/30 bg-primary/5"
                          )}
                        >
                          <span
                            className={cn(
                              "mt-1.5 h-3 w-3 shrink-0 rounded-full ring-2 ring-background",
                              SEVERITY_COLOR[r.severity as Severity].dot,
                              r.status === "resuelto" && "opacity-50"
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="block truncate text-sm font-medium">
                                {CATEGORY_LABEL[r.category as Category]}
                              </span>
                              {r.status === "resuelto" && (
                                <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              )}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {r.address}
                            </span>
                            <span className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span
                                className={cn(
                                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                                  STATUS_META[r.status as ReportStatus].bg,
                                  STATUS_META[r.status as ReportStatus].text
                                )}
                              >
                                {STATUS_LABEL[r.status as ReportStatus]}
                              </span>
                              {(r.upvotes || 0) > 0 && (
                                <span className="inline-flex items-center gap-0.5">
                                  <ThumbsUp className="h-2.5 w-2.5" />
                                  {r.upvotes}
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">
                            {new Date(r.createdAt).toLocaleDateString("es-AR", {
                              day: "2-digit",
                              month: "2-digit",
                            })}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      <ReportDetailDialog
        report={dialogReport}
        open={dialogReport !== null}
        onOpenChange={(o) => !o && setDialogReport(null)}
        onReportChange={(updated) => setDialogReport(updated)}
      />
    </div>
  );
}

function ReportDetail({
  report,
  onClose,
  onExpand,
}: {
  report: Report;
  onClose: () => void;
  onExpand: () => void;
}) {
  const sev = SEVERITY_COLOR[report.severity as Severity];
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="relative">
        {report.imageUrl ? (
          <img
            src={report.imageUrl}
            alt={`Foto del reporte: ${CATEGORY_LABEL[report.category as Category]} en ${report.address}`}
            className="h-48 w-full object-cover"
          />
        ) : (
          <div className="flex h-48 w-full items-center justify-center bg-muted">
            <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background focus-ring"
          aria-label="Cerrar detalle"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-2 left-2">
          <Badge
            className={cn("border-0 shadow-sm", sev.bg, sev.text)}
          >
            <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", sev.dot)} />
            {SEVERITY_LABEL[report.severity as Severity]}
          </Badge>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Categoría
          </p>
          <p className="mt-0.5 font-semibold">
            {CATEGORY_LABEL[report.category as Category]}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Ubicación
          </p>
          <p className="mt-0.5 flex items-start gap-1.5 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{report.address}</span>
          </p>
        </div>

        {report.description && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Descripción
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-foreground/90">
              {report.description}
            </p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Fecha
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm">
            <Calendar className="h-4 w-4 text-primary" />
            {new Date(report.createdAt).toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onExpand}
        >
          Ver detalle completo
        </Button>
      </div>
    </Card>
  );
}
