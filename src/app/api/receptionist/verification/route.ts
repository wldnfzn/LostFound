import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { runMatchingEngine } from "@/lib/matching";

export async function GET(req: NextRequest) {
  try {
    await requireAuth(["resepsionis", "superadmin"]);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "MenungguVerifikasi";

    const reports = await prisma.lostReport.findMany({
      where: {
        status: status === "all" ? undefined : status,
        deleted_at: null,
      },
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            id: true,
            nama: true,
            email_kampus: true,
            nim_nip: true,
            no_hp: true,
            prodi_unit: true,
          },
        },
        category: true,
        location: true,
        images: true,
        content_reports: true,
      },
    });

    return NextResponse.json({ reports });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat antrean verifikasi." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const officer = await requireAuth(["resepsionis", "superadmin"]);
    const { reportId, action, alasan, catatanRevisi, isHidden } = await req.json();

    if (!reportId || !action) {
      return NextResponse.json(
        { error: "ID laporan dan aksi verifikasi wajib diisi." },
        { status: 400 }
      );
    }

    const report = await prisma.lostReport.findUnique({
      where: { id: parseInt(reportId, 10) },
      include: { user: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    // Action 1: Setujui (Tayang)
    if (action === "approve") {
      const updated = await prisma.lostReport.update({
        where: { id: report.id },
        data: {
          status: "Tayang",
          alasan_penolakan: null,
          catatan_revisi: null,
        },
      });

      await logAudit({
        userId: officer.id,
        aksi: "APPROVE_LOST_REPORT",
        entitas: "lost_reports",
        entitasId: report.id,
        detail: { petugas: officer.nama, pelapor: report.user.nama },
      });

      await createNotification({
        userId: report.user_id,
        tipe: "success",
        judul: "Laporan Disetujui!",
        isi: `Laporan kehilangan "${report.judul}" telah disetujui resepsionis dan kini tayang di papan pengumuman kampus.`,
        tautan: `/pengumuman/${report.id}`,
      });

      // Run auto matching
      runMatchingEngine({ lostId: report.id }).catch(console.error);

      return NextResponse.json({
        success: true,
        message: "Laporan berhasil disetujui dan kini tayang di papan pengumuman.",
        report: updated,
      });
    }

    // Action 2: Tolak (Ditolak)
    if (action === "reject") {
      if (!alasan || !alasan.trim()) {
        return NextResponse.json(
          { error: "Alasan penolakan wajib diisi agar pelapor mengetahui penyebabnya." },
          { status: 400 }
        );
      }

      const updated = await prisma.lostReport.update({
        where: { id: report.id },
        data: {
          status: "Ditolak",
          alasan_penolakan: alasan.trim(),
        },
      });

      await logAudit({
        userId: officer.id,
        aksi: "REJECT_LOST_REPORT",
        entitas: "lost_reports",
        entitasId: report.id,
        detail: { alasan: alasan.trim(), petugas: officer.nama },
      });

      await createNotification({
        userId: report.user_id,
        tipe: "warning",
        judul: "Laporan Belum Dapat Disetujui",
        isi: `Laporan kehilangan "${report.judul}" ditolak oleh resepsionis: ${alasan.trim()}`,
        tautan: `/civitas/laporan-saya`,
      });

      return NextResponse.json({
        success: true,
        message: "Laporan telah ditolak dengan alasan yang tercatat.",
        report: updated,
      });
    }

    // Action 3: Minta Revisi (PerluRevisi)
    if (action === "request_revision") {
      if (!catatanRevisi || !catatanRevisi.trim()) {
        return NextResponse.json(
          { error: "Catatan instruksi revisi wajib diisi." },
          { status: 400 }
        );
      }

      const updated = await prisma.lostReport.update({
        where: { id: report.id },
        data: {
          status: "PerluRevisi",
          catatan_revisi: catatanRevisi.trim(),
        },
      });

      await logAudit({
        userId: officer.id,
        aksi: "REQUEST_REVISION_LOST_REPORT",
        entitas: "lost_reports",
        entitasId: report.id,
        detail: { catatanRevisi: catatanRevisi.trim(), petugas: officer.nama },
      });

      await createNotification({
        userId: report.user_id,
        tipe: "warning",
        judul: "Laporan Memerlukan Revisi",
        isi: `Resepsionis meminta revisi pada laporan "${report.judul}": ${catatanRevisi.trim()}`,
        tautan: `/civitas/laporan-saya`,
      });

      return NextResponse.json({
        success: true,
        message: "Permintaan revisi telah dikirimkan ke pelapor.",
        report: updated,
      });
    }

    // Action 4: Moderasi Sembunyikan Konten (FR-MOD-03)
    if (action === "moderate_hide") {
      const updated = await prisma.lostReport.update({
        where: { id: report.id },
        data: { is_hidden: isHidden ?? true },
      });

      await logAudit({
        userId: officer.id,
        aksi: isHidden ? "HIDE_CONTENT" : "UNHIDE_CONTENT",
        entitas: "lost_reports",
        entitasId: report.id,
      });

      return NextResponse.json({
        success: true,
        message: `Konten laporan berhasil di${isHidden ? "sembunyikan dari publik" : "tampilkan kembali"}.`,
        report: updated,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Verification action error:", error);
    return NextResponse.json({ error: "Gagal memproses verifikasi." }, { status: 500 });
  }
}
