// AccesAR - Tipos compartidos

export type Severity = "grave" | "moderada" | "accesible";

export type Category =
  | "falta_rampa"
  | "vereda_deteriorada"
  | "obstaculo_fisico"
  | "cruce_inseguro"
  | "acceso_inaccesible"
  | "otro";

export type ReportStatus = "activo" | "en_proceso" | "resuelto";

export interface Report {
  id: string;
  category: Category;
  severity: Severity;
  description: string | null;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  status: ReportStatus;
  upvotes: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReportInput {
  category: Category;
  severity: Severity;
  description?: string;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  imageUrl?: string | null;
}

export interface UpdateReportInput {
  category?: Category;
  severity?: Severity;
  description?: string | null;
  address?: string;
  neighborhood?: string;
  lat?: number;
  lng?: number;
  status?: ReportStatus;
}

export interface NeighborhoodStat {
  name: string;
  totalReports: number;
  graveCount: number;
  moderadaCount: number;
  accesibleCount: number;
  // puntaje 0-100, mayor = mas accesible
  score: number;
  level: "critico" | "atencion" | "aceptable" | "optimo" | "sin_datos";
}

export interface DashboardStats {
  totalReports: number;
  totalNeighborhoods: number;
  totalBarriers: number;
  accessibleSpaces: number;
  resolvedCount?: number;
  totalConfirmations?: number;
  byCategory: { category: Category; label: string; count: number }[];
  bySeverity: { severity: Severity; count: number }[];
  byStatus?: { status: ReportStatus; count: number }[];
  byNeighborhood: { neighborhood: string; count: number }[];
  byMonth: { month: string; count: number }[];
  recentTrend: { date: string; count: number }[];
}

export interface ClassificationResult {
  category: Category;
  severity: Severity;
  confidence: number;
  reasoning: string;
  suggested: boolean;
}

export interface Recommendation {
  neighborhood: string;
  priority: "alta" | "media" | "baja";
  type: string;
  title: string;
  description: string;
}
