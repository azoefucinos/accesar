// Endpoint TEMPORAL de diagnóstico para ver qué variables de entorno
// llegan al runtime de Vercel. Borrar después de debug.
import { NextResponse } from "next/server";

export async function GET() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const databaseUrl = process.env.DATABASE_URL;
  const nodeEnv = process.env.NODE_ENV;
  const vercelEnv = process.env.VERCEL_ENV;

  return NextResponse.json({
    environment: {
      NODE_ENV: nodeEnv ?? null,
      VERCEL_ENV: vercelEnv ?? null,
    },
    variables: {
      TURSO_DATABASE_URL: {
        defined: typeof tursoUrl === "string" && tursoUrl.length > 0,
        length: tursoUrl?.length ?? 0,
        startsWithLibsql: tursoUrl?.startsWith("libsql://") ?? false,
        first20chars: tursoUrl?.substring(0, 20) ?? null,
        isLiteralUndefinedString: tursoUrl === "undefined",
      },
      TURSO_AUTH_TOKEN: {
        defined: typeof tursoToken === "string" && tursoToken.length > 0,
        length: tursoToken?.length ?? 0,
        startsWithEyJ: tursoToken?.startsWith("eyJ") ?? false,
      },
      DATABASE_URL: {
        defined: typeof databaseUrl === "string" && databaseUrl.length > 0,
        length: databaseUrl?.length ?? 0,
        startsWithLibsql: databaseUrl?.startsWith("libsql://") ?? false,
        startsWithFile: databaseUrl?.startsWith("file:") ?? false,
        first20chars: databaseUrl?.substring(0, 20) ?? null,
      },
    },
    diagnosis: diagnose(tursoUrl, tursoToken, databaseUrl),
    timestamp: new Date().toISOString(),
  });
}

function diagnose(
  tursoUrl: string | undefined,
  tursoToken: string | undefined,
  databaseUrl: string | undefined
): string[] {
  const notes: string[] = [];

  if (!tursoUrl) {
    notes.push("❌ TURSO_DATABASE_URL no está definida en runtime");
  } else if (tursoUrl === "undefined") {
    notes.push("❌ TURSO_DATABASE_URL es literalmente la string 'undefined' (se guardó mal en Vercel)");
  } else if (!tursoUrl.startsWith("libsql://")) {
    notes.push("❌ TURSO_DATABASE_URL no empieza con 'libsql://'");
  } else {
    notes.push("✅ TURSO_DATABASE_URL OK");
  }

  if (!tursoToken) {
    notes.push("❌ TURSO_AUTH_TOKEN no está definida en runtime");
  } else if (!tursoToken.startsWith("eyJ")) {
    notes.push("⚠️ TURSO_AUTH_TOKEN no empieza con 'eyJ' (formato JWT)");
  } else {
    notes.push("✅ TURSO_AUTH_TOKEN OK");
  }

  if (!databaseUrl) {
    notes.push("❌ DATABASE_URL no está definida en runtime");
  } else if (databaseUrl === "undefined") {
    notes.push("❌ DATABASE_URL es literalmente la string 'undefined'");
  } else if (!databaseUrl.startsWith("libsql://")) {
    notes.push("⚠️ DATABASE_URL no empieza con 'libsql://' (¿es file:...?)");
  } else {
    notes.push("✅ DATABASE_URL OK");
  }

  if (tursoUrl && databaseUrl && tursoUrl !== databaseUrl) {
    notes.push("⚠️ TURSO_DATABASE_URL y DATABASE_URL son DIFERENTES - deberían ser idénticas");
  }

  return notes;
}
