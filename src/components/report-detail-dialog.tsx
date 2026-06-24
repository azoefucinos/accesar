"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORY_LABEL,
  CATEGORIES,
  NEIGHBORHOODS,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
  STATUS_LABEL,
  STATUS_META,
} from "@/lib/constants";
import type {
  Category,
  Report,
  ReportStatus,
  Severity,
  UpdateReportInput,
} from "@/lib/types";
import { useAppStore } from "@/lib/store";
import {
  MapPin,
  Calendar,
  Share2,
  ExternalLink,
  ImageIcon,
  Navigation,
  Trash2,
  Loader2,
  ThumbsUp,
  Pencil,
  Check,
  X,
  Clock,
  CircleCheck,
  Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportDetailDialogProps {
  report: Report | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReportChange?: (updated: Report) => void;
}

const STORAGE_KEY = "accesar:voted-reports";

function getVotedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

function saveVotedId(id: string) {
  try {
    const set = getVotedIds();
    set.add(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export function ReportDetailDialog({
  report,
  open,
  onOpenChange,
  onReportChange,
}: ReportDetailDialogProps) {
  const openNeighborhood = useAppStore((s) => s.openNeighborhood);
  const go = useAppStore((s) => s.go);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [hasVoted, setHasVoted] = React.useState(false);

  React.useEffect(() => {
    if (report) {
      setHasVoted(getVotedIds().has(report.id));
    }
  }, [report]);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["reports-all"] });
    qc.invalidateQueries({ queryKey: ["reports-recent-home"] });
    qc.invalidateQueries({ queryKey: ["reports-by-neighborhood"] });
    qc.invalidateQueries({ queryKey: ["stats"] });
    qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    qc.invalidateQueries({ queryKey: ["recommendations"] });
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al eliminar");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Reporte eliminado");
      onOpenChange(false);
      setSelectedReportId(null);
      setConfirmOpen(false);
      invalidateAll();
    },
    onError: (e: Error) => {
      toast.error(e.message);
      setConfirmOpen(false);
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reports/${id}/vote`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al confirmar");
      }
      return res.json();
    },
    onSuccess: (data: { upvotes: number }) => {
      saveVotedId(report!.id);
      setHasVoted(true);
      toast.success("¡Gracias por confirmar la barrera!", {
        description: "Tu confirmación ayuda a priorizar las intervenciones.",
      });
      // Optimistic: update local report
      if (onReportChange && report) {
        onReportChange({ ...report, upvotes: data.upvotes });
      }
      invalidateAll();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar estado");
      }
      const json = await res.json();
      return json.report as Report;
    },
    onSuccess: (updated: Report) => {
      toast.success(`Estado actualizado a "${STATUS_LABEL[updated.status]}"`);
      if (onReportChange) onReportChange(updated);
      invalidateAll();
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  if (!report) return null;
  const sc = SEVERITY_COLOR[report.severity as Severity];
  const cat = CATEGORY_LABEL[report.category as Category];
  const stMeta = STATUS_META[report.status as ReportStatus];

  const share = async () => {
    const url = `${window.location.origin}/?report=${report.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "AccesAR", text: `Reporte: ${cat}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Enlace copiado al portapapeles");
      }
    } catch {
      /* user cancelled share */
    }
  };

  const openInMaps = () => {
    onOpenChange(false);
    go("mapa");
  };

  const goToNeighborhood = () => {
    onOpenChange(false);
    openNeighborhood(report.neighborhood);
  };

  const handleDelete = () => {
    deleteMutation.mutate(report.id);
  };

  const handleVote = () => {
    if (hasVoted) {
      toast.info("Ya confirmaste esta barrera", {
        description: "Solo se puede confirmar una vez por reporte.",
      });
      return;
    }
    voteMutation.mutate(report.id);
  };

  const handleStatusChange = (status: ReportStatus) => {
    statusMutation.mutate({ id: report.id, status });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{cat} en {report.address}</DialogTitle>
          <DialogDescription>
            Detalle del reporte de accesibilidad urbana.
          </DialogDescription>
        </DialogHeader>

        {/* Imagen */}
        <div className="relative h-56 w-full shrink-0 bg-muted sm:h-64">
          {report.imageUrl ? (
            <img
              src={report.imageUrl}
              alt={`Foto del reporte: ${cat} en ${report.address}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            <Badge
              className={cn("border-0 shadow-md", sc.bg, sc.text)}
            >
              <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", sc.dot)} />
              {SEVERITY_LABEL[report.severity as Severity]}
            </Badge>
            <Badge
              className={cn("border-0 shadow-md", stMeta.bg, stMeta.text)}
            >
              <span className={cn("mr-1.5 h-1.5 w-1.5 rounded-full", stMeta.dot)} />
              {stMeta.label}
            </Badge>
          </div>
          {report.upvotes > 0 && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-background/95 px-2.5 py-1 text-xs font-semibold shadow-md backdrop-blur">
              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
              {report.upvotes}
            </div>
          )}
        </div>

        {/* Contenido scrollable */}
        <div className="max-h-[55vh] space-y-4 overflow-y-auto p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Categoría
            </p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight">{cat}</h2>
          </div>

          {/* Confirmacion ciudadana (vote) */}
          <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <Button
              type="button"
              size="sm"
              onClick={handleVote}
              disabled={hasVoted || voteMutation.isPending}
              className={cn(
                "shrink-0",
                hasVoted && "bg-emerald-600 hover:bg-emerald-600"
              )}
            >
              {voteMutation.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : hasVoted ? (
                <Check className="mr-1.5 h-3.5 w-3.5" />
              ) : (
                <ThumbsUp className="mr-1.5 h-3.5 w-3.5" />
              )}
              {hasVoted ? "Confirmado" : "Confirmar barrera"}
            </Button>
            <p className="text-xs leading-snug text-muted-foreground">
              {hasVoted
                ? "Gracias por tu aporte. Tu confirmación ayuda a validar y priorizar esta barrera."
                : "Si verificaste que esta barrera existe, confirmala para ayudar a priorizar la intervención."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Ubicación
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">{report.address}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Fecha
              </p>
              <p className="mt-1 text-sm font-medium">
                {new Date(report.createdAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {report.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Descripción
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">
                {report.description}
              </p>
            </div>
          )}

          {report.status === "resuelto" && report.resolvedAt && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/40">
              <CircleCheck className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-800 dark:text-emerald-200">
                Resuelto el{" "}
                {new Date(report.resolvedAt).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <Navigation className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              Coordenadas: {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
            </span>
          </div>

          {/* Cambiar estado (workflow) */}
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Wrench className="h-3.5 w-3.5" />
              Estado del reporte
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(["activo", "en_proceso", "resuelto"] as ReportStatus[]).map((s) => {
                const m = STATUS_META[s];
                const active = report.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => !active && handleStatusChange(s)}
                    disabled={statusMutation.isPending || active}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs font-medium transition-colors focus-ring disabled:cursor-not-allowed",
                      active
                        ? cn(m.bg, m.text, "border-current")
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {s === "activo" && <Clock className="h-3.5 w-3.5" />}
                    {s === "en_proceso" && <Wrench className="h-3.5 w-3.5" />}
                    {s === "resuelto" && <CircleCheck className="h-3.5 w-3.5" />}
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={goToNeighborhood}
              className="flex-1"
            >
              <MapPin className="mr-1.5 h-4 w-4" />
              Ver barrio
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openInMaps}
              className="flex-1"
            >
              <ExternalLink className="mr-1.5 h-4 w-4" />
              Ver en mapa
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="px-3"
              title="Editar reporte"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={share} className="px-3">
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Eliminar reporte (compacto, con confirmacion) */}
          <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Eliminar reporte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar este reporte?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. El reporte de{" "}
                  <strong>{cat}</strong> en {report.address} se eliminará
                  permanentemente de la plataforma.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteMutation.isPending}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Sí, eliminar
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DialogContent>

      {/* Modal de edicion */}
      <EditReportDialog
        report={report}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={(updated) => {
          if (onReportChange) onReportChange(updated);
          invalidateAll();
        }}
      />
    </Dialog>
  );
}

// Modal de edicion de reporte
function EditReportDialog({
  report,
  open,
  onOpenChange,
  onUpdated,
}: {
  report: Report;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (updated: Report) => void;
}) {
  const qc = useQueryClient();
  const [category, setCategory] = React.useState<Category>(report.category as Category);
  const [severity, setSeverity] = React.useState<Severity>(report.severity as Severity);
  const [description, setDescription] = React.useState(report.description || "");
  const [address, setAddress] = React.useState(report.address);
  const [neighborhood, setNeighborhood] = React.useState(report.neighborhood);

  React.useEffect(() => {
    if (open) {
      setCategory(report.category as Category);
      setSeverity(report.severity as Severity);
      setDescription(report.description || "");
      setAddress(report.address);
      setNeighborhood(report.neighborhood);
    }
  }, [open, report]);

  const updateMutation = useMutation({
    mutationFn: async (data: UpdateReportInput) => {
      const res = await fetch(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al actualizar");
      }
      const json = await res.json();
      return json.report as Report;
    },
    onSuccess: (updated: Report) => {
      toast.success("Reporte actualizado");
      onUpdated(updated);
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["reports-all"] });
      qc.invalidateQueries({ queryKey: ["reports-by-neighborhood"] });
      qc.invalidateQueries({ queryKey: ["reports-recent-home"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["neighborhoods"] });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      category,
      severity,
      description: description.trim() || null,
      address,
      neighborhood,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            Editar reporte
          </DialogTitle>
          <DialogDescription>
            Actualizá los detalles del reporte. La ubicación en el mapa no se
            modifica desde aquí.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Categoria */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Categoría</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Severidad */}
          <div>
            <Label className="mb-2 block text-sm font-semibold">Severidad</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["grave", "moderada", "accesible"] as Severity[]).map((s) => {
                const sm = SEVERITY_COLOR[s];
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors focus-ring",
                      severity === s
                        ? cn(sm.bg, sm.text, "border-current")
                        : "border-border bg-card hover:bg-muted text-muted-foreground"
                    )}
                  >
                    <span className={cn("h-2.5 w-2.5 rounded-full", sm.dot)} />
                    {s === "grave" ? "Grave" : s === "moderada" ? "Moderada" : "Accesible"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Direccion + Barrio */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-address" className="text-xs text-muted-foreground">
                Dirección
              </Label>
              <Input
                id="edit-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Barrio</Label>
              <Select value={neighborhood} onValueChange={setNeighborhood}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NEIGHBORHOODS.map((n) => (
                    <SelectItem key={n.name} value={n.name}>
                      {n.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Descripcion */}
          <div>
            <Label htmlFor="edit-desc" className="mb-2 block text-sm font-semibold">
              Descripción
            </Label>
            <Textarea
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Agregá detalles sobre la barrera..."
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">
              {description.length}/500
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
            >
              <X className="mr-1.5 h-4 w-4" />
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-1.5 h-4 w-4" />
              )}
              {updateMutation.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
