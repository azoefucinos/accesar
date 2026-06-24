import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __prismaSchemaVersion?: string
}

// Schema version - bump this when prisma schema changes to force a fresh client.
const SCHEMA_VERSION = 'v3-turso-driver-adapter'

// If the schema version changed, dispose the old client so the new one
// picks up the updated Prisma Client runtime (new fields, etc.).
if (globalForPrisma.__prismaSchemaVersion !== SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      /* ignore */
    }
  }
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaSchemaVersion = SCHEMA_VERSION
}

function createPrismaClient(): PrismaClient {
  // 1) Producción / Turso: usar TURSO_DATABASE_URL + TURSO_AUTH_TOKEN
  const tursoUrl = process.env.TURSO_DATABASE_URL
  const tursoToken = process.env.TURSO_AUTH_TOKEN

  // Debug: log sin exponer el valor completo
  if (process.env.NODE_ENV === 'production') {
    console.log('[db] TURSO_DATABASE_URL defined:', !!tursoUrl, 'len:', tursoUrl?.length ?? 0)
    console.log('[db] TURSO_AUTH_TOKEN defined:', !!tursoToken, 'len:', tursoToken?.length ?? 0)
    console.log('[db] DATABASE_URL defined:', !!process.env.DATABASE_URL)
  }

  // Filtrar el caso en que la variable sea literalmente la string "undefined"
  // (pasa si en Vercel se guardó mal, ej: nombre=valor en vez de solo valor)
  const cleanTursoUrl =
    tursoUrl && tursoUrl !== 'undefined' && tursoUrl.length > 0 ? tursoUrl : undefined

  if (cleanTursoUrl && cleanTursoUrl.startsWith('libsql://')) {
    if (!tursoToken || tursoToken === 'undefined') {
      throw new Error(
        'TURSO_AUTH_TOKEN no está definido. Revisá las variables de entorno en Vercel.'
      )
    }
    const libsql = createClient({
      url: cleanTursoUrl,
      authToken: tursoToken,
    })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // 2) Local: SQLite en archivo (DATABASE_URL=file:...)
  //    Se mantiene la logging de queries solo en desarrollo.
  return new PrismaClient({
    log: process.env.NODE_ENV !== 'production' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
