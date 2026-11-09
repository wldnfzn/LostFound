import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category");
    const gedung = searchParams.get("gedung");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);
    const skip = (page - 1) * limit;

    const where: any = {
      deleted_at: null,
      is_hidden: false,
      status: { in: ["Tayang", "AdaKandidat"] },
    };

    if (search.trim()) {
      where.OR = [
        { judul: { contains: search.trim() } },
        { deskripsi: { contains: search.trim() } },
      ];
    }

    if (categoryId && categoryId !== "all") {
      where.category_id = parseInt(categoryId, 10);
    }

    if (gedung && gedung !== "all") {
      where.location = {
        nama_gedung: gedung,
      };
    }

    if (startDate) {
      where.tanggal_hilang = {
        ...(where.tanggal_hilang || {}),
        gte: new Date(startDate),
      };
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.tanggal_hilang = {
        ...(where.tanggal_hilang || {}),
        lte: end,
      };
    }

    const [total, reports] = await Promise.all([
      prisma.lostReport.count({ where }),
      prisma.lostReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          judul: true,
          deskripsi: true,
          tanggal_hilang: true,
          status: true,
          created_at: true,
          category: {
            select: { id: true, nama: true },
          },
          location: {
            select: { id: true, nama_gedung: true, nama_ruang: true, zona_area: true },
          },
          images: {
            take: 1,
            select: { id: true, path: true, thumbnail_path: true },
          },
          // Note: ciri_rahasia, user_id, user details (phone, email) are strictly EXCLUDED for public privacy!
        },
      }),
    ]);

    return NextResponse.json({
      reports,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Public reports fetch error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data laporan pengumuman" },
      { status: 500 }
    );
  }
}
