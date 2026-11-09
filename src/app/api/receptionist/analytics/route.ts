import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["resepsionis", "superadmin"]);

    const [
      totalLost,
      totalFound,
      totalHandover,
      totalExpiredFound,
      reportsByStatus,
      foundByStatus,
      categoriesData,
      locationsData,
    ] = await Promise.all([
      prisma.lostReport.count({ where: { deleted_at: null } }),
      prisma.foundItem.count(),
      prisma.handover.count(),
      prisma.foundItem.count({ where: { status: { in: ["TidakDiklaim", "Dialihkan"] } } }),
      prisma.lostReport.groupBy({
        by: ["status"],
        where: { deleted_at: null },
        _count: { id: true },
      }),
      prisma.foundItem.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      prisma.category.findMany({
        select: {
          id: true,
          nama: true,
          _count: {
            select: { lost_reports: true, found_items: true },
          },
        },
      }),
      prisma.location.findMany({
        select: {
          id: true,
          nama_gedung: true,
          nama_ruang: true,
          zona_area: true,
          _count: {
            select: { lost_reports: true, found_items: true },
          },
        },
      }),
    ]);

    // Return rate calculation (PRD Target >= 60%)
    const returnRate =
      totalFound > 0 ? Number(((totalHandover / totalFound) * 100).toFixed(1)) : 0;

    // Group locations by building
    const buildingMap: Record<string, { lostCount: number; foundCount: number }> = {};
    for (const loc of locationsData) {
      if (!buildingMap[loc.nama_gedung]) {
        buildingMap[loc.nama_gedung] = { lostCount: 0, foundCount: 0 };
      }
      buildingMap[loc.nama_gedung].lostCount += loc._count.lost_reports;
      buildingMap[loc.nama_gedung].foundCount += loc._count.found_items;
    }

    const topBuildings = Object.entries(buildingMap)
      .map(([gedung, data]) => ({ gedung, ...data, total: data.lostCount + data.foundCount }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      summary: {
        totalLost,
        totalFound,
        totalHandover,
        totalExpiredFound,
        returnRate,
      },
      reportsByStatus,
      foundByStatus,
      categories: categoriesData.map((c) => ({
        id: c.id,
        nama: c.nama,
        lostCount: c._count.lost_reports,
        foundCount: c._count.found_items,
      })),
      topBuildings,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Gagal memuat analitik." }, { status: 500 });
  }
}
