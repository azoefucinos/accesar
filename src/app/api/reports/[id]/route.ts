import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToReport } from "@/lib/db-client";
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

// GET /api/reports/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const result = await db.execute({
      sql: "SELECT * FROM Report WHERE id = ?",
      args: [id],
    });
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }
    const report = rowToReport(result.rows[0] as Record<string, unknown>);
    return NextResponse.json({ report });
  } catch (e) {
    console.error("GET /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al obtener el reporte", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await req.json()) as Partial<UpdateReportInput>;
    const db = getDb();

    // Verificar que existe
    const existingResult = await db.execute({
      sql: "SELECT * FROM Report WHERE id = ?",
      args: [id],
    });
    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }
    const existing = rowToReport(existingResult.rows[0] as Record<string, unknown>);

    const setClauses: string[] = [];
    const args: unknown[] = [];

    if (body.category !== undefined) {
      if (!isValidCategory(body.category)) {
        return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
      }
      setClauses.push("category = ?");
      args.push(body.category);
    }

    if (body.severity !== undefined) {
      if (!isValidSeverity(body.severity)) {
        return NextResponse.json({ error: "Severidad inválida" }, { status: 400 });
      }
      setClauses.push("severity = ?");
      args.push(body.severity);
    }

    if (body.description !== undefined) {
      setClauses.push("description = ?");
      args.push(body.description?.trim() || null);
    }

    if (body.address !== undefined) {
      if (!body.address.trim()) {
        return NextResponse.json({ error: "La dirección es obligatoria" }, { status: 400 });
      }
      setClauses.push("address = ?");
      args.push(body.address.trim());
    }

    if (body.neighborhood !== undefined) {
      if (!NEIGHBORHOOD_NAMES.includes(body.neighborhood)) {
        return NextResponse.json({ error: "Barrio inválido" }, { status: 400 });
      }
      setClauses.push("neighborhood = ?");
      args.push(body.neighborhood);
    }

    if (body.lat !== undefined && body.lng !== undefined) {
      if (
        typeof body.lat !== "number" ||
        typeof body.lng !== "number" ||
        Number.isNaN(body.lat) ||
        Number.isNaN(body.lng)
      ) {
        return NextResponse.json({ error: "Coordenadas inválidas" }, { status: 400 });
      }
      setClauses.push("lat = ?");
      args.push(body.lat);
      setClauses.push("lng = ?");
      args.push(body.lng);
    }

    if (body.status !== undefined) {
      if (!isValidStatus(body.status)) {
        return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
      }
      setClauses.push("status = ?");
      args.push(body.status);
      if (body.status === "resuelto" && !existing.resolvedAt) {
        setClauses.push("resolvedAt = ?");
        args.push(new Date().toISOString());
      } else if (body.status !== "resuelto") {
        setClauses.push("resolvedAt = ?");
        args.push(null);
      }
    }

    if (setClauses.length === 0) {
      // Nada que actualizar
      return NextResponse.json({ report: existing });
    }

    setClauses.push("updatedAt = ?");
    args.push(new Date().toISOString());
    args.push(id);

    await db.execute({
      sql: `UPDATE Report SET ${setClauses.join(", ")} WHERE id = ?`,
      args,
    });

    // Fetch updated
    const updatedResult = await db.execute({
      sql: "SELECT * FROM Report WHERE id = ?",
      args: [id],
    });
    const updated = rowToReport(updatedResult.rows[0] as Record<string, unknown>);
    return NextResponse.json({ report: updated });
  } catch (e) {
    console.error("PATCH /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al actualizar el reporte", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id]
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

    const db = getDb();
    const existingResult = await db.execute({
      sql: "SELECT id FROM Report WHERE id = ?",
      args: [id],
    });
    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "DELETE FROM Report WHERE id = ?",
      args: [id],
    });

    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("DELETE /api/reports/[id] error", e);
    return NextResponse.json(
      { error: "Error al eliminar el reporte", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
