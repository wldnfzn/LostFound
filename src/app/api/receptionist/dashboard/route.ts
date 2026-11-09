import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth(["resepsionis", "superadmin"]);

    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const [
      menungguVerifikasi,
      barangDisimpan,
      barangBernilaiTinggi,
      kandidatBaru,
      mendekatiBatasSimpan,
      serahTerimaBulanIni,
      laporanDilaporkan,
      recentFoundItems,
      recentLostReports,
    ] = await Promise.all([
      prisma.lostReport.count({
        where: { status: "MenungguVerifikasi", deleted_at: null },
      }),
      prisma.foundItem.count({
        where: { status: "Disimpan" },
      }),
      prisma.foundItem.count({
        where: { status: "Disimpan", bernilai_tinggi: true },
      }),
      prisma.match.count({
        where: { status: "kandidat" },
      }),
      prisma.foundItem.count({
        where: {
          status: "Disimpan",
          batas_simpan: { lte: sevenDaysFromNow },
        },
      }),
      prisma.handover.count({
        where: {
          waktu: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
      }),
      prisma.contentReport.count({
        where: { status: "Menunggu" },
      }),
      prisma.foundItem.findMany({
        take: 5,
        orderBy: { created_at: "desc" },
        include: { category: true, location: true },
      }),
      prisma.lostReport.findMany({
        where: { deleted_at: null },
        take: 5,
        orderBy: { created_at: "desc" },
        include: { category: true, location: true, user: { select: { nama: true } } },
      }),
    ]);

    return NextResponse.json({
      metrics: {
        menungguVerifikasi,
        barangDisimpan,
        barangBernilaiTinggi,
        kandidatBaru,
        mendekatiBatasSimpan,
        serahTerimaBulanIni,
        laporanDilaporkan,
      },
      recentFoundItems,
      recentLostReports,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Dashboard metrics error:", error);
    return NextResponse.json({ error: "Gagal memuat metrik dashboard." }, { status: 500 });
  }
}
