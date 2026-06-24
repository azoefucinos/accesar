"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  NEIGHBORHOODS,
  SEVERITY_COLOR,
  SEVERITY_LABEL,
} from "@/lib/constants";
import type { Category, ClassificationResult, Report, Severity } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { LocationPicker } from "@/components/map/city-map";
import {
  Camera,
  MapPin,
  LocateFixed,
  Sparkles,
  Send,
  CheckCircle2,
  X,
  Loader2,
  ImagePlus,
  AlertCircle,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Redimensiona una imagen a max 1024px y la devuelve como data URL JPEG
function fileToResizedDataUrl(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Imagen inválida"));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas no disponible"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function nearestNeighborhood(lat: number, lng: number) {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const n of NEIGHBORHOODS) {
    const d = (n.lat - lat) ** 2 + (n.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best;
}

export function ReportView() {
  const go = useAppStore((s) => s.go);
  const setSelectedReportId = useAppStore((s) => s.setSelectedReportId);
  const setLastCreatedId = useAppStore((s) => s.setLastCreatedId);
  const qc = useQueryClient();

  const [photo, setPhoto] = React.useState<string | null>(null);
  const [category, setCategory] = React.useState<Category | "">("");
  const [severity, setSeverity] = React.useState<Severity>("moderada");
  const [description, setDescription] = React.useState("");
  const [address, setAddress] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState<string>("");
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [classifying, setClassifying] = React.useState(false);
  const [classification, setClassification] = React.useState<ClassificationResult | null>(null);
  const [submitted, setSubmitted] = React.useState<Report | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [geoSuggestion, setGeoSuggestion] = React.useState<{
    neighborhood: string;
    lat: number;
    lng: number;
    source: "address" | "map" | "gps";
  } | null>(null);
  const [geocoding, setGeocoding] = React.useState(false);

  const onPickPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("El archivo debe ser una imagen");
      return;
    }
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setPhoto(dataUrl);
      setClassification(null);
    } catch (e) {
      toast.error((e as Error).message || "Error al procesar la imagen");
    }
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      toast.error("La geolocalización no está disponible en este dispositivo");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const near = nearestNeighborhood(latitude, longitude);
        // Si está fuera del área mapeada, ajustamos al centro del barrio más cercano
        const inBounds =
          latitude <= -34.53 &&
          latitude >= -34.66 &&
          longitude >= -58.51 &&
          longitude <= -58.35;
        const lat = inBounds ? latitude : near.lat;
        const lng = inBounds ? longitude : near.lng;
        setCoords({ lat, lng });
        setNeighborhood(near.name);
        if (!address) {
          setAddress(`Ubicación GPS · ${near.name}`);
        }
        setLocating(false);
        toast.success(`Ubicación detectada: ${near.name}`);
      },
      (err) => {
        setLocating(false);
        toast.error(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Ingresá la dirección manualmente."
            : "No se pudo obtener la ubicación"
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const classify = async () => {
    if (!photo) {
      toast.error("Primero subí una foto");
      return;
    }
    setClassifying(true);
    try {
      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo }),
      });
      if (!res.ok) throw new Error("classify");
      const data = (await res.json()) as ClassificationResult;
      setClassification(data);
      setCategory(data.category);
      setSeverity(data.severity);
      toast.success("Clasificación sugerida aplicada", {
        description: `${CATEGORY_LABEL[data.category]} · ${SEVERITY_LABEL[data.severity]}`,
      });
    } catch {
      toast.error("No se pudo clasificar la imagen. Revisá los campos manualmente.");
    } finally {
      setClassifying(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!category) throw new Error("Seleccioná una categoría");
      if (!address.trim()) throw new Error("Ingresá una dirección");
      if (!neighborhood) throw new Error("Seleccioná un barrio");
      if (!coords) throw new Error("Definí la ubicación (GPS o dirección)");

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          description: description.trim() || undefined,
          address: address.trim(),
          neighborhood,
          lat: coords.lat,
          lng: coords.lng,
          imageUrl: photo || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error al crear el reporte");
      }
      const json = await res.json();
      return json.report as Report;
    },
    onSuccess: (report) => {
      setSubmitted(report);
      setLastCreatedId(report.id);
      qc.invalidateQueries({ queryKey: ["reports-all"] });
      qc.invalidateQueries({ queryKey: ["reports-recent-home"] });
      qc.invalidateQueries({ queryKey: ["reports-by-neighborhood"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["neighborhoods"] });
      qc.invalidateQueries({ queryKey: ["recommendations"] });
      toast.success("¡Reporte enviado!");
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  // Auto-deteccion del barrio al escribir la direccion (con debounce + Nominatim).
  // Si la direccion tiene >= 5 chars, geocodifica y sugiere barrio + coords.
  React.useEffect(() => {
    const trimmed = address.trim();
    if (trimmed.length < 5) {
      setGeoSuggestion(null);
      return;
    }
    let cancelled = false;
    setGeocoding(true);
    const t = setTimeout(async () => {
      try {
        const url = `/api/geocode?q=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url);
        if (!res.ok) {
          if (!cancelled) setGeoSuggestion(null);
          return;
        }
        const data = (await res.json()) as {
          results?: { lat: number; lng: number; neighborhood: string }[];
        };
        if (!cancelled && data.results && data.results.length > 0) {
          const r = data.results[0];
          setGeoSuggestion({
            neighborhood: r.neighborhood,
            lat: r.lat,
            lng: r.lng,
            source: "address",
          });
        } else if (!cancelled) {
          setGeoSuggestion(null);
        }
      } catch {
        if (!cancelled) setGeoSuggestion(null);
      } finally {
        if (!cancelled) setGeocoding(false);
      }
    }, 700);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setGeocoding(false);
    };
  }, [address]);

  const applySuggestion = () => {
    if (!geoSuggestion) return;
    setNeighborhood(geoSuggestion.neighborhood);
    setCoords({ lat: geoSuggestion.lat, lng: geoSuggestion.lng });
    setGeoSuggestion(null);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  const reset = () => {
    setPhoto(null);
    setCategory("");
    setSeverity("moderada");
    setDescription("");
    setAddress("");
    setNeighborhood("");
    setCoords(null);
    setClassification(null);
    setSubmitted(null);
    setGeoSuggestion(null);
  };

  // Pantalla de confirmacion
  if (submitted) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-16 text-center sm:px-6">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">¡Reporte enviado!</h1>
        <p className="mt-2 max-w-md text-muted-foreground">
          Gracias por contribuir a una ciudad más inclusiva. Tu reporte ya está
          visible en el mapa colaborativo.
        </p>

        <Card className="mt-6 w-full overflow-hidden text-left">
          {submitted.imageUrl && (
            <img
              src={submitted.imageUrl}
              alt={CATEGORY_LABEL[submitted.category as Category]}
              className="h-40 w-full object-cover"
            />
          )}
          <div className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {CATEGORY_LABEL[submitted.category as Category]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  SEVERITY_COLOR[submitted.severity as Severity].bg,
                  SEVERITY_COLOR[submitted.severity as Severity].text
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    SEVERITY_COLOR[submitted.severity as Severity].dot
                  )}
                />
                {SEVERITY_LABEL[submitted.severity as Severity]}
              </span>
            </div>
            <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {submitted.address}
            </p>
          </div>
        </Card>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={() => {
              setSelectedReportId(submitted.id);
              go("mapa");
            }}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Ver en el mapa
          </Button>
          <Button variant="outline" onClick={reset}>
            Reportar otra barrera
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Reportar una barrera</h1>
        <p className="mt-1 text-muted-foreground">
          Subí una foto, ubicá el lugar y ayudá a visibilizar barreras urbanas.
          La IA puede sugerir la categoría y severidad automáticamente.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Foto */}
        <Card className="p-5">
          <Label className="mb-3 block text-sm font-semibold">
            Foto <span className="text-muted-foreground font-normal">(recomendado)</span>
          </Label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />

          {!photo ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/40 p-8 text-center transition-colors hover:border-primary/50 hover:bg-primary/5 focus-ring"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ImagePlus className="h-6 w-6" />
              </span>
              <span className="text-sm font-medium">Subir o tomar una foto</span>
              <span className="text-xs text-muted-foreground">
                JPG o PNG · se redimensiona automáticamente
              </span>
            </button>
          ) : (
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-xl">
                <img
                  src={photo}
                  alt="Vista previa del reporte"
                  className="max-h-64 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    setClassification(null);
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background focus-ring"
                  aria-label="Quitar foto"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={classify}
                disabled={classifying}
                className="w-full"
              >
                {classifying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {classifying ? "Analizando imagen..." : "Clasificar con IA"}
              </Button>

              {classification && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="flex items-center gap-1.5 font-medium text-primary">
                    <Sparkles className="h-4 w-4" />
                    Sugerencia de IA
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Categoría: <strong className="text-foreground">{CATEGORY_LABEL[classification.category]}</strong> ·
                    Severidad: <strong className="text-foreground">{SEVERITY_LABEL[classification.severity]}</strong>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/80">
                    Confianza: {Math.round(classification.confidence * 100)}% — {classification.reasoning}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Ubicacion */}
        <Card className="p-5">
          <Label className="mb-3 block text-sm font-semibold">Ubicación</Label>
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={useGps}
              disabled={locating}
              className="w-full justify-start"
            >
              {locating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LocateFixed className="mr-2 h-4 w-4" />
              )}
              {locating ? "Detectando ubicación..." : "Usar mi ubicación (GPS)"}
            </Button>

            <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-xs text-muted-foreground">
                  Dirección
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ej: Av. Santa Fe 1234, Palermo"
                />
                {/* Sugerencia de barrio auto-detectada */}
                {geocoding && (
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Detectando barrio...
                  </p>
                )}
                {geoSuggestion && !geocoding && (
                  <button
                    type="button"
                    onClick={applySuggestion}
                    className="flex w-full items-start gap-2 rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-left transition-colors hover:bg-primary/10 focus-ring"
                  >
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="flex-1 text-xs">
                      <span className="font-medium text-primary">
                        Barrio sugerido: {geoSuggestion.neighborhood}
                      </span>
                      <span className="mt-0.5 block text-muted-foreground">
                        Tocá para autocompletar barrio y ubicación en el mapa.
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-primary">
                      Usar
                    </span>
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Barrio</Label>
                <Select
                  value={neighborhood}
                  onValueChange={(v) => {
                    setNeighborhood(v);
                    // Si no hay coords manuales, usar el centro del barrio
                    if (!coords) {
                      const n = NEIGHBORHOODS.find((x) => x.name === v);
                      if (n) setCoords({ lat: n.lat, lng: n.lng });
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar barrio" />
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

            {/* Mapa selector de ubicacion real */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Marcá el lugar exacto en el mapa
              </Label>
              <LocationPicker
                lat={coords?.lat ?? null}
                lng={coords?.lng ?? null}
                onChange={(lat, lng) => {
                  setCoords({ lat, lng });
                  const near = nearestNeighborhood(lat, lng);
                  if (!neighborhood) setNeighborhood(near.name);
                  if (!address) {
                    setAddress(`Ubicación en mapa · ${near.name}`);
                  }
                }}
              />
            </div>

            {coords && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Coordenadas: {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </p>
            )}
          </div>
        </Card>

        {/* Categoria y severidad */}
        <Card className="p-5">
          <Label className="mb-3 block text-sm font-semibold">Categoría</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                className={cn(
                  "rounded-lg border p-3 text-left text-sm transition-colors focus-ring",
                  category === c.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border bg-card hover:bg-muted"
                )}
              >
                <span className="block font-medium">{c.short}</span>
                <span className="block text-xs text-muted-foreground">
                  {c.label}
                </span>
              </button>
            ))}
          </div>

          <Label className="mb-2 mt-5 block text-sm font-semibold">Severidad</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["grave", "moderada", "accesible"] as Severity[]).map((s) => {
              const sc = SEVERITY_COLOR[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverity(s)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border p-2.5 text-sm font-medium transition-colors focus-ring",
                    severity === s
                      ? cn(sc.bg, sc.text, "border-current")
                      : "border-border bg-card hover:bg-muted text-muted-foreground"
                  )}
                >
                  <span className={cn("h-2.5 w-2.5 rounded-full", sc.dot)} />
                  {s === "grave" ? "Grave" : s === "moderada" ? "Moderada" : "Accesible"}
                </button>
              );
            })}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Marcá "Accesible" si el espacio NO presenta barreras (rampa correcta, vereda en buen estado, etc.).
          </p>
        </Card>

        {/* Descripcion */}
        <Card className="p-5">
          <Label htmlFor="desc" className="mb-2 block text-sm font-semibold">
            Descripción <span className="text-muted-foreground font-normal">(opcional)</span>
          </Label>
          <Textarea
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describí brevemente la barrera: dónde, cuándo, qué obstáculo específico..."
            rows={3}
            maxLength={500}
          />
          <p className="mt-1 text-right text-xs text-muted-foreground">
            {description.length}/500
          </p>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={reset}
            disabled={createMutation.isPending}
          >
            Limpiar
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={createMutation.isPending}
            className="sm:min-w-[180px]"
          >
            {createMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            {createMutation.isPending ? "Enviando..." : "Enviar reporte"}
          </Button>
        </div>
      </form>
    </div>
  );
}
