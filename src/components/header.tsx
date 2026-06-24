"use client";

import * as React from "react";
import { useAppStore, type View } from "@/lib/store";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { MapPin, Plus, BarChart3, Info, LayoutGrid, Trophy } from "lucide-react";

const NAV: { view: View; label: string; icon: React.ElementType }[] = [
  { view: "home", label: "Inicio", icon: LayoutGrid },
  { view: "mapa", label: "Mapa", icon: MapPin },
  { view: "reportar", label: "Reportar", icon: Plus },
  { view: "indice", label: "Índice", icon: Trophy },
  { view: "estadisticas", label: "Stats", icon: BarChart3 },
  { view: "sobre", label: "Sobre", icon: Info },
];

export function Header() {
  const view = useAppStore((s) => s.view);
  const go = useAppStore((s) => s.go);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button
          onClick={() => go("home")}
          className="flex items-center gap-2.5 rounded-lg focus-ring"
          aria-label="Ir al inicio de AccesAR"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm">
            <Logo className="h-9 w-9" />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-lg font-bold tracking-tight text-foreground">
              Acces<span className="text-primary">AR</span>
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
              Accesibilidad urbana
            </span>
          </span>
        </button>

        {/* Nav desktop */}
        <nav
          className="ml-auto hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {NAV.map((item) => {
            const active = view === item.view;
            const Icon = item.icon;
            return (
              <button
                key={item.view}
                onClick={() => go(item.view)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {item.label === "Stats" ? "Estadísticas" : item.label}
              </button>
            );
          })}
          <div className="mx-1 h-6 w-px bg-border" aria-hidden />
          <ThemeToggle />
        </nav>

        {/* Mobile: only theme toggle in header (nav is bottom bar) */}
        <div className="ml-auto md:hidden">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export function MobileNav() {
  const view = useAppStore((s) => s.view);
  const go = useAppStore((s) => s.go);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Navegación principal móvil"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-around px-1">
        {NAV.map((item) => {
          const active = view === item.view;
          const Icon = item.icon;
          const isReport = item.view === "reportar";
          return (
            <li key={item.view} className="flex-1">
              <button
                onClick={() => go(item.view)}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex w-full flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors focus-ring",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                    isReport
                      ? "bg-primary text-primary-foreground shadow-md -mt-3 ring-4 ring-background"
                      : active && "bg-primary/10"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="leading-none">{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
