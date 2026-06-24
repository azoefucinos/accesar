"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  NEIGHBORHOODS,
  SEVERITY_COLOR,
} from "@/lib/constants";
import type { NeighborhoodStat, Recommendation } from "@/lib/types";
import { Trophy, AlertTriangle, ShieldCheck, TrendingUp, Lightbulb, MapPin, ArrowRight, Scale, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";

const LEVEL_META: Record<
  NeighborhoodStat["level"],
  { label: string; bar: string; text: string; bg: string; icon: React.ElementType }
> = {
  critico: { label: "Crítico", bar: "bg-red-500", text: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950/40", icon: AlertTriangle },
  atencion: { label: "Atención", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", icon: AlertTriangle },
  aceptable: { label: "Aceptable", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: ShieldCheck },
  optimo: { label: "Óptimo", bar: "bg-emerald-600", text: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-950/40", icon: ShieldCheck },
  sin_datos: { label: "Sin datos", bar: "bg-muted-foreground/30", text: "text-muted-foreground", bg: "bg-muted/40", icon: MapPin },
};

const PRIORITY_META: Record<Recommendation["priority"], { label: string; cls: string }> = {
  alta: { label: "Prioridad alta", cls: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" },
  media: { label: "Prioridad media", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" },
  baja: { label: "Prioridad baja", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" },
};

export function IndexView() {
  const openNeighborhood = useAppStore((s) => s.openNeighborhood);
  const { data: neighs, isLoading } = useQuery<{ neighborhoods: NeighborhoodStat[] }>({
    queryKey: ["neighborhoods"],
    queryFn: async () => {
      const res = await fetch("/api/neighborhoods");
      if (!res.ok) throw new Error("neighborhoods");
      return res.json();
    },
  });

  const { data: recsData } = useQuery<{ recommendations: Recommendation[] }>({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/recommendations");
      if (!res.ok) throw new Error("recommendations");
      return res.json();
    },
  });

  const [a, setA] = React.useState<string>("");
  const [b, setB] = React.useState<string>("");
  const [search, setSearch] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<string>("all");

  const list = neighs?.neighborhoods || [];
  const recs = recsData?.recommendations || [];

  // Solo barrios con datos reales pueden ser "mejor" o "peor"
  const withData = list.filter((n) => n.level !== "sin_datos");
  const best = withData[0];
  const worst = withData[withData.length - 1];
  const avg = withData.length
    ? Math.round(withData.reduce((s, n) => s + n.score, 0) / withData.length)
    : 0;
  const evaluatedCount = withData.length;

  // Comparador: preseleccionar los primeros barrios con datos
  React.useEffect(() => {
    if (withData.length >= 2) {
      if (!a) setA(withData[0].name);
      if (!b) setB(withData[1].name);
    } else if (withData.length === 1) {
      if (!a) setA(withData[0].name);
      if (!b && list.length > 1) setB(list.find((n) => n.name !== withData[0].name)?.name || "");
    }
  }, [withData, list, a, b]);

  const statA = list.find((n) => n.name === a);
  const statB = list.find((n) => n.name === b);

  // Ranking filtrado por busqueda y nivel.
  // Cuando el filtro es "all", los barrios sin datos van al final en una
  // seccion separada (no reciben numero de ranking, para evitar que se lea
  // "1 Palermo" como "1 reporte en Palermo").
  const filteredList = list.filter((n) => {
    if (levelFilter !== "all" && n.level !== levelFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!n.name.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  // Barrios con datos reales (para ranking numerico)
  const rankedList = filteredList.filter((n) => n.level !== "sin_datos");
  // Barrios sin datos (seccion aparte, sin ranking)
  const sinDatosList = filteredList.filter((n) => n.level === "sin_datos");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Índice de accesibilidad</h1>
        <p className="mt-1 max-w-2xl text-muted-foreground">
          Un indicador automático por barrio basado en la cantidad y gravedad de
          los reportes ciudadanos. Mayor puntaje = mejor accesibilidad.
        </p>
      </div>

      {/* Resumen */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard
          icon={TrendingUp}
          tint="text-primary"
          label="Promedio ciudad"
          value={isLoading ? "—" : `${avg}`}
          suffix="/100"
        />
        <SummaryCard
          icon={Trophy}
          tint="text-emerald-600"
          label="Barrio más accesible"
          value={best?.name ?? "—"}
          sub={best ? `${best.score}/100` : "Sin datos aún"}
        />
        <SummaryCard
          icon={AlertTriangle}
          tint="text-red-600"
          label="Barrio más crítico"
          value={worst?.name ?? "—"}
          sub={worst ? `${worst.score}/100` : "Sin datos aún"}
        />
        <SummaryCard
          icon={ShieldCheck}
          tint="text-amber-600"
          label="Barrios evaluados"
          value={isLoading ? "—" : `${evaluatedCount}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Ranking */}
        <Card className="lg:col-span-3 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Ranking de barrios</h2>
          </div>

          {/* Busqueda + filtro por nivel */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar barrio..."
                className="h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                aria-label="Buscar barrio"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { v: "all", l: "Todos" },
                { v: "optimo", l: "Óptimo" },
                { v: "aceptable", l: "Aceptable" },
                { v: "atencion", l: "Atención" },
                { v: "critico", l: "Crítico" },
                { v: "sin_datos", l: "Sin datos" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setLevelFilter(opt.v)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-ring",
                    levelFilter === opt.v
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-sm text-muted-foreground">
              <Trophy className="mb-2 h-8 w-8 opacity-30" />
              No se encontraron barrios con esos criterios.
            </div>
          ) : rankedList.length === 0 ? (
            // No hay barrios con datos: estado vacio claro
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm font-medium text-foreground">
                Aún no hay reportes en la plataforma
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                Los barrios aparecerán en el ranking a medida que la comunidad
                reporte barreras urbanas.
              </p>
              <button
                onClick={() => openNeighborhood(sinDatosList[0]?.name || NEIGHBORHOODS[0].name)}
                className="mt-4 text-xs font-medium text-primary hover:underline focus-ring rounded"
              >
                Ver un barrio igualmente
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Ranking numerico: solo barrios con datos */}
              <ol className="space-y-2">
                {rankedList.map((n, idx) => {
                  const meta = LEVEL_META[n.level];
                  const Icon = meta.icon;
                  return (
                    <li key={n.name}>
                      <button
                        onClick={() => openNeighborhood(n.name)}
                        className="flex w-full items-center gap-3 rounded-lg border border-border/60 p-3 text-left transition-all hover:border-primary/30 hover:bg-muted/40 focus-ring card-hover-lift"
                      >
                        <span className={cn(
                          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                          idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                          idx === 1 ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" :
                          idx === 2 ? "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-medium">{n.name}</span>
                            <span className={cn("text-sm font-bold tabular-nums", meta.text)}>
                              {n.score}
                              <span className="text-xs font-normal text-muted-foreground">/100</span>
                            </span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn("h-full rounded-full transition-all duration-500", meta.bar)}
                              style={{ width: `${n.score}%` }}
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Icon className="h-3 w-3" />
                              {meta.label}
                            </span>
                            <span>{n.totalReports} reportes</span>
                            <span className="text-red-500">{n.graveCount} graves</span>
                            <span className="text-emerald-600">{n.accesibleCount} accesibles</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Seccion aparte: barrios sin datos (sin numero de ranking) */}
              {sinDatosList.length > 0 && (
                <div className="border-t border-border/60 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Sin reportes aún ({sinDatosList.length})
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sinDatosList.map((n) => {
                      const meta = LEVEL_META[n.level];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={n.name}
                          onClick={() => openNeighborhood(n.name)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-ring"
                        >
                          <Icon className="h-3 w-3" />
                          {n.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Comparador */}
        <Card className="lg:col-span-2 p-5">
          <div className="mb-4 flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Comparador de barrios</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={a} onValueChange={setA}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Barrio A" /></SelectTrigger>
              <SelectContent>
                {NEIGHBORHOODS.map((n) => (
                  <SelectItem key={n.name} value={n.name}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={b} onValueChange={setB}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Barrio B" /></SelectTrigger>
              <SelectContent>
                {NEIGHBORHOODS.map((n) => (
                  <SelectItem key={n.name} value={n.name}>{n.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {statA && statB && (
            <div className="mt-4 space-y-4">
              <CompareBar label="Puntaje" a={statA.score} b={statB.score} max={100} suffix="" higherBetter />
              <CompareBar label="Reportes" a={statA.totalReports} b={statB.totalReports} max={Math.max(statA.totalReports, statB.totalReports, 1)} />
              <CompareBar label="Barreras graves" a={statA.graveCount} b={statB.graveCount} max={Math.max(statA.graveCount, statB.graveCount, 1)} />
              <CompareBar label="Espacios accesibles" a={statA.accesibleCount} b={statB.accesibleCount} max={Math.max(statA.accesibleCount, statB.accesibleCount, 1)} higherBetter />

              <div className="grid grid-cols-2 gap-3 pt-2">
                {[statA, statB].map((s, i) => {
                  const meta = LEVEL_META[s.level];
                  return (
                    <button
                      key={i}
                      onClick={() => openNeighborhood(s.name)}
                      className={cn("rounded-lg p-3 text-left transition-all hover:scale-[1.02] focus-ring", meta.bg)}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {i === 0 ? "A" : "B"} · {s.name}
                      </p>
                      <p className={cn("mt-0.5 text-lg font-bold", meta.text)}>
                        {s.score}<span className="text-xs font-normal">/100</span>
                      </p>
                      <p className={cn("text-xs font-medium", meta.text)}>{meta.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recomendaciones automaticas */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Recomendaciones urbanas automáticas</h2>
        </div>
        <p className="mb-4 text-sm text-muted-foreground">
          Generadas a partir de los datos ciudadanos. Transformamos reportes en
          acciones sugeridas para gobiernos y organizaciones.
        </p>
        {recs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Aún no hay suficientes reportes para generar recomendaciones.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {recs.slice(0, 8).map((r, i) => {
              const pm = PRIORITY_META[r.priority];
              return (
                <li key={i} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", pm.cls)}>
                      {pm.label}
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {r.neighborhood} · {r.type}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold leading-snug">
                    {r.title}
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  tint,
  label,
  value,
  sub,
  suffix,
}: {
  icon: React.ElementType;
  tint: string;
  label: string;
  value: string;
  sub?: string;
  suffix?: string;
}) {
  return (
    <Card className="p-5">
      <Icon className={cn("h-6 w-6", tint)} aria-hidden />
      <p className="mt-3 text-2xl font-bold tracking-tight">
        {value}
        {suffix && <span className="text-sm font-normal text-muted-foreground">{suffix}</span>}
      </p>
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/70">{sub}</p>}
    </Card>
  );
}

function CompareBar({
  label,
  a,
  b,
  max,
  suffix,
  higherBetter,
}: {
  label: string;
  a: number;
  b: number;
  max: number;
  suffix?: string;
  higherBetter?: boolean;
}) {
  const aPct = Math.round((a / max) * 100);
  const bPct = Math.round((b / max) * 100);
  const aWins = higherBetter ? a > b : a < b;
  const bWins = higherBetter ? b > a : b < a;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <span className="w-4 text-xs text-muted-foreground">A</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", aWins ? "bg-emerald-500" : "bg-primary/60")}
              style={{ width: `${Math.max(aPct, 4)}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums">{a}{suffix}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 text-xs text-muted-foreground">B</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", bWins ? "bg-emerald-500" : "bg-primary/60")}
              style={{ width: `${Math.max(bPct, 4)}%` }}
            />
          </div>
          <span className="w-10 text-right text-xs font-semibold tabular-nums">{b}{suffix}</span>
        </div>
      </div>
    </div>
  );
}
