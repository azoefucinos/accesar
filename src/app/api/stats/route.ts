import { NextRequest, NextResponse } from "next/server";
import { getDb, rowToReport } from "@/lib/db-client";
import type { Category, DashboardStats, ReportStatus, Severity } from "@/lib/types";
import { CATEGORY_LABEL, NEIGHBORHOOD_NAMES } from "@/lib/constants";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const days = searchParams.get("days");

    const db = getDb();
    let result;
    if (days) {
      const n = parseInt(days, 10);
      if (!Number.isNaN(n) && n > 0) {
        const since = new Date();
        since.setDate(since.getDate() - n);
        result = await db.execute({
          sql: "SELECT * FROM Report WHERE createdAt >= ? ORDER BY createdAt DESC",
          args: [since.toISOString()],
        });
      } else {
        result = await db.execute("SELECT * FROM Report ORDER BY createdAt DESC");
      }
    } else {
      result = await db.execute("SELECT * FROM Report ORDER BY createdAt DESC");
    }

    const reports = result.rows.map((row) => rowToReport(row as Record<string, unknown>));

    const totalReports = reports.length;
    const totalNeighborhoods = new Set(reports.map((r) => r.neighborhood)).size;
    const totalBarriers = reports.filter(
      (r) => r.severity === "grave" || r.severity === "moderada"
    ).length;
    const accessibleSpaces = reports.filter((r) => r.severity === "accesible").length;
    const resolvedCount = reports.filter((r) => r.status === "resuelto").length;
    const totalUpvotes = reports.reduce((sum, r) => sum + (r.upvotes || 0), 0);
    const totalConfirmations = totalUpvotes;

    const catMap = new Map<Category, number>();
    for (const r of reports) {
      catMap.set(r.category as Category, (catMap.get(r.category as Category) || 0) + 1);
    }
    const byCategory = Array.from(catMap.entries())
      .map(([category, count]) => ({
        category,
        label: CATEGORY_LABEL[category],
        count,
      }))
      .sort((a, b) => b.count - a.count);

    const sevMap = new Map<Severity, number>();
    for (const r of reports) {
      sevMap.set(r.severity as Severity, (sevMap.get(r.severity as Severity) || 0) + 1);
    }
    const bySeverity = (["grave", "moderada", "accesible"] as Severity[]).map(
      (severity) => ({ severity, count: sevMap.get(severity) || 0 })
    );

    const neighMap = new Map<string, number>();
    for (const r of reports) {
      neighMap.set(r.neighborhood, (neighMap.get(r.neighborhood) || 0) + 1);
    }
    const byNeighborhood = NEIGHBORHOOD_NAMES.map((n) => ({
      neighborhood: n,
      count: neighMap.get(n) || 0,
    }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);

    const statusMap = new Map<ReportStatus, number>();
    for (const r of reports) {
      statusMap.set(r.status as ReportStatus, (statusMap.get(r.status as ReportStatus) || 0) + 1);
    }
    const byStatus = (["activo", "en_proceso", "resuelto"] as ReportStatus[]).map(
      (status) => ({ status, count: statusMap.get(status) || 0 })
    );

    const now = new Date();
    const months: { month: string; count: number; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("es-AR", { month: "short" });
      months.push({ month: label, count: 0, key });
    }
    for (const r of reports) {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m = months.find((x) => x.key === key);
      if (m) m.count++;
    }

    const recentTrend: { date: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setHours(23, 59, 59, 999);
      const count = reports.filter((r) => {
        const rd = new Date(r.createdAt);
        return rd >= dayStart && rd <= dayEnd;
      }).length;
      recentTrend.push({ date: label, count });
    }

    const stats: DashboardStats & {
      resolvedCount: number;
      totalConfirmations: number;
      byStatus: { status: ReportStatus; count: number }[];
    } = {
      totalReports,
      totalNeighborhoods,
      totalBarriers,
      accessibleSpaces,
      resolvedCount,
      totalConfirmations,
      byCategory,
      bySeverity,
      byNeighborhood,
      byStatus,
      byMonth: months.map(({ month, count }) => ({ month, count })),
      recentTrend,
    };

    return NextResponse.json(stats);
  } catch (e) {
    console.error("GET /api/stats error", e);
    return NextResponse.json(
      { error: "Error al obtener estadísticas", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
