"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { useAppStore } from "@/lib/store";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Trophy,
  Lightbulb,
  Plus,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import {
  CATEGORY_LABEL,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
} from "@/lib/constants";
import type { Category, NeighborhoodStat, Recommendation, Report, Severity } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL_META: Record<
  NeighborhoodStat["level"],
  { label: string; text: string; bg: string; bar: string }
> = {
  critico: { label: "Crítico", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", bar: "bg-red-500" },
  atencion: { label: "Atención", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", bar: "bg-amber-500" },
  aceptable: { label: "Aceptable", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", bar: "bg-emerald-500" },
  optimo: { label: "Óptimo", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", bar: "bg-emerald-600" },
};

export function NeighborhoodView() {
  const selectedNeighborhood = useAppStore((s) => s.selectedNeighborhood);
  const go = useAppStore((s) => s.go);

  const { data: neighsData } = useQuery<{ neighborhoods: NeighborhoodStat[] }>({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const res = await fetch("/api/neighborhoods");
      if (!res.ok) throw new Error("neighborhoods");
      return res.json();
    },
  });

  const { data: reportsData, isLoading } = useQuery<{ reports: Report[] }>({
    queryKey: ["reports-by-neighborhood", selectedNeighborhood],
    queryFn: async () => {
      const res = await fetch(
        `/api/reports?neighborhood=${encodeURIComponent(selectedNeighborhood || "")}`
      );
      if (!res.ok) throw new Error("reports");
      return res.json();
    },
    enabled: !!selectedNeighborhood,
  });

  const { data: recsData } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/recommendations");
      if (!res.ok) throw new Error("recommendations");
      return res.json();
    },
  });

  const stat = neighsData?.neighborhoods.find(
    (n) => n.name === selectedNeighborhood
  );
  const reports = reportsData?.reports || [];
  const recs = (recsData?.recommendations || []).filter(
    (r) => r.neighborhood === selectedNeighborhood
  );

  // Distribucion por categoria para este barrio
  const byCat = React.useMemo(() => {
    const m = new Map<Category, number>();
    for (const r of reports) {
      m.set(r.category as Category, (m.get(r.category as Category) || 0) + 1);
    }
    return Array.from(m.entries())
      .map(([cat, count]) => ({
        name: CATEGORY_LABEL[cat],
        short: CATEGORY_LABEL[cat].length > 14 ? CATEGORY_LABEL[cat].slice(0, 12) + "…" : CATEGORY_LABEL[cat],
        count,
        cat,
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports]);

  // Evolucion temporal (ultimos 90 dias por semana)
  const byWeek = React.useMemo(() => {
    const weeks: { label: string; count: number; key: string }[] = [];
    const now = new Date();
    for (let i = 12; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
      weeks.push({
        label: weekStart.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" }),
        count: 0,
        key,
      });
    }
    for (const r of reports) {
      const d = new Date(r.createdAt);
      const ws = new Date(d);
      ws.setDate(d.getDate() - d.getDay());
      const key = `${ws.getFullYear()}-${ws.getMonth() + 1}-${ws.getDate()}`;
      const w = weeks.find((x) => x.key === key);
      if (w) w.count++;
    }
    return weeks;
  }, [reports]);

  if (!selectedNeighborhood) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-muted-foreground">
          No se seleccionó ningún barrio.
        </p>
        <Button className="mt-4" onClick={() => go("indice")}>
          Ver índice de accesibilidad
        </Button>
      </div>
    );
  }

  const meta = stat ? LEVEL_META[stat.level] : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={() => go("indice")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring rounded-lg"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al índice
      </button>

      {/* Header del barrio */}
      <div className={cn("rounded-2xl border p-6", meta ? meta.bg : "bg-muted/40", "border-border")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MapPin className="h-4 w-4" />
              Barrio de Buenos Aires
            </div>
            <h1 className="mt-1 text-4xl font-bold tracking-tight">
              {selectedNeighborhood}
            </h1>
            {meta && stat && (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Badge className={cn("border-0", meta.bg, meta.text)}>
                  {meta.label}
                </Badge>
                <span className={cn("text-2xl font-bold tabular-nums", meta.text)}>
                  {stat.score}
                  <span className="text-sm font-normal text-muted-foreground">/100</span>
                </span>
                <span className="text-sm text-muted-foreground">
                  índice de accesibilidad
                </span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              size="icon"
              className="bg-background/60"
              onClick={async () => {
                const url = `${window.location.origin}/?v=barrio&barrio=${encodeURIComponent(selectedNeighborhood)}`;
                try {
                  if (navigator.share) {
                    await navigator.share({ title: `AccesAR · ${selectedNeighborhood}`, url });
                  } else {
                    await navigator.clipboard.writeText(url);
                    toast.success("Enlace del barrio copiado");
                  }
                } catch {
                  /* cancelled */
                }
              }}
              aria-label="Compartir barrio"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => go("reportar")} variant="outline" className="bg-background/60">
              <Plus className="mr-2 h-4 w-4" />
              Reportar aquí
            </Button>
          </div>
        </div>

        {/* Barra de progreso del score */}
        {meta && stat && (
          <div className="mt-5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-background/60">
              <div
                className={cn("h-full rounded-full transition-all duration-700", meta.bar)}
                style={{ width: `${stat.score}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPIs del barrio */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard icon={TrendingUp} tint="text-primary" label="Total reportes" value={stat?.totalReports ?? 0} />
        <KpiCard icon={AlertTriangle} tint="text-red-600" label="Barreras graves" value={stat?.graveCount ?? 0} />
        <KpiCard icon={AlertTriangle} tint="text-amber-600" label="Moderadas" value={stat?.moderadaCount ?? 0} />
        <KpiCard icon={ShieldCheck} tint="text-emerald-600" label="Accesibles" value={stat?.accesibleCount ?? 0} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Distribucion por categoria */}
        <Card className="card-elevated p-5">
          <h2 className="mb-4 font-semibold">Barreras por categoría</h2>
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : byCat.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sin reportes para graficar.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byCat} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" vertical={false} />
                <XAxis dataKey="short" tick={{ fontSize: 10, fill: "oklch(0.5 0.02 165)" }} interval={0} angle={-12} textAnchor="end" height={56} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 165)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.01 165)", fontSize: 12 }} />
                <Bar dataKey="count" name="Reportes" radius={[6, 6, 0, 0]} maxBarSize={42}>
                  {byCat.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.cat === "falta_rampa" ? "oklch(0.62 0.22 27)" :
                        entry.cat === "vereda_deteriorada" ? "oklch(0.7 0.16 70)" :
                        entry.cat === "obstaculo_fisico" ? "oklch(0.6 0.1 200)" :
                        entry.cat === "cruce_inseguro" ? "oklch(0.55 0.12 300)" :
                        entry.cat === "acceso_inaccesible" ? "oklch(0.54 0.13 163)" :
                        "oklch(0.7 0.05 165)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Evolucion temporal */}
        <Card className="card-elevated p-5">
          <h2 className="mb-4 font-semibold">Evolución de reportes (13 semanas)</h2>
          {isLoading ? (
            <Skeleton className="h-56 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byWeek} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "oklch(0.5 0.02 165)" }} interval={1} />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 165)" }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.9 0.01 165)", fontSize: 12 }} />
                <Bar dataKey="count" name="Reportes" fill="oklch(0.54 0.13 163)" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recomendaciones para este barrio */}
      {recs.length > 0 && (
        <Card className="card-elevated mt-6 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Recomendaciones para {selectedNeighborhood}</h2>
          </div>
          <ul className="grid gap-3 md:grid-cols-2">
            {recs.map((r, i) => {
              const pm = {
                alta: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300",
                media: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
                baja: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
              }[r.priority];
              return (
                <li key={i} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", pm)}>
                      {r.priority === "alta" ? "Prioridad alta" : r.priority === "media" ? "Prioridad media" : "Prioridad baja"}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r.type}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug">{r.title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Historial de reportes */}
      <Card className="card-elevated mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">Historial de reportes ({reports.length})</h2>
          <Button variant="ghost" size="sm" onClick={() => go("mapa")}>
            Ver en el mapa
            <MapPin className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no hay reportes en este barrio.
          </p>
        ) : (
          <ul className="max-h-[32rem] divide-y divide-border/60 overflow-y-auto">
            {reports.map((r) => {
              const sc = SEVERITY_COLOR[r.severity as Severity];
              return (
                <li key={r.id} className="flex items-start gap-3 py-3">
                  {r.imageUrl ? (
                    <img
                      src={r.imageUrl}
                      alt={CATEGORY_LABEL[r.category as Category]}
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <MapPin className="h-5 w-5 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{CATEGORY_LABEL[r.category as Category]}</span>
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", sc.bg, sc.text)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", sc.dot)} />
                        {SEVERITY_LABEL[r.severity as Severity]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{r.address}</p>
                    {r.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground/80">{r.description}</p>
                    )}
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  tint,
  label,
  value,
}: {
  icon: React.ElementType;
  tint: string;
  label: string;
  value: number;
}) {
  return (
    <Card className="card-elevated p-5">
      <Icon className={cn("h-6 w-6", tint)} aria-hidden />
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight animate-count-up" key={value}>
        {value}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}
