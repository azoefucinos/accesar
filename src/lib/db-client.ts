// Cliente libsql compartido para bypass de Prisma.
// Usa @libsql/client directamente (igual que /api/setup-db que funciona).
import { createClient, type Client } from "@libsql/client";

let _client: Client | null = null;

export function getDb(): Client {
  if (_client) return _client;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl && tursoUrl.startsWith("libsql://") && tursoToken) {
    _client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });
    return _client;
  }

  // Local SQLite (no usado en producción Vercel)
  const databaseUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";
  _client = createClient({
    url: databaseUrl,
  });
  return _client;
}

// Tipo Report igual al de Prisma
export interface ReportRow {
  id: string;
  category: string;
  severity: string;
  description: string | null;
  address: string;
  neighborhood: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
  status: string;
  upvotes: number;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Convierte una fila de libsql a un objeto Report con tipos correctos
export function rowToReport(row: Record<string, unknown>): ReportRow {
  return {
    id: String(row.id),
    category: String(row.category),
    severity: String(row.severity),
    description: row.description === null ? null : String(row.description),
    address: String(row.address),
    neighborhood: String(row.neighborhood),
    lat: Number(row.lat),
    lng: Number(row.lng),
    imageUrl: row.imageUrl === null ? null : String(row.imageUrl),
    status: String(row.status),
    upvotes: Number(row.upvotes),
    resolvedAt: row.resolvedAt === null ? null : String(row.resolvedAt),
    createdAt: String(row.createdAt),
    updatedAt: String(row.updatedAt),
  };
}

// Genera un ID tipo cuid (simplificado)
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  const random2 = Math.random().toString(36).substring(2, 10);
  return `c${timestamp}${random}${random2}`;
}
