import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Category, Recommendation } from "@/lib/types";
import { CATEGORY_LABEL } from "@/lib/constants";

export async function GET() {
  try {
    const reports = await db.report.findMany();

    // Agrupar por barrio + categoria
    const matrix = new Map<string, Map<Category, { grave: number; total: number }>>();
    for (const r of reports) {
      if (!matrix.has(r.neighborhood)) matrix.set(r.neighborhood, new Map());
      const catMap = matrix.get(r.neighborhood)!;
      const cat = r.category as Category;
      const entry = catMap.get(cat) || { grave: 0, total: 0 };
      entry.total++;
      if (r.severity === "grave") entry.grave++;
      catMap.set(cat, entry);
    }

    const recommendations: Recommendation[] = [];

    const TYPE_BY_CAT: Record<Category, string> = {
      falta_rampa: "Construcción de rampas",
      vereda_deteriorada: "Reparación de veredas",
      obstaculo_fisico: "Remoción de obstáculos",
      cruce_inseguro: "Seguridad vial peatonal",
      acceso_inaccesible: "Adaptación de accesos",
      otro: "Intervención urbana",
    };

    const TITLE_BY_CAT: Record<Category, string> = {
      falta_rampa: `Construir rampas accesibles en ${""}`,
      vereda_deteriorada: `Reparar veredas deterioradas en ${""}`,
      obstaculo_fisico: `Eliminar obstáculos físicos en ${""}`,
      cruce_inseguro: `Mejorar cruces peatonales en ${""}`,
      acceso_inaccesible: `Adaptar accesos en edificios de ${""}`,
      otro: `Intervención urbana en ${""}`,
    };

    const DESC_BY_CAT: Record<Category, string> = {
      falta_rampa:
        "Se detectaron múltiples esquinas sin rampa. Priorizar la construcción de rampas con pendiente adecuada y piso táctil en las intersecciones identificadas.",
      vereda_deteriorada:
        "Se relevaron veredas con baldosas rotas y hundimientos. Programar reparación integral de pavimento peatonal y regularización de desniveles.",
      obstaculo_fisico:
        "Se identificaron obstáculos que reducen el ancho de circulación. Reubicar postes, regular ocupación de vereda por obras y mobiliario urbano.",
      cruce_inseguro:
        "Se reportaron cruces con sendilla borrada y semáforos cortos. Repintar sendas peatonales, ajustar tiempos peatonales y mejorar visibilidad.",
      acceso_inaccesible:
        "Se detectaron accesos sin rampa a negocios y edificios. Incentivar la adaptación de accesos y señalización de alternativas accesibles.",
      otro:
        "Se relevaron barreras urbanas diversas. Realizar un diagnóstico de movilidad detallado en la zona afectada.",
    };

    for (const [neighborhood, catMap] of matrix.entries()) {
      for (const [cat, entry] of catMap.entries()) {
        // Solo recomendar si hay al menos 2 reportes de esa categoria en el barrio
        if (entry.total < 2) continue;
        let priority: Recommendation["priority"] = "baja";
        if (entry.grave >= 2 || entry.total >= 4) priority = "alta";
        else if (entry.grave >= 1 || entry.total >= 3) priority = "media";

        recommendations.push({
          neighborhood,
          priority,
          type: TYPE_BY_CAT[cat],
          title: TITLE_BY_CAT[cat].replace(" en ", ` en ${neighborhood} · ${CATEGORY_LABEL[cat]}`),
          description: `${DESC_BY_CAT[cat]} (${entry.total} reportes, ${entry.grave} graves)`,
        });
      }
    }

    // Ordenar por prioridad
    const order = { alta: 0, media: 1, baja: 2 };
    recommendations.sort((a, b) => order[a.priority] - order[b.priority]);

    return NextResponse.json({ recommendations });
  } catch (e) {
    console.error("GET /api/recommendations error", e);
    return NextResponse.json(
      { error: "Error al generar recomendaciones" },
      { status: 500 }
    );
  }
}
