import { NextRequest, NextResponse } from "next/server";
import { NEIGHBORHOODS } from "@/lib/constants";

// GET /api/geocode?q=<direccion>
// Usa Nominatim (OpenStreetMap) para geocodificar una direccion en CABA.
// Devuelve { lat, lng, displayName, neighborhood } donde neighborhood es el
// barrio de la lista de AccesAR mas cercano a las coordenadas encontradas
// (o el que aparece en la direccion/displayName).
//
// Nominatim usage policy: max 1 request/second, identify app with User-Agent.
// https://operations.osmfoundation.org/policies/nominatim-usage-policy/
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 3) {
      return NextResponse.json({ results: [] });
    }

    // Limitar la busqueda a CABA (viewbox) para resultados mas precisos.
    // viewbox = lon1,lat1,lon2,lat2 (oeste,norte,este,sur)
    const viewbox = "-58.53,-34.53,-58.33,-34.67";
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", q);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ar");
    url.searchParams.set("viewbox", viewbox);
    url.searchParams.set("bounded", "1");
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url.toString(), {
      headers: {
        // Nominatim requiere un User-Agent identificando la app
        "User-Agent": "AccesAR/1.0 (plataforma de accesibilidad urbana)",
        "Accept-Language": "es",
      },
      // No cachear por defecto en dev
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "No se pudo geocodificar la dirección" },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{
      lat: string;
      lon: string;
      display_name: string;
      address?: {
        neighbourhood?: string;
        suburb?: string;
        city_district?: string;
        road?: string;
        house_number?: string;
      };
    }>;

    if (!data || data.length === 0) {
      return NextResponse.json({ results: [] });
    }

    const hit = data[0];
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json({ results: [] });
    }

    // Determinar el barrio: primero buscar en el address de Nominatim,
    // luego por cercania a las coordenadas de nuestros barrios conocidos.
    let neighborhood = "";
    const candidates = [
      hit.address?.neighbourhood,
      hit.address?.suburb,
      hit.address?.city_district,
    ].filter(Boolean) as string[];

    // Intentar matchear contra nuestros barrios conocidos
    for (const candidate of candidates) {
      const match = matchNeighborhood(candidate);
      if (match) {
        neighborhood = match;
        break;
      }
    }

    // Si no encontro por nombre, usar el mas cercano por coordenadas
    if (!neighborhood) {
      neighborhood = nearestNeighborhood(lat, lng);
    }

    return NextResponse.json({
      results: [
        {
          lat,
          lng,
          displayName: hit.display_name,
          neighborhood,
        },
      ],
    });
  } catch (e) {
    console.error("GET /api/geocode error", e);
    return NextResponse.json(
      { error: "Error al geocodificar" },
      { status: 500 }
    );
  }
}

// Matchea un texto (ej: "Palermo Soho") contra nuestros barrios conocidos.
function matchNeighborhood(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const n of NEIGHBORHOODS) {
    if (lower.includes(n.name.toLowerCase())) {
      return n.name;
    }
  }
  // Algunos alias comunes
  const aliases: Record<string, string> = {
    "microcentro": "Microcentro",
    "centro": "Microcentro",
    "palermo soho": "Palermo",
    "palermo hollywood": "Palermo",
    "palermo viejo": "Palermo",
  };
  for (const [alias, name] of Object.entries(aliases)) {
    if (lower.includes(alias)) return name;
  }
  return null;
}

function nearestNeighborhood(lat: number, lng: number): string {
  let best = NEIGHBORHOODS[0];
  let bestD = Infinity;
  for (const n of NEIGHBORHOODS) {
    const d = (n.lat - lat) ** 2 + (n.lng - lng) ** 2;
    if (d < bestD) {
      bestD = d;
      best = n;
    }
  }
  return best.name;
}
