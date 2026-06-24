// AccesAR - Constantes del dominio

import type { Category, ReportStatus, Severity } from "./types";

export const CATEGORIES: { value: Category; label: string; short: string }[] = [
  { value: "falta_rampa", label: "Falta de rampa", short: "Rampa" },
  { value: "vereda_deteriorada", label: "Vereda deteriorada", short: "Vereda" },
  { value: "obstaculo_fisico", label: "Obstáculo físico", short: "Obstáculo" },
  { value: "cruce_inseguro", label: "Cruce inseguro", short: "Cruce" },
  { value: "acceso_inaccesible", label: "Acceso inaccesible", short: "Acceso" },
  { value: "otro", label: "Otro", short: "Otro" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  falta_rampa: "Falta de rampa",
  vereda_deteriorada: "Vereda deteriorada",
  obstaculo_fisico: "Obstáculo físico",
  cruce_inseguro: "Cruce inseguro",
  acceso_inaccesible: "Acceso inaccesible",
  otro: "Otro",
};

export const CATEGORY_SHORT: Record<Category, string> = {
  falta_rampa: "Rampa",
  vereda_deteriorada: "Vereda",
  obstaculo_fisico: "Obstáculo",
  cruce_inseguro: "Cruce",
  acceso_inaccesible: "Acceso",
  otro: "Otro",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  grave: "Barrera grave",
  moderada: "Barrera moderada",
  accesible: "Espacio accesible",
};

// Colores de severidad - rojo / amarillo / verde
export const SEVERITY_COLOR: Record<Severity, { bg: string; text: string; dot: string; ring: string; hex: string }> = {
  grave: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
    ring: "ring-red-500/30",
    hex: "#ef4444",
  },
  moderada: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
    ring: "ring-amber-500/30",
    hex: "#f59e0b",
  },
  accesible: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    hex: "#10b981",
  },
};

// Barrios de Buenos Aires con coordenadas reales aproximadas
export const NEIGHBORHOODS: { name: string; lat: number; lng: number }[] = [
  { name: "Palermo", lat: -34.5889, lng: -58.4305 },
  { name: "Belgrano", lat: -34.5622, lng: -58.4539 },
  { name: "Caballito", lat: -34.6285, lng: -58.4357 },
  { name: "Recoleta", lat: -34.5875, lng: -58.3933 },
  { name: "Almagro", lat: -34.6037, lng: -58.4193 },
  { name: "Flores", lat: -34.6289, lng: -58.4647 },
  { name: "San Telmo", lat: -34.6211, lng: -58.3697 },
  { name: "La Boca", lat: -34.6356, lng: -58.3647 },
  { name: "Villa Urquiza", lat: -34.5675, lng: -58.4833 },
  { name: "Puerto Madero", lat: -34.6106, lng: -58.3636 },
  { name: "Microcentro", lat: -34.6037, lng: -58.3816 },
  { name: "Villa Crespo", lat: -34.5983, lng: -58.4333 },
  { name: "Núñez", lat: -34.5478, lng: -58.4608 },
  { name: "Balvanera", lat: -34.6056, lng: -58.4128 },
  { name: "Barracas", lat: -34.6422, lng: -58.3833 },
];

// Limites para proyectar coordenadas reales -> SVG
export const MAP_BOUNDS = {
  minLat: -34.66,
  maxLat: -34.53,
  minLng: -58.51,
  maxLng: -58.35,
};

export const NEIGHBORHOOD_NAMES = NEIGHBORHOODS.map((n) => n.name);

export const SEVERITIES: Severity[] = ["grave", "moderada", "accesible"];

// Estados del ciclo de vida de un reporte
export const STATUSES: ReportStatus[] = ["activo", "en_proceso", "resuelto"];

export const STATUS_LABEL: Record<ReportStatus, string> = {
  activo: "Activo",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export const STATUS_META: Record<
  ReportStatus,
  { label: string; bg: string; text: string; dot: string; ring: string; hex: string }
> = {
  activo: {
    label: "Activo",
    bg: "bg-sky-50 dark:bg-sky-950/40",
    text: "text-sky-700 dark:text-sky-300",
    dot: "bg-sky-500",
    ring: "ring-sky-500/30",
    hex: "#0ea5e9",
  },
  en_proceso: {
    label: "En proceso",
    bg: "bg-violet-50 dark:bg-violet-950/40",
    text: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
    ring: "ring-violet-500/30",
    hex: "#8b5cf6",
  },
  resuelto: {
    label: "Resuelto",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/30",
    hex: "#10b981",
  },
};

export function severityWeight(s: Severity): number {
  if (s === "grave") return 3;
  if (s === "moderada") return 1.5;
  return 0;
}
