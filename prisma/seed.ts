// AccesAR - Seed script
// Limpia todos los reportes de la base de datos.
// AccesAR NO genera datos de ejemplo: todos los reportes son reales,
// creados por personas reales a través del formulario de reporte.

import { db } from "../src/lib/db";

async function main() {
  console.log("Limpiando reportes existentes...");
  const before = await db.report.count();
  console.log(`Reportes antes: ${before}`);
  const deleted = await db.report.deleteMany({});
  console.log(`Eliminados: ${deleted.count}`);
  const after = await db.report.count();
  console.log(`Reportes después: ${after}`);
  console.log("Listo. La base queda vacía — todos los reportes serán reales (creados por usuarios).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
