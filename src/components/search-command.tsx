"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAppStore } from "@/lib/store";
import type { Category, Report, Severity } from "@/lib/types";
import {
  CATEGORY_LABEL,
  CATEGORY_SHORT,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  NEIGHBORHOODS,
} from "@/lib/constants";
import {
  MapPin,
  Search,
  Plus,
  Trophy,
  BarChart3,
  Info,
  Navigation,
  CornerDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const QUICK_NAV = [
  { view: "reportar" as const, label: "Reportar una barrera", icon: Plus, hint: "Acción principal" },
  { view: "mapa" as const, label: "Ver mapa interactivo", icon: MapPin, hint: "Explorar reportes" },
  { view: "indice" as const, label: "Índice de barrios", icon: Trophy, hint: "Ranking de accesibilidad" },
  { view: "estadisticas" as const, label: "Estadísticas", icon: BarChart3, hint: "Datos en vivo" },
  { view: "sobre" as const, label: "Sobre el proyecto", icon: Info, hint: "Misión y visión" },
];

export function SearchCommand() {
  const [open, setOpen] = React.useState(false);
  const go = useAppStore((s) => s.go);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const setDeeplinkReportId = useAppStore((s) => s.setDeeplinkReportId);
  const openNeighborhood = useAppStore((s) => s.openNeighborhood);

  // Atajo de teclado Cmd+K / Ctrl+K
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      // Escape lo cierra (también lo maneja CommandDialog pero por las dudas)
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  // Cargar reportes para búsqueda (solo cuando abre)
  const { data: reportsData } = useQuery<{ reports: Report[] }>({
    queryKey: ["reports-all", "search-command"],
    queryFn: async () => {
      const res = await fetch("/api/reports?limit=1000");
      if (!res.ok) throw new Error("reports");
      return res.json();
    },
    enabled: open,
    staleTime: 30_000,
  });

  const reports = reportsData?.reports || [];

  const handleSelectReport = (id: string) => {
    setOpen(false);
    setDeeplinkReportId(id);
    // Si no estamos en mapa, ir a mapa para dar contexto
    if (useAppStore.getState().view !== "mapa") {
      go("mapa");
    }
  };

  const handleSelectNeighborhood = (name: string) => {
    setOpen(false);
    openNeighborhood(name);
  };

  const handleSelectNav = (view: typeof QUICK_NAV[number]["view"]) => {
    setOpen(false);
    go(view);
  };

  return (
    <>
      {/* Botón flotante de búsqueda (desktop) */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl focus-ring md:flex"
        aria-label="Buscar (Cmd+K)"
        title="Buscar (Cmd+K)"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen} className="max-w-2xl">
        <CommandInput placeholder="Buscar reportes, barrios o navegar..." />
        <CommandList>
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>

          {/* Navegación rápida */}
          <CommandGroup heading="Navegación">
            {QUICK_NAV.map((item) => {
              const Icon = item.icon;
              return (
                <CommandItem
                  key={item.view}
                  value={`${item.label} ${item.hint} navegacion nav`}
                  onSelect={() => handleSelectNav(item.view)}
                  className="group"
                >
                  <Icon className="mr-3 h-4 w-4 text-primary" />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.hint}
                  </span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          <CommandSeparator />

          {/* Barrios */}
          {reports.length === 0 && (
            <CommandGroup heading="Barrios">
              {NEIGHBORHOODS.slice(0, 8).map((n) => (
                <CommandItem
                  key={n.name}
                  value={`${n.name} barrio navegacion`}
                  onSelect={() => handleSelectNeighborhood(n.name)}
                >
                  <MapPin className="mr-3 h-4 w-4 text-muted-foreground" />
                  <span>{n.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {/* Reportes */}
          {reports.length > 0 && (
            <CommandGroup heading={`Reportes (${reports.length})`}>
              {reports.slice(0, 30).map((r) => {
                const sc = SEVERITY_COLOR[r.severity as Severity];
                return (
                  <CommandItem
                    key={r.id}
                    value={`${r.address} ${r.neighborhood} ${CATEGORY_LABEL[r.category as Category]} ${SEVERITY_LABEL[r.severity as Severity]} ${r.description || ""} reporte`}
                    onSelect={() => handleSelectReport(r.id)}
                    className="group"
                  >
                    <span
                      className={cn(
                        "mr-3 h-2 w-2 shrink-0 rounded-full",
                        sc.dot
                      )}
                    />
                    <span className="flex-1 truncate">
                      <span className="font-medium">
                        {CATEGORY_SHORT[r.category as Category]}
                      </span>
                      <span className="text-muted-foreground"> · {r.address}</span>
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {r.neighborhood}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {reports.length > 30 && (
            <div className="p-2 text-center text-xs text-muted-foreground">
              Mostrando 30 de {reports.length} reportes. Refiná tu búsqueda para ver más.
            </div>
          )}

          <CommandSeparator />
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CornerDownLeft className="h-3 w-3" />
              para seleccionar
            </span>
            <span>Esc para cerrar</span>
          </div>
        </CommandList>
      </CommandDialog>
    </>
  );
}
