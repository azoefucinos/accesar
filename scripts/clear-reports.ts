import { db } from "../src/lib/db";

async function main() {
  const before = await db.report.count();
  console.log(`Reportes antes: ${before}`);
  const deleted = await db.report.deleteMany({});
  console.log(`Eliminados: ${deleted.count}`);
  const after = await db.report.count();
  console.log(`Reportes después: ${after}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
