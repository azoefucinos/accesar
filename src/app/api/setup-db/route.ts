import { NextResponse } from "next/server";
import { createClient } from "@libsql/client";

// Endpoint TEMPORAL que crea la tabla Report directamente en Turso.
// Visitar una sola vez para inicializar la base. Borrar después.
export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    return NextResponse.json(
      { error: "Faltan variables de entorno de Turso" },
      { status: 500 }
    );
  }

  const client = createClient({
    url: tursoUrl,
    authToken: tursoToken,
  });

  const results: Record<string, unknown> = {};

  try {
    // Crear tabla Report con el mismo schema que prisma/schema.prisma
    await client.execute(`
      CREATE TABLE IF NOT EXISTS "Report" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "category" TEXT NOT NULL,
        "severity" TEXT NOT NULL,
        "description" TEXT,
        "address" TEXT NOT NULL,
        "neighborhood" TEXT NOT NULL,
        "lat" REAL NOT NULL,
        "lng" REAL NOT NULL,
        "imageUrl" TEXT,
        "status" TEXT NOT NULL DEFAULT 'activo',
        "upvotes" INTEGER NOT NULL DEFAULT 0,
        "resolvedAt" DATETIME,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )
    `);
    results.createTable = "OK";

    // Crear índices
    await client.execute(
      `CREATE INDEX IF NOT EXISTS "Report_neighborhood_idx" ON "Report"("neighborhood")`
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS "Report_category_idx" ON "Report"("category")`
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS "Report_severity_idx" ON "Report"("severity")`
    );
    await client.execute(
      `CREATE INDEX IF NOT EXISTS "Report_status_idx" ON "Report"("status")`
    );
    results.createIndexes = "OK";

    // Verificar que la tabla existe ahora
    const checkRes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='Report'"
    );
    results.reportTableExistsAfter = checkRes.rows.length > 0;

    // Listar todas las tablas
    const tablesRes = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    results.allTables = tablesRes.rows.map((r) => r.name);

    return NextResponse.json({
      success: true,
      message: "Tabla Report creada (o ya existía)",
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: "Error al crear la tabla",
        message: e instanceof Error ? e.message : String(e),
        name: e instanceof Error ? e.name : "Unknown",
      },
      { status: 500 }
    );
  }
}
