"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateFilter, DATE_PRESET_DAYS } from "@/components/date-filter";
import type { DashboardStats } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { SEVERITY_COLOR } from "@/lib/constants";
import { BarChart3, PieChart as PieIcon, TrendingUp, MapIcon, Layers, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatsView() {
  const datePreset = useAppStore((s) => s.datePreset);
  const setDatePreset = useAppStore((s) => s.setDatePreset);
  const days = DATE_PRESET_DAYS[datePreset];
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["stats", days ?? "all"],
    queryFn: async () => {
      const url = new URL("/api/stats", window.location.origin);
      if (days) url.searchParams.set("days", String(days));
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("stats");
      return res.json();
    },
  });

  const sevData = React.useMemo(() => {
    if (!stats) return [];
    return stats.bySeverity.map((s) => ({
      name:
        s.severity === "grave"
          ? "Grave"
          : s.severity === "moderada"
          ? "Moderada"
          : "Accesible",
      value: s.count,
      color: SEVERITY_COLOR[s.severity].hex,
    }));
  }, [stats]);

  const catData = React.useMemo(() => {
    if (!stats) return [];
    return stats.byCategory.map((c) => ({
      name: c.label,
      short: c.label.length > 18 ? c.label.slice(0, 16) + "…" : c.label,
      count: c.count,
    }));
  }, [stats]);

  const neighData = React.useMemo(() => {
    if (!stats) return [];
    return [...stats.byNeighborhood].sort((a, b) => a.count - b.count).slice(-10);
  }, [stats]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas</h1>
          <p className="mt-1 text-muted-foreground">
            Datos ciudadanos transformados en información útil para la gestión
            urbana.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateFilter value={datePreset} onChange={setDatePreset} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Reportes totales", value: stats?.totalReports, icon: BarChart3, tint: "text-primary", bg: "bg-primary/10" },
          { label: "Barrios relevados", value: stats?.totalNeighborhoods, icon: MapIcon, tint: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950/40" },
          { label: "Barreras detectadas", value: stats?.totalBarriers, icon: Layers, tint: "text-red-600", bg: "bg-red-100 dark:bg-red-950/40" },
          { label: "Espacios accesibles", value: stats?.accessibleSpaces, icon: TrendingUp, tint: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="card-elevated p-5">
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", kpi.bg)}>
                <Icon className={cn("h-5 w-5", kpi.tint)} />
              </span>
              <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight animate-count-up" key={kpi.value}>
                {isLoading ? "—" : kpi.value}
              </p>
              <p className="text-sm text-muted-foreground">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Insight automatico */}
      {stats && !isLoading && (
        <Card className="mb-6 border-primary/20 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Lightbulb className="h-5 w-5" />
            </span>
            <div className="text-sm">
              <p className="font-semibold text-foreground">Insight del período</p>
              <p className="mt-1 text-muted-foreground">
                {generateInsight(stats)}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Barreras mas frecuentes */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Barreras más frecuentes</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catData} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" vertical={false} />
                <XAxis
                  dataKey="short"
                  tick={{ fontSize: 11, fill: "oklch(0.5 0.02 165)" }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={56}
                />
                <YAxis tick={{ fontSize: 11, fill: "oklch(0.5 0.02 165)" }} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: "oklch(0.95 0.02 165 / 0.5)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid oklch(0.9 0.01 165)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Reportes" fill="oklch(0.56 0.13 163)" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Distribucion por severidad */}
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <PieIcon className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Distribución por severidad</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={sevData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {sevData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid oklch(0.9 0.01 165)",
                      fontSize: 12,
                    }}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Distribucion geografica */}
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <MapIcon className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Distribución geográfica (top 10 barrios)</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={neighData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 165)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 165)" }} allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="neighborhood"
                  tick={{ fontSize: 12, fill: "oklch(0.4 0.02 165)" }}
                  width={104}
                />
                <Tooltip
                  cursor={{ fill: "oklch(0.95 0.02 165 / 0.5)" }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid oklch(0.9 0.01 165)",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Reportes" fill="oklch(0.7 0.12 70)" radius={[0, 6, 6, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}

function generateInsight(s: DashboardStats): string {
  const parts: string[] = [];
  const top = s.byCategory[0];
  if (top) {
    const pct = s.totalReports > 0 ? Math.round((top.count / s.totalReports) * 100) : 0;
    parts.push(
      `La barrera más frecuente es "${top.label}" con ${top.count} reportes (${pct}% del total).`
    );
  }
  const grave = s.bySeverity.find((x) => x.severity === "grave")?.count || 0;
  if (grave > 0 && s.totalReports > 0) {
    const pct = Math.round((grave / s.totalReports) * 100);
    parts.push(`${grave} son barreras graves (${pct}%), lo que requiere atención prioritaria.`);
  }
  const topNeigh = s.byNeighborhood[0];
  if (topNeigh) {
    parts.push(
      `${topNeigh.neighborhood} concentra la mayor cantidad de reportes (${topNeigh.count}).`
    );
  }
  return parts.join(" ") || "Aún no hay datos suficientes para generar un insight.";
}
