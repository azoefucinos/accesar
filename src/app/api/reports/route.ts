import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
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

    const where: Record<string, unknown> = {};
    if (category && isValidCategory(category)) where.category = category;
    if (severity && isValidSeverity(severity)) where.severity = severity;
    if (neighborhood) where.neighborhood = neighborhood;
    if (status && isValidStatus(status)) where.status = status;
    if (days) {
      const n = parseInt(days, 10);
      if (!Number.isNaN(n) && n > 0) {
        const since = new Date();
        since.setDate(since.getDate() - n);
        where.createdAt = { gte: since };
      }
    }

    const reports = await db.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 1000),
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("GET /api/reports error", e);
    return NextResponse.json(
      { error: "Error al obtener reportes" },
      { status: 500 }
    );
  }
}

// POST /api/reports
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<CreateReportInput>;

    if (!body.category || !isValidCategory(body.category)) {
      return NextResponse.json(
        { error: "Categoría inválida" },
        { status: 400 }
      );
    }
    if (!body.severity || !isValidSeverity(body.severity)) {
      return NextResponse.json(
        { error: "Severidad inválida" },
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
        { error: "Coordenadas inválidas" },
        { status: 400 }
      );
    }

    const created = await db.report.create({
      data: {
        category: body.category,
        severity: body.severity,
        description: body.description?.trim() || null,
        address: body.address.trim(),
        neighborhood: body.neighborhood.trim(),
        lat: body.lat,
        lng: body.lng,
        imageUrl: body.imageUrl || null,
        status: "activo",
      },
    });

    return NextResponse.json({ report: created }, { status: 201 });
  } catch (e) {
    console.error("POST /api/reports error", e);
    return NextResponse.json(
      { error: "Error al crear el reporte" },
      { status: 500 }
    );
  }
}
