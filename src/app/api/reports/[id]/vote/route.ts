import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// POST /api/reports/[id]/vote
// Suma una confirmacion ciudadana al reporte (upvote).
// MVP colaborativo: sin auth, cualquier persona puede confirmar.
// Usamos localStorage en el cliente para evitar votos duplicados.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await db.report.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Reporte no encontrado" },
        { status: 404 }
      );
    }

    const updated = await db.report.update({
      where: { id },
      data: { upvotes: { increment: 1 } },
    });

    return NextResponse.json({
      success: true,
      id,
      upvotes: updated.upvotes,
    });
  } catch (e) {
    console.error("POST /api/reports/[id]/vote error", e);
    return NextResponse.json(
      { error: "Error al registrar la confirmación" },
      { status: 500 }
    );
  }
}
