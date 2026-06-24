import { create } from "zustand";
import type { Category, Severity } from "./types";

export type View =
  | "home"
  | "mapa"
  | "reportar"
  | "indice"
  | "estadisticas"
  | "sobre"
  | "barrio";

export type DatePreset = "all" | "7d" | "30d" | "90d" | "180d";

interface AppState {
  view: View;
  setView: (v: View) => void;
  go: (v: View) => void;

  // Barrio seleccionado para la vista de detalle
  selectedNeighborhood: string | null;
  setSelectedNeighborhood: (n: string | null) => void;
  openNeighborhood: (n: string) => void;

  // Filtros del mapa (persistentes entre vistas)
  categoryFilter: Category | "all";
  severityFilter: Severity | "all";
  setCategoryFilter: (c: Category | "all") => void;
  setSeverityFilter: (s: Severity | "all") => void;
  datePreset: DatePreset;
  setDatePreset: (d: DatePreset) => void;

  // Marcador seleccionado en el mapa
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;

  // Reporte abierto desde deeplink (?report=id) — abre el dialog global
  deeplinkReportId: string | null;
  setDeeplinkReportId: (id: string | null) => void;

  // Reporte recien creado (para feedback)
  lastCreatedId: string | null;
  setLastCreatedId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "home",
  setView: (view) => set({ view }),
  go: (view) => {
    set({ view });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  selectedNeighborhood: null,
  setSelectedNeighborhood: (selectedNeighborhood) => set({ selectedNeighborhood }),
  openNeighborhood: (n) => {
    set({ selectedNeighborhood: n, view: "barrio" });
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  },

  categoryFilter: "all",
  severityFilter: "all",
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  datePreset: "all",
  setDatePreset: (datePreset) => set({ datePreset }),

  selectedReportId: null,
  setSelectedReportId: (selectedReportId) => set({ selectedReportId }),

  deeplinkReportId: null,
  setDeeplinkReportId: (deeplinkReportId) => set({ deeplinkReportId }),

  lastCreatedId: null,
  setLastCreatedId: (lastCreatedId) => set({ lastCreatedId }),
}));
