"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import {
  MapPin,
  Plus,
  Users,
  Eye,
  Footprints,
  Accessibility,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Map as MapIcon,
  BarChart3,
  ArrowRight,
  Clock,
} from "lucide-react";
import type { DashboardStats, Report } from "@/lib/types";
import { CATEGORY_LABEL, SEVERITY_COLOR, SEVERITY_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { NearbyReports } from "@/components/nearby-reports";
import { Skeleton } from "@/components/ui/skeleton";

export function HomeView() {
  const go = useAppStore((s) => s.go);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["stats"],
    queryFn: async () => {
      const res = await fetch("/api/stats");
      if (!res.ok) throw new Error("stats");
      return (await res.json()) as DashboardStats;
    },
  });

  const { data: recentData, isLoading: recentLoading } = useQuery<{
    reports: Report[];
  }>({
    queryKey: ["reports-recent-home"],
    queryFn: async () => {
      const res = await fetch("/api/reports?limit=6");
      if (!res.ok) throw new Error("reports");
      return res.json();
    },
  });
  const recentReports = recentData?.reports || [];

  // Top 4 reportes recientes para la tarjeta del hero (datos reales)
  const heroPreview = recentReports.slice(0, 4);

  const impact = [
    {
      label: "Reportes registrados",
      value: stats?.totalReports ?? 0,
      icon: MapPin,
      tint: "text-primary",
    },
    {
      label: "Barrios relevados",
      value: stats?.totalNeighborhoods ?? 0,
      icon: MapIcon,
      tint: "text-amber-600",
    },
    {
      label: "Barreras detectadas",
      value: stats?.totalBarriers ?? 0,
      icon: AlertTriangle,
      tint: "text-red-600",
    },
    {
      label: "Espacios accesibles",
      value: stats?.accessibleSpaces ?? 0,
      icon: ShieldCheck,
      tint: "text-emerald-600",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden />
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" aria-hidden />
        <div className="absolute -right-24 top-20 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" aria-hidden />

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div className="space-y-7">
            <h1 className="text-5xl font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Acces<span className="text-primary">AR</span>
            </h1>

            <p className="max-w-xl text-lg text-muted-foreground text-balance sm:text-xl">
              Plataforma colaborativa para identificar y visibilizar barreras
              urbanas que afectan la accesibilidad y movilidad de las personas.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                size="lg"
                className="h-12 text-base"
                onClick={() => go("mapa")}
              >
                <MapPin className="mr-2 h-5 w-5" />
                Ver mapa
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 text-base"
                onClick={() => go("reportar")}
              >
                <Plus className="mr-2 h-5 w-5" />
                Reportar barrera
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Accessibility className="h-4 w-4 text-primary" />
                Movilidad reducida
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Footprints className="h-4 w-4 text-primary" />
                Adultos mayores
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-primary" />
                Discapacidad visual
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" />
                Cochecitos
              </span>
            </div>
          </div>

          {/* Tarjeta visual del hero */}
          <div className="relative">
            <Card className="relative overflow-hidden border-primary/15 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg shadow-sm">
                    <Logo className="h-9 w-9" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Mapa colaborativo</p>
                    <p className="text-xs text-muted-foreground">
                      Barreras urbanas en tiempo real
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  En vivo
                </span>
              </div>

              <div className="mt-5 space-y-2.5">
                {heroPreview.length > 0 ? (
                  heroPreview.map((r) => {
                    const sc = SEVERITY_COLOR[r.severity as Report["severity"]];
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-lg border border-border/60 bg-card p-2.5"
                      >
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", sc.dot)} />
                        <span className="flex-1 truncate text-sm text-foreground">
                          {CATEGORY_LABEL[r.category as Report["category"]]} · {r.neighborhood}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {SEVERITY_LABEL[r.severity as Report["severity"]]}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                    <Plus className="h-6 w-6 text-primary" />
                    <p className="text-sm font-medium">Todavía no hay reportes</p>
                    <p className="text-xs text-muted-foreground">
                      Sé la primera persona en reportar una barrera urbana.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => go(heroPreview.length > 0 ? "mapa" : "reportar")}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/15 focus-ring"
              >
                {heroPreview.length > 0 ? "Explorar el mapa" : "Reportar la primera barrera"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </Card>
          </div>
        </div>
      </section>

      {/* IMPACTO */}
      <section className="border-b border-border/60 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Impacto en números
              </h2>
              <p className="mt-1 text-muted-foreground">
                Datos ciudadanos transformados en información útil.
              </p>
            </div>
            <Button variant="ghost" onClick={() => go("estadisticas")}>
              Ver estadísticas
              <BarChart3 className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {impact.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="card-elevated card-hover-lift p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted/60">
                      <Icon className={`h-5 w-5 ${item.tint}`} aria-hidden />
                    </span>
                    <TrendingUp className="h-4 w-4 text-muted-foreground/40" aria-hidden />
                  </div>
                  {statsLoading ? (
                    <Skeleton className="mt-4 h-9 w-16" />
                  ) : (
                    <p
                      className="mt-4 text-3xl font-bold tabular-nums tracking-tight animate-count-up"
                      key={item.value}
                    >
                      {item.value}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* REPORTES CERCANOS (geolocalizacion) */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <NearbyReports />
        </div>
      </section>

      {/* REPORTES RECIENTES */}
      {(recentLoading || recentReports.length > 0) && (
        <section className="border-b border-border/60">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Reportes recientes
                </h2>
                <p className="mt-1 text-muted-foreground">
                  Las últimas barreras reportadas por la comunidad.
                </p>
              </div>
              <Button variant="ghost" onClick={() => go("mapa")}>
                Ver todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentLoading ? (
                [0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-xl border border-border/60 bg-card p-4"
                  >
                    <Skeleton className="h-16 w-16 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))
              ) : (
                recentReports.map((r) => {
                  const sc = SEVERITY_COLOR[r.severity as Report["severity"]];
                  return (
                    <button
                      key={r.id}
                      onClick={() => go("mapa")}
                      className="card-elevated card-hover-lift group flex gap-3 rounded-xl border border-border/60 bg-card p-4 text-left focus-ring"
                    >
                      {r.imageUrl ? (
                        <img
                          src={r.imageUrl}
                          alt={CATEGORY_LABEL[r.category as Report["category"]]}
                          className="h-16 w-16 shrink-0 rounded-lg object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                          <MapPin className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-semibold">
                            {CATEGORY_LABEL[r.category as Report["category"]]}
                          </span>
                          <span
                            className={cn(
                              "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                              sc.bg,
                              sc.text
                            )}
                          >
                            <span className={cn("h-1 w-1 rounded-full", sc.dot)} />
                            {SEVERITY_LABEL[r.severity as Report["severity"]]}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-muted-foreground">
                          {r.address}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          {new Date(r.createdAt).toLocaleDateString("es-AR", {
                            day: "2-digit",
                            month: "short",
                          })}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </section>
      )}

      {/* POR QUÉ EXISTE */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-5">
              <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                Por qué existe AccesAR
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                Barreras que muchas veces pasan desapercibidas
              </h2>
              <p className="text-lg text-muted-foreground">
                Personas con movilidad reducida, adultos mayores, personas con
                cochecitos, personas con discapacidad visual y muchos otros
                grupos enfrentan a diario obstáculos urbanos que limitan su
                autonomía y su derecho a circular libremente.
              </p>
              <p className="text-muted-foreground">
                AccesAR nace para visibilizar esas barreras, reunirlas en un
                mapa colaborativo y convertirlas en información accionable para
                vecinos, organizaciones y gobiernos.
              </p>
              <Button variant="outline" onClick={() => go("sobre")}>
                Conocer el proyecto
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: Accessibility,
                  title: "Movilidad reducida",
                  desc: "Sillas de ruedas y muletas que necesitan rampas y veredas sin obstáculos.",
                },
                {
                  icon: Footprints,
                  title: "Adultos mayores",
                  desc: "Riesgo de caídas por desniveles, veredas rotas y cruces sin tiempo suficiente.",
                },
                {
                  icon: Users,
                  title: "Cochecitos",
                  desc: "Familias con carritos que enfrentan escalones y veredas estrechas.",
                },
                {
                  icon: Eye,
                  title: "Discapacidad visual",
                  desc: "Necesidad de pisos táctiles, sendas peatonales claras y semáforos sonoros.",
                },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.title} className="card-elevated card-hover-lift p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-semibold">{c.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.desc}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <Card className="relative overflow-hidden border-primary/20 bg-primary p-8 text-primary-foreground sm:p-12">
            <div className="absolute inset-0 grid-pattern opacity-20" aria-hidden />
            <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Sumá tu mirada a una ciudad más inclusiva
                </h2>
                <p className="text-primary-foreground/80">
                  Cada reporte es un dato que ayuda a visibilizar barreras y
                  construir ciudades para todas las personas.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  size="lg"
                  variant="secondary"
                  className="h-12"
                  onClick={() => go("reportar")}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Reportar una barrera
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  onClick={() => go("mapa")}
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Ver el mapa
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
