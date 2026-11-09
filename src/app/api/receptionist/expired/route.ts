import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAuth(["resepsionis", "superadmin"]);

    const now = new Date();

    const expiredItems = await prisma.foundItem.findMany({
      where: {
        OR: [
          { status: "TidakDiklaim" },
          { status: "Disimpan", batas_simpan: { lte: now } },
        ],
      },
      include: {
        category: true,
        location: true,
      },
      orderBy: { batas_simpan: "asc" },
    });

    return NextResponse.json({ expiredItems });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat barang kedaluwarsa." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const officer = await requireAuth(["resepsionis", "superadmin"]);
    const { itemId, tindakLanjut, catatan } = await req.json();

    if (!itemId || !tindakLanjut) {
      return NextResponse.json(
        { error: "ID barang dan pilihan tindak lanjut wajib diisi." },
        { status: 400 }
      );
    }

    const validActions = ["DiserahkanBagianUmum", "Dihibahkan", "Dimusnahkan"];
    if (!validActions.includes(tindakLanjut)) {
      return NextResponse.json(
        { error: "Pilihan tindak lanjut harus salah satu dari: DiserahkanBagianUmum, Dihibahkan, atau Dimusnahkan." },
        { status: 400 }
      );
    }

    const updated = await prisma.foundItem.update({
      where: { id: parseInt(itemId, 10) },
      data: {
        status: "Dialihkan",
        tindak_lanjut: tindakLanjut,
        catatan_tindak_lanjut: catatan ? catatan.trim() : null,
      },
    });

    await logAudit({
      userId: officer.id,
      aksi: "DISPOSITION_UNCLAIMED_ITEM",
      entitas: "found_items",
      entitasId: updated.id,
      detail: {
        kode_barang: updated.kode_barang,
        tindak_lanjut: tindakLanjut,
        catatan: catatan ? catatan.trim() : null,
        petugas: officer.nama,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Tindak lanjut untuk barang ${updated.kode_barang} berhasil dicatat sebagai '${tindakLanjut}'.`,
      item: updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Expired item disposition error:", error);
    return NextResponse.json({ error: "Gagal memproses tindak lanjut." }, { status: 500 });
  }
}
