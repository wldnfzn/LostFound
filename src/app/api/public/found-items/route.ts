import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("category");
    const gedung = searchParams.get("gedung");
    const search = searchParams.get("search") || "";

    const where: any = {
      status: "Disimpan",
    };

    if (categoryId && categoryId !== "all") {
      where.category_id = parseInt(categoryId, 10);
    }

    if (gedung && gedung !== "all") {
      where.location = {
        nama_gedung: gedung,
      };
    }

    if (search.trim()) {
      where.OR = [
        { judul_publik: { contains: search.trim() } },
        { deskripsi: { contains: search.trim() } },
        { kode_barang: { contains: search.trim() } },
      ];
    }

    const items = await prisma.foundItem.findMany({
      where,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        kode_barang: true,
        judul_publik: true,
        deskripsi: true, // safe public description
        tanggal_temuan: true,
        bernilai_tinggi: true,
        is_dokumen_identitas: true,
        category: {
          select: { id: true, nama: true },
        },
        location: {
          select: { id: true, nama_gedung: true, nama_ruang: true, zona_area: true },
        },
        images: {
          take: 1,
          select: { id: true, path: true, thumbnail_path: true, is_blurred: true },
        },
        // EXCLUDED: ciri_rahasia (kept secret at reception desk for ownership verification!)
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Public found items fetch error:", error);
    return NextResponse.json(
      { error: "Gagal memuat galeri barang temuan" },
      { status: 500 }
    );
  }
}
