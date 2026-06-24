import { db } from "../src/lib/db";
async function main() {
  const deleted = await db.report.deleteMany({});
  console.log(`Eliminados: ${deleted.count}`);
  const count = await db.report.count();
  console.log(`Reportes restantes: ${count}`);
}
main().finally(() => db.$disconnect());
