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

  if (tursoUrl && tursoUrl.startsWith('libsql://')) {
    const libsql = createClient({
      url: tursoUrl,
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
