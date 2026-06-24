"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import {
  MapPin,
  Plus,
  Trophy,
  BarChart3,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "accesar:onboarding-seen-v1";

const STEPS = [
  {
    icon: Plus,
    title: "Reportá barreras urbanas",
    description:
      "Sacale una foto a la barrera, escribí la dirección y nuestro sistema sugiere la categoría y severidad automáticamente con IA.",
    color: "bg-primary/10 text-primary",
    cta: { label: "Reportar", view: "reportar" as const },
  },
  {
    icon: MapPin,
    title: "Explorá el mapa colaborativo",
    description:
      "Cada marcador es un reporte real de la comunidad. Filtrá por categoría, severidad, barrio o fecha para encontrar lo que buscás.",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    cta: { label: "Ver mapa", view: "mapa" as const },
  },
  {
    icon: Trophy,
    title: "Conocé el índice de accesibilidad",
    description:
      "Comparamos los barrios según sus reportes. Los que tienen más espacios accesibles puntúan más alto. Ayudá a tu barrio a mejorar.",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    cta: { label: "Ver índice", view: "indice" as const },
  },
  {
    icon: BarChart3,
    title: "Mirá las estadísticas en vivo",
    description:
      "Datos ciudadanos transformados en información útil: barreras más frecuentes, distribución por barrio y tendencias.",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    cta: { label: "Ver stats", view: "estadisticas" as const },
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = React.useState(false);
  const [step, setStep] = React.useState(0);
  const go = useAppStore((s) => s.go);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (!seen) {
        // Pequeño delay para que la página cargue primero
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const markSeen = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const handleClose = (navigateTo?: typeof STEPS[number]["cta"]["view"]) => {
    setOpen(false);
    markSeen();
    if (navigateTo) {
      setTimeout(() => go(navigateTo), 200);
    }
  };

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0"
        showCloseButton={false}
      >
        {/* Close button */}
        <button
          onClick={() => handleClose()}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-background hover:text-foreground focus-ring"
          aria-label="Omitir"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1.5 bg-muted/30 px-4 py-3">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === step
                  ? "w-6 bg-primary"
                  : i < step
                  ? "w-1.5 bg-primary/60"
                  : "w-1.5 bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-5 p-6 pt-4"
          >
            <div className="flex flex-col items-center text-center">
              <span
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl",
                  current.color
                )}
              >
                <Icon className="h-8 w-8" />
              </span>
              <h2 className="mt-4 text-xl font-bold tracking-tight">
                {current.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {current.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClose()}
                className="text-muted-foreground"
              >
                Omitir
              </Button>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStep(step - 1)}
                  >
                    Atrás
                  </Button>
                )}
                {isLast ? (
                  <Button size="sm" onClick={() => handleClose(current.cta.view)}>
                    <Check className="mr-1.5 h-4 w-4" />
                    Comenzar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setStep(step + 1)}
                  >
                    Siguiente
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Footer con CTA directo */}
        <div className="border-t border-border/60 bg-muted/20 p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={() => handleClose(current.cta.view)}
          >
            {current.cta.label} ahora
            <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
