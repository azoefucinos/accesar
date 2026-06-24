import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Category, ReportStatus, Severity, UpdateReportInput } from "@/lib/types";
import {
  CATEGORIES,
  SEVERITIES,
  STATUSES,
  NEIGHBORHOOD_NAMES,
} from "@/lib/constants";

function isValidCategory(v: string): v is Category {
  return CATEGORIES.some((c) => c.value === v);
}
function isValidSeverity(v: string): v is Severity {
  return SEVERITIES.includes(v as Severity);
}
function isValidStatus(v: string): v is ReportStatus {
  return STATUSES.includes(v as ReportStatus);
}

// GET /api/reports/[id] - obtener un reporte por id
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }
    return NextResponse.json({ report });
  } catch (e) {
    console.error("GET /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al obtener el reporte" },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - editar un reporte (categoria, severidad, descripcion, status, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<UpdateReportInput>;

    const existing = await db.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    const data: Record<string, unknown> = {};

    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) {
        return NextResponse.json(
          { error: "Categoría inválida" },
          { status: 400 }
        );
      }
      data.category = body.category;
    }

    if (body.severity !== undefined) {
      if (!isValidSeverity(body.severity)) {
        return NextResponse.json(
          { error: "Severidad inválida" },
          { status: 400 }
        );
      }
      data.severity = body.severity;
    }

    if (body.description !== undefined) {
      data.description = body.description?.trim() || null;
    }

    if (body.address !== undefined) {
      if (!body.address.trim()) {
        return NextResponse.json(
          { error: "La dirección es obligatoria" },
          { status: 400 }
        );
      }
      data.address = body.address.trim();
    }

    if (body.neighborhood !== undefined) {
      if (!NEIGHBORHOOD_NAMES.includes(body.neighborhood)) {
        return NextResponse.json(
          { error: "Barrio inválido" },
          { status: 400 }
        );
      }
      data.neighborhood = body.neighborhood;
    }

    if (body.lat !== undefined && body.lng !== undefined) {
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
      data.lat = body.lat;
      data.lng = body.lng;
    }

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json(
          { error: "Estado inválido" },
          { status: 400 }
        );
      }
      data.status = body.status;
      // Si pasa a resuelto, marcar fecha de resolucion
      if (body.status === "resuelto" && !existing.resolvedAt) {
        data.resolvedAt = new Date();
      } else if (body.status !== "resuelto") {
        data.resolvedAt = null;
      }
    }

    const updated = await db.report.update({
      where: { id },
      data,
    });

    return NextResponse.json({ report: updated });
  } catch (e) {
    console.error("PATCH /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al actualizar el reporte" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id]
// Elimina un reporte por su id. Cualquier persona puede eliminar un reporte
// (MVP colaborativo: la comunidad modera el contenido).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "ID de reporte requerido" },
        { status: 400 }
      );
    }

    // Verificar que existe antes de borrar
    const existing = await db.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    await db.report.delete({ where: { id } });

    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("DELETE /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al eliminar el reporte" },
      { status: 500 }
    );
  }
}
