import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { NeighborhoodStat, Severity } from "@/lib/types";
import { NEIGHBORHOODS } from "@/lib/constants";

export async function GET() {
  try {
    const reports = await db.report.findMany();

    const byNeigh = new Map<
      string,
      { grave: number; moderada: number; accesible: number; total: number }
    >();

    for (const r of reports) {
      const entry = byNeigh.get(r.neighborhood) || {
        grave: 0,
        moderada: 0,
        accesible: 0,
        total: 0,
      };
      if (r.severity === "grave") entry.grave++;
      else if (r.severity === "moderada") entry.moderada++;
      else entry.accesible++;
      entry.total++;
      byNeigh.set(r.neighborhood, entry);
    }

    const stats: NeighborhoodStat[] = NEIGHBORHOODS.map((n) => {
      const e = byNeigh.get(n.name) || {
        grave: 0,
        moderada: 0,
        accesible: 0,
        total: 0,
      };

      // Si no hay ningun reporte para este barrio, lo marcamos como "sin_datos".
      // No puede ser "el mas accesible" un barrio sobre el que no hay informacion.
      if (e.total === 0) {
        return {
          name: n.name,
          totalReports: 0,
          graveCount: 0,
          moderadaCount: 0,
          accesibleCount: 0,
          score: 0,
          level: "sin_datos" as const,
        };
      }

      // puntaje 0-100: mayor = mas accesible
      // penalizacion fuerte por barreras graves, bonus por espacios accesibles
      let score =
        100 - (e.grave * 12 + e.moderada * 6) + e.accesible * 4;
      score = Math.max(0, Math.min(100, Math.round(score)));

      let level: NeighborhoodStat["level"] = "optimo";
      if (score < 40) level = "critico";
      else if (score < 60) level = "atencion";
      else if (score < 80) level = "aceptable";

      return {
        name: n.name,
        totalReports: e.total,
        graveCount: e.grave,
        moderadaCount: e.moderada,
        accesibleCount: e.accesible,
        score,
        level,
      };
    }).sort((a, b) => {
      // Barrios con datos primero (por score desc), barrios sin datos al final
      if (a.level === "sin_datos" && b.level !== "sin_datos") return 1;
      if (a.level !== "sin_datos" && b.level === "sin_datos") return -1;
      // Si ambos tienen datos, ordenar por score descendente
      if (a.level !== "sin_datos" && b.level !== "sin_datos") {
        return b.score - a.score;
      }
      // Si ambos son sin_datos, ordenar alfabeticamente
      // (evita que Palermo siempre aparezca primero por orden de declaracion)
      return a.name.localeCompare(b.name, "es");
    });

    return NextResponse.json({ neighborhoods: stats });
  } catch (e) {
    console.error("GET /api/neighborhoods error", e);
    return NextResponse.json(
      { error: "Error al obtener índice de accesibilidad" },
      { status: 500 }
    );
  }
}

// Helper export para severidad (referencia)
export type { Severity };
