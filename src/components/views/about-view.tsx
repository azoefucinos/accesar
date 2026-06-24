"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Target,
  Eye,
  Rocket,
  Users,
  Database,
  MapPin,
  ShieldCheck,
  Heart,
  ArrowRight,
} from "lucide-react";

export function AboutView() {
  const go = useAppStore((s) => s.go);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Encabezado */}
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Sobre el proyecto
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Tecnología y participación ciudadana para ciudades inclusivas
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-balance">
          AccesAR es una plataforma cívica que identifica, visibiliza y mapea
          barreras urbanas. Una primera versión (MVP) construida para resolver
          un problema social concreto.
        </p>
      </div>

      {/* Mision / Vision / Objetivo */}
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Misión</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Promover ciudades más inclusivas mediante tecnología y participación
            ciudadana, visibilizando las barreras que dificultan la movilidad de
            las personas.
          </p>
        </Card>

        <Card className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
            <Eye className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Visión</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Convertirse en una herramienta colaborativa que permita visibilizar y
            reducir las barreras urbanas, transformando la experiencia cotidiana
            de miles de personas.
          </p>
        </Card>

        <Card className="p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Rocket className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Objetivo</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Generar información útil para ciudadanos, organizaciones y gobiernos,
            para priorizar intervenciones y medir el impacto de las mejoras de
            accesibilidad.
          </p>
        </Card>
      </div>

      {/* Como funciona */}
      <section className="mt-14">
        <h2 className="text-2xl font-bold tracking-tight">Cómo funciona</h2>
        <p className="mt-1 text-muted-foreground">
          Un flujo simple y colaborativo, de la calle al dato accionable.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: MapPin, title: "1. Detectás", desc: "Encontrás una barrera urbana en tu barrio y le sacás una foto." },
            { icon: Users, title: "2. Reportás", desc: "La subís a AccesAR con ubicación y categoría. La IA puede sugerir el tipo." },
            { icon: Database, title: "3. Visibilizamos", desc: "El reporte aparece en el mapa colaborativo y alimenta el índice de accesibilidad." },
            { icon: ShieldCheck, title: "4. Transformamos", desc: "Los datos se convierten en estadísticas y recomendaciones para la gestión urbana." },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3 font-semibold">{s.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <Card className="mt-14 overflow-hidden border-primary/20 bg-primary/5 p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-primary" />
        <h2 className="mt-3 text-2xl font-bold tracking-tight">
          Sumate a construir ciudades para todas las personas
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-muted-foreground">
          Cada reporte cuenta. Cada barrera visibilizada es un paso hacia una
          ciudad más inclusiva.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={() => go("reportar")}>
            Reportar una barrera
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline" onClick={() => go("mapa")}>
            Ver el mapa
          </Button>
        </div>
      </Card>
    </div>
  );
}
