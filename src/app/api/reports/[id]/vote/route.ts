import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db-client";

// POST /api/reports/[id]/vote
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();

    const existingResult = await db.execute({
      sql: "SELECT id, upvotes FROM Report WHERE id = ?",
      args: [id],
    });
    if (existingResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    await db.execute({
      sql: "UPDATE Report SET upvotes = upvotes + 1, updatedAt = ? WHERE id = ?",
      args: [new Date().toISOString(), id],
    });

    const updatedResult = await db.execute({
      sql: "SELECT upvotes FROM Report WHERE id = ?",
      args: [id],
    });
    const upvotes = Number(updatedResult.rows[0]?.upvotes ?? 0);

    return NextResponse.json({
      success: true,
      id,
      upvotes,
    });
  } catch (e) {
    console.error("POST /api/reports/[id]/vote error", e);
    return NextResponse.json(
      { error: "Error al registrar la confirmación", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
