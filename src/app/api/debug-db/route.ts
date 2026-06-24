import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// Endpoint TEMPORAL de diagnóstico — prueba la conexión directa a Turso
// y lista las tablas que existen. Borrar después de debug.
export async function GET() {
  const results: Record<string, unknown> = {};

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  results.env = {
    tursoUrlDefined: !!tursoUrl,
    tursoTokenDefined: !!tursoToken,
    tursoUrlPreview: tursoUrl?.substring(0, 30),
  };

  if (!tursoUrl || !tursoToken) {
    return NextResponse.json({
      ...results,
      error: "Faltan variables de entorno de Turso",
    });
  }

  try {
    const client = createClient({
      url: tursoUrl,
      authToken: tursoToken,
    });

    // Test 1: listar tablas (en SQLite/libSQL las tablas están en sqlite_master)
    try {
      const tablesRes = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
      );
      results.tables = tablesRes.rows.map((r) => r.name);
      results.tablesCount = tablesRes.rows.length;
    } catch (e) {
      results.tablesError = e instanceof Error ? e.message : String(e);
    }

    // Test 2: ver si existe la tabla Report
    try {
      const checkRes = await client.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='Report'"
      );
      results.reportTableExists = checkRes.rows.length > 0;
    } catch (e) {
      results.reportTableCheckError = e instanceof Error ? e.message : String(e);
    }

    // Test 3: si existe, hacer un SELECT simple
    try {
      const countRes = await client.execute("SELECT COUNT(*) as count FROM Report");
      results.reportCount = countRes.rows[0]?.count ?? 0;
    } catch (e) {
      results.countError = e instanceof Error ? e.message : String(e);
    }

    // Test 4: ver el schema de la tabla Report si existe
    try {
      const schemaRes = await client.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='Report'"
      );
      results.reportSchema = schemaRes.rows[0]?.sql ?? null;
    } catch (e) {
      results.schemaError = e instanceof Error ? e.message : String(e);
    }

    return NextResponse.json({
      ...results,
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json({
      ...results,
      error: "Error al conectar con Turso",
      message: e instanceof Error ? e.message : String(e),
      name: e instanceof Error ? e.name : "Unknown",
      success: false,
    });
  }
}
