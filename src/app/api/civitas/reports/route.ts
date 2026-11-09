import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    const user = await requireAuth();

    const reports = await prisma.lostReport.findMany({
      where: {
        user_id: user.id,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
      include: {
        category: true,
        location: true,
        images: true,
        matches: {
          include: {
            found_item: {
              select: {
                id: true,
                kode_barang: true,
                judul_publik: true,
                lokasi_simpan: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    console.error("Civitas reports fetch error:", error);
    return NextResponse.json({ error: "Gagal memuat laporan Anda." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Check daily limit (FR-LOST-09: maks 5 per pengguna per hari)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const countToday = await prisma.lostReport.count({
      where: {
        user_id: user.id,
        created_at: { gte: today },
      },
    });

    const settingLimit = await prisma.setting.findUnique({
      where: { key: "batas_laporan_harian" },
    });
    const maxDaily = settingLimit ? parseInt(settingLimit.value, 10) : 5;

    if (countToday >= maxDaily) {
      return NextResponse.json(
        {
          error: `Batas harian tercapai. Anda hanya dapat membuat maksimal ${maxDaily} laporan per hari untuk mencegah spam.`,
        },
        { status: 429 }
      );
    }

    const {
      judul,
      category_id,
      location_id,
      tanggal_hilang,
      deskripsi,
      ciri_rahasia,
      images, // array of { path: string, thumbnail_path?: string }
    } = await req.json();

    // Validation (FR-LOST-02)
    if (!judul || !category_id || !location_id || !tanggal_hilang || !deskripsi || !ciri_rahasia) {
      return NextResponse.json(
        { error: "Seluruh isian wajib (nama barang, kategori, lokasi, tanggal, deskripsi, dan ciri rahasia) harus diisi." },
        { status: 400 }
      );
    }

    // Default 30 days active period (BR-05)
    const settingTayang = await prisma.setting.findUnique({
      where: { key: "masa_tayang_hari" },
    });
    const daysTayang = settingTayang ? parseInt(settingTayang.value, 10) : 30;

    const expiredAt = new Date();
    expiredAt.setDate(expiredAt.getDate() + daysTayang);

    const newReport = await prisma.lostReport.create({
      data: {
        user_id: user.id,
        category_id: parseInt(category_id, 10),
        location_id: parseInt(location_id, 10),
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        ciri_rahasia: ciri_rahasia.trim(),
        tanggal_hilang: new Date(tanggal_hilang),
        status: "MenungguVerifikasi", // FR-LOST-03
        expired_at: expiredAt,
        images: {
          create: Array.isArray(images)
            ? images.slice(0, 5).map((img: { path: string; thumbnail_path?: string }) => ({
                ref_id: 0,
                ref_type: "lost",
                path: img.path,
                thumbnail_path: img.thumbnail_path || null,
              }))
            : [],
        },
      },
      include: {
        category: true,
        location: true,
        images: true,
      },
    });

    await logAudit({
      userId: user.id,
      aksi: "CREATE_LOST_REPORT",
      entitas: "lost_reports",
      entitasId: newReport.id,
      detail: { judul: newReport.judul, status: newReport.status },
    });

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dibuat dan masuk antrean verifikasi resepsionis.",
      report: newReport,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    }
    console.error("Create lost report error:", error);
    return NextResponse.json({ error: "Gagal membuat laporan kehilangan." }, { status: 500 });
  }
}
