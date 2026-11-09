import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });

    const locations = await prisma.location.findMany({
      where: { aktif: true },
      orderBy: [{ nama_gedung: "asc" }, { nama_ruang: "asc" }],
    });

    return NextResponse.json({
      categories,
      locations,
    });
  } catch (error) {
    console.error("Master data fetch error:", error);
    return NextResponse.json({ error: "Gagal memuat master data" }, { status: 500 });
  }
}
