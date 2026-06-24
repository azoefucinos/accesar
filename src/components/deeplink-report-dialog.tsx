"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ReportDetailDialog } from "@/components/report-detail-dialog";
import { useAppStore } from "@/lib/store";
import type { Report } from "@/lib/types";

/**
 * Dialog global que se abre cuando hay un `deeplinkReportId` en el store
 * (viene de un deep link `?report=ID` o del botón "compartir").
 * Vive a nivel page para que funcione desde cualquier vista.
 */
export function DeeplinkReportDialog() {
  const deeplinkReportId = useAppStore((s) => s.deeplinkReportId);
  const setDeeplinkReportId = useAppStore((s) => s.setDeeplinkReportId);

  const { data, isLoading } = useQuery<{ report: Report }>({
    queryKey: ["report-deeplink", deeplinkReportId],
    queryFn: async () => {
      const res = await fetch(`/api/reports/${deeplinkReportId}`);
      if (!res.ok) throw new Error("no encontrado");
      return res.json();
    },
    enabled: !!deeplinkReportId,
    retry: false,
  });

  const report = data?.report || null;

  return (
    <ReportDetailDialog
      report={report}
      open={!!deeplinkReportId && !!report}
      onOpenChange={(o) => {
        if (!o) setDeeplinkReportId(null);
      }}
      onReportChange={(updated) => {
        // El cache se invalida dentro del dialog; aquí no hacemos nada extra
        void updated;
      }}
    />
  );
}
