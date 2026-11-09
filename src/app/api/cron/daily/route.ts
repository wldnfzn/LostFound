import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function GET() {
  try {
    const now = new Date();

    // 1. Check expired lost reports (FR-LOST-08, S-02)
    const expiredReports = await prisma.lostReport.updateMany({
      where: {
        status: { in: ["Tayang", "AdaKandidat"] },
        expired_at: { lte: now },
      },
      data: {
        status: "Kedaluwarsa",
      },
    });

    // 2. Check expired found items past batas_simpan (BR-04, S-02)
    const expiredFound = await prisma.foundItem.updateMany({
      where: {
        status: "Disimpan",
        batas_simpan: { lte: now },
      },
      data: {
        status: "TidakDiklaim",
      },
    });

    // 3. Send 7-day warning reminder for matched items (S-03, FR-NOTIF-03)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const endingSoonItems = await prisma.foundItem.findMany({
      where: {
        status: "Disimpan",
        batas_simpan: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        matches: {
          where: { status: "diterima" },
          include: { lost_report: true },
        },
      },
    });

    let remindersSent = 0;
    for (const item of endingSoonItems) {
      for (const match of item.matches) {
        await createNotification({
          userId: match.lost_report.user_id,
          tipe: "warning",
          judul: "Peringatan: Masa Simpan Barang Segera Berakhir!",
          isi: `Barang temuan ${item.kode_barang} (${item.judul_publik}) akan mencapai batas simpan dalam 7 hari. Harap segera datang ke resepsionis sebelum barang dialihkan.`,
          tautan: `/civitas/laporan-saya`,
        });
        remindersSent++;
      }
    }

    await logAudit({
      aksi: "CRON_DAILY_RUN",
      entitas: "system",
      detail: {
        laporanKedaluwarsa: expiredReports.count,
        barangTidakDiklaim: expiredFound.count,
        pengingatTerkirim: remindersSent,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Daily cron tasks executed successfully",
      stats: {
        laporanKedaluwarsa: expiredReports.count,
        barangTidakDiklaim: expiredFound.count,
        pengingatTerkirim: remindersSent,
      },
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Gagal menjalankan cron" }, { status: 500 });
  }
}
