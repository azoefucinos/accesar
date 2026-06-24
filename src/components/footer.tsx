"use client";

import * as React from "react";
import { useAppStore, type View } from "@/lib/store";
import { Logo } from "@/components/logo";
import { Heart } from "lucide-react";

const LINKS: { view: View; label: string }[] = [
  { view: "home", label: "Inicio" },
  { view: "mapa", label: "Mapa" },
  { view: "reportar", label: "Reportar barrera" },
  { view: "indice", label: "Índice de accesibilidad" },
  { view: "estadisticas", label: "Estadísticas" },
  { view: "sobre", label: "Sobre el proyecto" },
];

export function Footer() {
  const go = useAppStore((s) => s.go);
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Logo className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-tight">
                Acces<span className="text-primary">AR</span>
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              Plataforma colaborativa para identificar y visibilizar barreras
              urbanas. Ciudades más inclusivas mediante datos ciudadanos e
              inteligencia artificial.
            </p>
          </div>

          <nav aria-label="Navegación del pie" className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Navegación
            </h3>
            <ul className="space-y-1.5">
              {LINKS.map((l) => (
                <li key={l.view}>
                  <button
                    onClick={() => go(l.view)}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary focus-ring"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sobre los datos
            </h3>
            <p className="text-sm text-muted-foreground">
              Los reportes son contribuciones ciudadanas con fines de
              visualización e impacto social. AccesAR es un MVP de código
              abierto orientado a datos abiertos.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {year} AccesAR · Hecho con impacto social en mente.</p>
          <p className="inline-flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-primary" aria-hidden />
            Ciudades para todas las personas
          </p>
        </div>
      </div>
    </footer>
  );
}
