import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { runMatchingEngine } from "@/lib/matching";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const reportId = parseInt(id, 10);

    const report = await prisma.lostReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.user_id !== user.id || report.deleted_at !== null) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan atau Anda tidak memiliki akses." },
        { status: 404 }
      );
    }

    // FR-LOST-05: Can edit during MenungguVerifikasi, PerluRevisi, or Tayang
    if (!["MenungguVerifikasi", "PerluRevisi", "Tayang"].includes(report.status)) {
      return NextResponse.json(
        { error: `Laporan dengan status ${report.status} tidak dapat diubah lagi.` },
        { status: 400 }
      );
    }

    const {
      judul,
      category_id,
      location_id,
      tanggal_hilang,
      deskripsi,
      ciri_rahasia,
    } = await req.json();

    const newStatus =
      report.status === "PerluRevisi" ? "MenungguVerifikasi" : report.status;

    const updated = await prisma.lostReport.update({
      where: { id: reportId },
      data: {
        judul: judul?.trim() || report.judul,
        category_id: category_id ? parseInt(category_id, 10) : report.category_id,
        location_id: location_id ? parseInt(location_id, 10) : report.location_id,
        tanggal_hilang: tanggal_hilang ? new Date(tanggal_hilang) : report.tanggal_hilang,
        deskripsi: deskripsi?.trim() || report.deskripsi,
        ciri_rahasia: ciri_rahasia?.trim() || report.ciri_rahasia,
        status: newStatus,
        catatan_revisi: report.status === "PerluRevisi" ? null : report.catatan_revisi,
      },
    });

    await logAudit({
      userId: user.id,
      aksi: "UPDATE_LOST_REPORT",
      entitas: "lost_reports",
      entitasId: reportId,
      detail: {
        statusAwal: report.status,
        statusBaru: newStatus,
        perubahan: { judul, category_id, location_id },
      },
    });

    // If report is Tayang, re-run matching
    if (newStatus === "Tayang") {
      runMatchingEngine({ lostId: reportId }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil diperbarui.",
      report: updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    console.error("Update report error:", error);
    return NextResponse.json({ error: "Gagal memperbarui laporan." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const reportId = parseInt(id, 10);

    const report = await prisma.lostReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.user_id !== user.id || report.deleted_at !== null) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan atau Anda tidak berhak mengaksesnya." },
        { status: 404 }
      );
    }

    const { action, alasan } = await req.json();

    // FR-LOST-06: Tombol "Sudah Ditemukan"
    if (action === "found") {
      const updated = await prisma.lostReport.update({
        where: { id: reportId },
        data: {
          status: "Selesai",
          alasan_penutupan: alasan ? alasan.trim() : "Ditemukan secara mandiri oleh pemilik",
        },
      });

      await logAudit({
        userId: user.id,
        aksi: "CLOSE_REPORT_FOUND",
        entitas: "lost_reports",
        entitasId: reportId,
        detail: { alasan: updated.alasan_penutupan },
      });

      return NextResponse.json({
        success: true,
        message: "Pengumuman laporan berhasil ditutup dengan status 'Selesai'.",
        report: updated,
      });
    }

    // FR-LOST-07: Perpanjang masa tayang (maks 2 kali)
    if (action === "extend") {
      const settingMax = await prisma.setting.findUnique({
        where: { key: "maks_perpanjangan" },
      });
      const maxExtends = settingMax ? parseInt(settingMax.value, 10) : 2;

      if (report.jumlah_perpanjangan >= maxExtends) {
        return NextResponse.json(
          { error: `Batas perpanjangan tayang maksimal ${maxExtends} kali sudah tercapai.` },
          { status: 400 }
        );
      }

      const settingDays = await prisma.setting.findUnique({
        where: { key: "masa_tayang_hari" },
      });
      const days = settingDays ? parseInt(settingDays.value, 10) : 30;

      const newExpiry = new Date(Math.max(report.expired_at.getTime(), Date.now()));
      newExpiry.setDate(newExpiry.getDate() + days);

      const updated = await prisma.lostReport.update({
        where: { id: reportId },
        data: {
          expired_at: newExpiry,
          jumlah_perpanjangan: report.jumlah_perpanjangan + 1,
          status: report.status === "Kedaluwarsa" ? "Tayang" : report.status,
        },
      });

      await logAudit({
        userId: user.id,
        aksi: "EXTEND_REPORT_DISPLAY",
        entitas: "lost_reports",
        entitasId: reportId,
        detail: {
          perpanjanganKe: updated.jumlah_perpanjangan,
          expiredAtBaru: newExpiry,
        },
      });

      return NextResponse.json({
        success: true,
        message: `Masa tayang laporan berhasil diperpanjang +${days} hari. (Perpanjangan ke-${updated.jumlah_perpanjangan} dari ${maxExtends})`,
        report: updated,
      });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    console.error("Patch report error:", error);
    return NextResponse.json({ error: "Gagal memproses perubahan laporan." }, { status: 500 });
  }
}

// SRS 7.3: Soft delete laporan
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const reportId = parseInt(id, 10);

    const report = await prisma.lostReport.findUnique({
      where: { id: reportId },
    });

    if (!report || report.user_id !== user.id) {
      return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
    }

    await prisma.lostReport.update({
      where: { id: reportId },
      data: { deleted_at: new Date() },
    });

    await logAudit({
      userId: user.id,
      aksi: "SOFT_DELETE_LOST_REPORT",
      entitas: "lost_reports",
      entitasId: reportId,
    });

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dihapus (soft delete).",
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal menghapus laporan." }, { status: 500 });
  }
}
