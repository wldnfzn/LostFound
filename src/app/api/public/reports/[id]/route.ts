import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reportId = parseInt(id, 10);
    if (isNaN(reportId)) {
      return NextResponse.json({ error: "ID laporan tidak valid" }, { status: 400 });
    }

    const report = await prisma.lostReport.findFirst({
      where: {
        id: reportId,
        deleted_at: null,
        is_hidden: false,
        status: { in: ["Tayang", "AdaKandidat", "Selesai"] },
      },
      select: {
        id: true,
        judul: true,
        deskripsi: true,
        tanggal_hilang: true,
        status: true,
        expired_at: true,
        created_at: true,
        category: {
          select: { id: true, nama: true },
        },
        location: {
          select: { id: true, nama_gedung: true, nama_ruang: true, zona_area: true },
        },
        images: {
          select: { id: true, path: true, thumbnail_path: true },
        },
        // EXCLUDED: ciri_rahasia, user_id, email_kampus, no_hp
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan atau belum disetujui." },
        { status: 404 }
      );
    }

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Report detail fetch error:", error);
    return NextResponse.json({ error: "Gagal memuat detail laporan" }, { status: 500 });
  }
}

// FR-BOARD-06: Tombol "Laporkan" konten tidak pantas
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { error: "Silakan login terlebih dahulu untuk melaporkan konten." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);
    const { alasan } = await req.json();

    if (!alasan || !alasan.trim()) {
      return NextResponse.json(
        { error: "Alasan pelaporan wajib diisi." },
        { status: 400 }
      );
    }

    await prisma.contentReport.create({
      data: {
        lost_id: reportId,
        pelapor_id: user.id,
        alasan: alasan.trim(),
        status: "Menunggu",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Laporan konten berhasil dikirim ke tim resepsionis untuk ditinjau.",
    });
  } catch (error) {
    console.error("Content report submission error:", error);
    return NextResponse.json({ error: "Gagal mengirim laporan konten" }, { status: 500 });
  }
}
