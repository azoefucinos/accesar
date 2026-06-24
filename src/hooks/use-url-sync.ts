"use client";

import * as React from "react";
import { useAppStore, type View } from "@/lib/store";

const VALID_VIEWS: View[] = [
  "home",
  "mapa",
  "reportar",
  "indice",
  "estadisticas",
  "sobre",
  "barrio",
];

/**
 * Sincroniza la vista actual y el barrio seleccionado con la URL
 * (query params `v`, `barrio`, `report`) para permitir compartir/deeplink.
 *
 * - `?v=mapa` → ir a la vista mapa
 * - `?v=barrio&barrio=Palermo` → abrir detalle de barrio
 * - `?report=ID` → abrir el dialog de reporte (deeplink a un reporte específico)
 */
export function useUrlSync() {
  const view = useAppStore((s) => s.view);
  const selectedNeighborhood = useAppStore((s) => s.selectedNeighborhood);
  const deeplinkReportId = useAppStore((s) => s.deeplinkReportId);
  const go = useAppStore((s) => s.go);
  const openNeighborhood = useAppStore((s) => s.openNeighborhood);
  const setDeeplinkReportId = useAppStore((s) => s.setDeeplinkReportId);
  const hydrated = React.useRef(false);

  // Leer query params al montar
  React.useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("v") as View | null;
    const barrio = params.get("barrio");
    const report = params.get("report");

    // Deeplink a reporte tiene prioridad — abre el dialog global
    if (report) {
      setDeeplinkReportId(report);
      // Asegurar que estemos en mapa para que el reporte tenga contexto
      if (!v || !VALID_VIEWS.includes(v)) go("mapa");
      else go(v);
      return;
    }

    if (barrio) {
      openNeighborhood(barrio);
    } else if (v && VALID_VIEWS.includes(v)) {
      go(v);
    }
  }, [go, openNeighborhood, setDeeplinkReportId]);

  // Escribir query params cuando cambian
  React.useEffect(() => {
    if (!hydrated.current) return;
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    let changed = false;

    // Manejar `report` param
    if (deeplinkReportId) {
      if (params.get("report") !== deeplinkReportId) {
        params.set("report", deeplinkReportId);
        changed = true;
      }
    } else {
      if (params.get("report")) {
        params.delete("report");
        changed = true;
      }
    }

    if (view === "barrio" && selectedNeighborhood) {
      if (params.get("v") !== "barrio") {
        params.set("v", "barrio");
        changed = true;
      }
      if (params.get("barrio") !== selectedNeighborhood) {
        params.set("barrio", selectedNeighborhood);
        changed = true;
      }
    } else {
      if (params.get("barrio")) {
        params.delete("barrio");
        changed = true;
      }
      if (view === "home") {
        if (params.get("v")) {
          params.delete("v");
          changed = true;
        }
      } else {
        if (params.get("v") !== view) {
          params.set("v", view);
          changed = true;
        }
      }
    }

    if (changed) {
      const qs = params.toString();
      const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, [view, selectedNeighborhood, deeplinkReportId]);
}
