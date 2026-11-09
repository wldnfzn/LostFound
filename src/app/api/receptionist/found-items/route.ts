import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { runMatchingEngine } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["resepsionis", "superadmin"]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "Disimpan";
    const search = searchParams.get("search") || "";
    const bernilaiTinggi = searchParams.get("bernilaiTinggi");

    const where: any = {};
    if (status !== "all") {
      where.status = status;
    }
    if (bernilaiTinggi === "true") {
      where.bernilai_tinggi = true;
    }
    if (search.trim()) {
      where.OR = [
        { kode_barang: { contains: search.trim() } },
        { judul_publik: { contains: search.trim() } },
        { deskripsi: { contains: search.trim() } },
        { nama_penemu: { contains: search.trim() } },
      ];
    }

    const items = await prisma.foundItem.findMany({
      where,
      orderBy: { created_at: "desc" },
      include: {
        category: true,
        location: true,
        officer: { select: { nama: true } },
        images: true,
        claims: {
          include: { claimant: { select: { nama: true, nim_nip: true } } },
        },
        handover: true,
        matches: {
          include: {
            lost_report: {
              select: { id: true, judul: true, user: { select: { nama: true } } },
            },
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat barang temuan." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const officer = await requireAuth(["resepsionis", "superadmin"]);
    const {
      category_id,
      location_id,
      judul_publik,
      deskripsi,
      ciri_rahasia,
      tanggal_temuan,
      nama_penemu,
      lokasi_simpan,
      bernilai_tinggi,
      is_dokumen_identitas,
      pemilik_dihubungi,
      images, // array of { path: string, thumbnail_path?: string, is_blurred?: boolean }
    } = await req.json();

    if (!category_id || !location_id || !judul_publik || !deskripsi || !tanggal_temuan) {
      return NextResponse.json(
        { error: "Kategori, lokasi, judul barang, deskripsi, dan tanggal temuan wajib diisi." },
        { status: 400 }
      );
    }

    // FR-FOUND-02: Generate unique code format TMN-YYYY-NNNN
    const currentYear = new Date().getFullYear();
    const countThisYear = await prisma.foundItem.count({
      where: {
        kode_barang: {
          startsWith: `TMN-${currentYear}-`,
        },
      },
    });

    const nextSeq = (countThisYear + 1).toString().padStart(4, "0");
    const kodeBarang = `TMN-${currentYear}-${nextSeq}`;

    // FR-FOUND-03: Calculate batas_simpan (BR-04 default 60 days)
    const settingSimpan = await prisma.setting.findUnique({
      where: { key: "masa_simpan_hari" },
    });
    const daysSimpan = settingSimpan ? parseInt(settingSimpan.value, 10) : 60;

    const batasSimpan = new Date(tanggal_temuan);
    batasSimpan.setDate(batasSimpan.getDate() + daysSimpan);

    const newItem = await prisma.foundItem.create({
      data: {
        kode_barang: kodeBarang,
        category_id: parseInt(category_id, 10),
        location_id: parseInt(location_id, 10),
        judul_publik: judul_publik.trim(),
        deskripsi: deskripsi.trim(),
        ciri_rahasia: ciri_rahasia ? ciri_rahasia.trim() : null,
        tanggal_temuan: new Date(tanggal_temuan),
        nama_penemu: nama_penemu ? nama_penemu.trim() : null,
        lokasi_simpan: lokasi_simpan ? lokasi_simpan.trim() : "Meja Resepsionis",
        bernilai_tinggi: Boolean(bernilai_tinggi),
        is_dokumen_identitas: Boolean(is_dokumen_identitas),
        pemilik_dihubungi: Boolean(pemilik_dihubungi),
        dicatat_oleh: officer.id,
        batas_simpan: batasSimpan,
        status: "Disimpan",
        images: {
          create: Array.isArray(images)
            ? images.slice(0, 5).map((img: { path: string; thumbnail_path?: string; is_blurred?: boolean }) => ({
                ref_id: 0,
                ref_type: "found",
                path: img.path,
                thumbnail_path: img.thumbnail_path || null,
                is_blurred: Boolean(img.is_blurred),
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
      userId: officer.id,
      aksi: "CREATE_FOUND_ITEM",
      entitas: "found_items",
      entitasId: newItem.id,
      detail: {
        kode_barang: kodeBarang,
        judul: newItem.judul_publik,
        lokasi_simpan: newItem.lokasi_simpan,
        bernilai_tinggi: newItem.bernilai_tinggi,
      },
    });

    // Run matching engine asynchronously
    const matchResult = await runMatchingEngine({ foundId: newItem.id });

    return NextResponse.json({
      success: true,
      message: `Barang temuan berhasil dicatat dengan kode ${kodeBarang}.`,
      item: newItem,
      candidatesFound: matchResult.candidatesFound,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Create found item error:", error);
    return NextResponse.json({ error: "Gagal mencatat barang temuan." }, { status: 500 });
  }
}
