import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["resepsionis", "superadmin"]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "kandidat";

    const matches = await prisma.match.findMany({
      where: {
        status: status === "all" ? undefined : status,
      },
      orderBy: { skor: "desc" },
      include: {
        lost_report: {
          include: {
            user: { select: { id: true, nama: true, email_kampus: true, no_hp: true } },
            category: true,
            location: true,
            images: true,
          },
        },
        found_item: {
          include: {
            category: true,
            location: true,
            images: true,
          },
        },
      },
    });

    return NextResponse.json({ matches });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat kandidat kecocokan." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const officer = await requireAuth(["resepsionis", "superadmin"]);
    const { matchId, action } = await req.json();

    if (!matchId || !action) {
      return NextResponse.json({ error: "ID pencocokan dan aksi wajib diisi." }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: parseInt(matchId, 10) },
      include: {
        lost_report: { include: { user: true } },
        found_item: true,
      },
    });

    if (!match) {
      return NextResponse.json({ error: "Data kecocokan tidak ditemukan." }, { status: 404 });
    }

    if (action === "accept") {
      // FR-MATCH-04: Resepsionis menerima kandidat
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "diterima",
          diputuskan_oleh: officer.id,
        },
      });

      // Update lost report status to "AdaKandidat"
      await prisma.lostReport.update({
        where: { id: match.lost_id },
        data: { status: "AdaKandidat" },
      });

      await logAudit({
        userId: officer.id,
        aksi: "ACCEPT_MATCH_CANDIDATE",
        entitas: "matches",
        entitasId: match.id,
        detail: {
          lost_id: match.lost_id,
          found_id: match.found_id,
          kode_barang: match.found_item.kode_barang,
          skor: match.skor,
        },
      });

      // Send notification to owner
      await createNotification({
        userId: match.lost_report.user_id,
        tipe: "match",
        judul: "Kandidat Barang Ditemukan!",
        isi: `Ada barang temuan (${match.found_item.kode_barang}) dengan kemiripan tinggi (${match.skor}%) dengan laporan Anda "${match.lost_report.judul}". Silakan ke resepsionis kampus untuk verifikasi dan serah terima.`,
        tautan: `/civitas/laporan-saya`,
      });

      return NextResponse.json({
        success: true,
        message: "Kandidat kecocokan diterima dan notifikasi telah dikirim ke pelapor.",
        match: updatedMatch,
      });
    }

    if (action === "reject") {
      // FR-MATCH-05: Menolak pasangan kandidat agar tidak muncul lagi
      const updatedMatch = await prisma.match.update({
        where: { id: match.id },
        data: {
          status: "ditolak",
          diputuskan_oleh: officer.id,
        },
      });

      // If no other accepted matches, revert lost report to Tayang
      const otherAccepted = await prisma.match.count({
        where: {
          lost_id: match.lost_id,
          status: "diterima",
        },
      });

      if (otherAccepted === 0) {
        await prisma.lostReport.update({
          where: { id: match.lost_id },
          data: { status: "Tayang" },
        });
      }

      await logAudit({
        userId: officer.id,
        aksi: "REJECT_MATCH_CANDIDATE",
        entitas: "matches",
        entitasId: match.id,
        detail: {
          lost_id: match.lost_id,
          found_id: match.found_id,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Kandidat kecocokan ditolak dan disimpan agar tidak muncul kembali.",
        match: updatedMatch,
      });
    }

    return NextResponse.json({ error: "Aksi tidak valid." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Match decision error:", error);
    return NextResponse.json({ error: "Gagal memproses keputusan kecocokan." }, { status: 500 });
  }
}
