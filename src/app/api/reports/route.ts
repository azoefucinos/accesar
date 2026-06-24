import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToReport, generateId, type ReportRow } from "@/lib/db-client";
import type { Category, CreateReportInput, ReportStatus, Severity } from "@/lib/types";
import { CATEGORIES, SEVERITIES, STATUSES } from "@/lib/constants";

function isValidCategory(v: string): v is Category {
  return CATEGORIES.some((c) => c.value === v);
}
function isValidSeverity(v: string): v is Severity {
  return SEVERITIES.includes(v as Severity);
}
function isValidStatus(v: string): v is ReportStatus {
  return STATUSES.includes(v as ReportStatus);
}

// GET /api/reports?category=...&severity=...&neighborhood=...&status=...&days=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const severity = searchParams.get("severity");
    const neighborhood = searchParams.get("neighborhood");
    const status = searchParams.get("status");
    const days = searchParams.get("days");
    const limit = Number(searchParams.get("limit") || "500");

    const conditions: string[] = [];
    const args: unknown[] = [];
    if (category && isValidCategory(category)) {
      conditions.push("category = ?");
      args.push(category);
    }
    if (severity && isValidSeverity(severity)) {
      conditions.push("severity = ?");
      args.push(severity);
    }
    if (neighborhood) {
      conditions.push("neighborhood = ?");
      args.push(neighborhood);
    }
    if (status && isValidStatus(status)) {
      conditions.push("status = ?");
      args.push(status);
    }
    if (days) {
      const n = parseInt(days, 10);
      if (!Number.isNaN(n) && n > 0) {
        const since = new Date();
        since.setDate(since.getDate() - n);
        conditions.push("createdAt >= ?");
        args.push(since.toISOString());
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const safeLimit = Math.min(limit, 1000);

    const db = getDb();
    const result = await db.execute({
      sql: `SELECT * FROM Report ${whereClause} ORDER BY createdAt DESC LIMIT ?`,
      args: [...args, safeLimit],
    });

    const reports = result.rows.map((row) => rowToReport(row as Record<string, unknown>));
    return NextResponse.json({ reports });
  } catch (e) {
    console.error("GET /api/reports error", e);
    const errorInfo: Record<string, unknown> = {
      error: "Error al obtener reportes",
      message: e instanceof Error ? e.message : String(e),
      code: (e as { code?: string })?.code,
    };
    return NextResponse.json(errorInfo, { status: 500 });
  }
}

// POST /api/reports
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateReportInput>;

    if (!body.category || !isValidCategory(body.category)) {
      return NextResponse.json(
        { error: "Categoría inválida", received: body.category },
        { status: 400 }
      );
    }
    if (!body.severity || !isValidSeverity(body.severity)) {
      return NextResponse.json(
        { error: "Severidad inválida", received: body.severity },
        { status: 400 }
      );
    }
    if (!body.address || !body.address.trim()) {
      return NextResponse.json(
        { error: "La dirección es obligatoria" },
        { status: 400 }
      );
    }
    if (!body.neighborhood || !body.neighborhood.trim()) {
      return NextResponse.json(
        { error: "El barrio es obligatorio" },
        { status: 400 }
      );
    }
    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number" ||
      Number.isNaN(body.lat) ||
      Number.isNaN(body.lng)
    ) {
      return NextResponse.json(
        { error: "Coordenadas inválidas", received: { lat: body.lat, lng: body.lng } },
        { status: 400 }
      );
    }

    const id = generateId();
    const now = new Date().toISOString();
    const description = body.description?.trim() || null;
    const imageUrl = body.imageUrl || null;

    const db = getDb();
    await db.execute({
      sql: `INSERT INTO Report (id, category, severity, description, address, neighborhood, lat, lng, imageUrl, status, upvotes, resolvedAt, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        body.category,
        body.severity,
        description,
        body.address.trim(),
        body.neighborhood.trim(),
        body.lat,
        body.lng,
        imageUrl,
        "activo",
        0,
        null,
        now,
        now,
      ],
    });

    // Fetch the created report
    const result = await db.execute({
      sql: "SELECT * FROM Report WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Error: reporte creado pero no encontrado" },
        { status: 500 }
      );
    }

    const created = rowToReport(result.rows[0] as Record<string, unknown>);
    return NextResponse.json({ report: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/reports error", e);
    const errorInfo: Record<string, unknown> = {
      error: "Error al crear el reporte",
      message: e instanceof Error ? e.message : String(e),
      code: (e as { code?: string })?.code,
      name: e instanceof Error ? e.name : "Unknown",
    };
    return NextResponse.json(errorInfo, { status: 500 });
  }
}
