import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { found_id, lost_id, keterangan, jenis_identitas } = await req.json();

    if (!found_id || !keterangan) {
      return NextResponse.json(
        { error: "ID barang temuan dan keterangan bukti kepemilikan wajib diisi." },
        { status: 400 }
      );
    }

    const foundItem = await prisma.foundItem.findUnique({
      where: { id: parseInt(found_id, 10) },
    });

    if (!foundItem || foundItem.status !== "Disimpan") {
      return NextResponse.json(
        { error: "Barang tidak tersedia atau sudah diserahkan kepada pihak lain." },
        { status: 400 }
      );
    }

    // Check if user already submitted a pending claim for this item
    const existingClaim = await prisma.claim.findFirst({
      where: {
        found_id: foundItem.id,
        claimant_id: user.id,
        status: "Menunggu",
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "Anda sudah mengajukan klaim untuk barang ini. Silakan kunjungi resepsionis kampus untuk verifikasi." },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.create({
      data: {
        found_id: foundItem.id,
        lost_id: lost_id ? parseInt(lost_id, 10) : null,
        claimant_id: user.id,
        keterangan: keterangan.trim(),
        jenis_identitas: jenis_identitas || "KTM",
        status: "Menunggu",
      },
    });

    await logAudit({
      userId: user.id,
      aksi: "SUBMIT_CLAIM",
      entitas: "claims",
      entitasId: claim.id,
      detail: { found_id: foundItem.id, kode_barang: foundItem.kode_barang },
    });

    // Notify receptionist
    const receptionists = await prisma.user.findMany({
      where: { role: "resepsionis", status_aktif: true },
    });

    for (const r of receptionists) {
      await createNotification({
        userId: r.id,
        tipe: "info",
        judul: `Pengajuan Klaim Baru: ${foundItem.kode_barang}`,
        isi: `${user.nama} mengajukan klaim untuk barang ${foundItem.judul_publik}.`,
        tautan: `/resepsionis/serah-terima?claimId=${claim.id}`,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Pengajuan klaim berhasil dikirim! Silakan datang ke meja resepsionis kampus dengan membawa KTM / kartu identitas untuk pencocokan ciri rahasia dan serah terima.",
      claim,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    console.error("Submit claim error:", error);
    return NextResponse.json({ error: "Gagal memproses klaim." }, { status: 500 });
  }
}
