/**
 * Migrar datos del SQLite local a Turso.
 *
 * Uso:
 *   1. Configurar en .env:
 *        DATABASE_URL="file:./prisma/dev.db"            ← origen (local)
 *        TURSO_DATABASE_URL="libsql://xxx.turso.io"      ← destino (nube)
 *        TURSO_AUTH_TOKEN="eyJ..."
 *   2. Asegurarse de haber hecho `bun run db:push` con las vars de Turso
 *      para que las tablas existan en Turso.
 *   3. Correr: `bun run scripts/migrate-to-turso.ts`
 *
 * El script lee todos los reportes del SQLite local y los inserta en Turso.
 * Si un reporte con el mismo ID ya existe en Turso, se salta (upsert).
 */
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

async function main() {
  console.log('→ Conectando a origen (SQLite local)...')
  const source = new PrismaClient({
    log: ['query'],
  })

  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  if (!tursoUrl || !tursoUrl.startsWith('libsql://')) {
    console.error(
      '✗ Falta TURSO_DATABASE_URL (debe empezar con libsql://). Configurala en .env'
    )
    process.exit(1)
  }

  console.log(`→ Conectando a destino (Turso: ${tursoUrl})...`)
  const libsql = createClient({ url: tursoUrl, authToken: tursoToken })
  const adapter = new PrismaLibSql(libsql)
  const dest = new PrismaClient({ adapter })

  console.log('→ Leyendo reportes del origen...')
  const reports = await source.report.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`  Encontrados: ${reports.length} reportes`)

  if (reports.length === 0) {
    console.log('✓ No hay reportes para migrar. Listo.')
    await source.$disconnect()
    await dest.$disconnect()
    return
  }

  console.log('→ Insertando en Turso (upsert)...')
  let inserted = 0
  let skipped = 0
  for (const r of reports) {
    try {
      await dest.report.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          category: r.category,
          severity: r.severity,
          description: r.description,
          address: r.address,
          neighborhood: r.neighborhood,
          lat: r.lat,
          lng: r.lng,
          imageUrl: r.imageUrl,
          status: r.status,
          upvotes: r.upvotes,
          resolvedAt: r.resolvedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        },
        update: {},
      })
      inserted++
    } catch (e) {
      console.warn(`  Salteando ${r.id}: ${(e as Error).message}`)
      skipped++
    }
  }

  console.log(`\n✓ Migración completa.`)
  console.log(`  Insertados: ${inserted}`)
  console.log(`  Salteados (ya existían): ${skipped}`)

  await source.$disconnect()
  await dest.$disconnect()
}

main().catch((e) => {
  console.error('✗ Error:', e)
  process.exit(1)
})
