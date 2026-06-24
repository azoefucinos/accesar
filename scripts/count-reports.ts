import { db } from "../src/lib/db";
async function main() {
  const count = await db.report.count();
  console.log(`Total reportes: ${count}`);
  const recent = await db.report.findMany({ orderBy: { createdAt: "desc" }, take: 3 });
  for (const r of recent) {
    console.log(`- ${r.address} | ${r.neighborhood} | ${r.category} | ${r.severity} | ${r.createdAt.toISOString()}`);
  }
}
main().finally(() => db.$disconnect());
