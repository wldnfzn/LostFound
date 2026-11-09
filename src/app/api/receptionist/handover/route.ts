import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const officer = await requireAuth(["resepsionis", "superadmin"]);

    const {
      found_id,
      claim_id,
      lost_id,
      penerima_id,
      nama_penerima,
      identitas_dicek,
      jenis_identitas,
      ciri_cocok,
      catatan_verifikasi,
      diwakilkan,
      nama_perwakilan,
      alasan_perwakilan,
      bukti_foto,
      ttd_digital,
    } = await req.json();

    if (!found_id || !nama_penerima) {
      return NextResponse.json(
        { error: "Barang temuan dan nama penerima wajib diisi." },
        { status: 400 }
      );
    }

    const foundItem = await prisma.foundItem.findUnique({
      where: { id: parseInt(found_id, 10) },
    });

    if (!foundItem) {
      return NextResponse.json({ error: "Barang temuan tidak ditemukan." }, { status: 404 });
    }

    // FR-CLAIM-05: Prevent duplicate handover on the same item
    if (foundItem.status === "Diserahkan") {
      return NextResponse.json(
        { error: "Barang ini SUDAH PERNAH diserahkan sebelumnya. Serah terima ganda dicegah." },
        { status: 400 }
      );
    }

    const existingHandover = await prisma.handover.findUnique({
      where: { found_id: foundItem.id },
    });

    if (existingHandover) {
      return NextResponse.json(
        { error: "Bukti serah terima untuk barang ini sudah tercatat di sistem." },
        { status: 400 }
      );
    }

    // Require proof (photo or signature) as per BR-06 & FR-CLAIM-03
    if (!bukti_foto && !ttd_digital) {
      return NextResponse.json(
        { error: "Bukti serah terima wajib disertakan (ambil foto serah terima atau tanda tangan digital)." },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomic handover operation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Handover record
      const handover = await tx.handover.create({
        data: {
          found_id: foundItem.id,
          claim_id: claim_id ? parseInt(claim_id, 10) : null,
          penerima_id: penerima_id ? parseInt(penerima_id, 10) : null,
          nama_penerima: nama_penerima.trim(),
          diwakilkan: Boolean(diwakilkan),
          nama_perwakilan: diwakilkan && nama_perwakilan ? nama_perwakilan.trim() : null,
          alasan_perwakilan: diwakilkan && alasan_perwakilan ? alasan_perwakilan.trim() : null,
          diserahkan_oleh: officer.id,
          waktu: new Date(),
          bukti_path: bukti_foto || null,
          ttd_digital: ttd_digital || null,
        },
      });

      // 2. Update Found Item status to Diserahkan
      await tx.foundItem.update({
        where: { id: foundItem.id },
        data: { status: "Diserahkan" },
      });

      // 3. If there is an associated claim, update claim verification details
      if (claim_id) {
        await tx.claim.update({
          where: { id: parseInt(claim_id, 10) },
          data: {
            identitas_dicek: Boolean(identitas_dicek),
            jenis_identitas: jenis_identitas || "KTM",
            ciri_cocok: Boolean(ciri_cocok),
            catatan: catatan_verifikasi ? catatan_verifikasi.trim() : null,
            diverifikasi_oleh: officer.id,
            status: "Disetujui",
          },
        });
      }

      // 4. If linked to a lost report, update lost report to Selesai and close announcement
      let linkedLostId = lost_id ? parseInt(lost_id, 10) : null;
      if (!linkedLostId && claim_id) {
        const c = await tx.claim.findUnique({ where: { id: parseInt(claim_id, 10) } });
        if (c?.lost_id) linkedLostId = c.lost_id;
      }

      if (linkedLostId) {
        await tx.lostReport.update({
          where: { id: linkedLostId },
          data: {
            status: "Selesai",
            alasan_penutupan: `Barang telah diserahkan di resepsionis kepada ${nama_penerima.trim()} pada ${new Date().toLocaleString("id-ID")}`,
          },
        });
      }

      return { handover, linkedLostId };
    });

    await logAudit({
      userId: officer.id,
      aksi: "COMPLETE_HANDOVER",
      entitas: "handovers",
      entitasId: result.handover.id,
      detail: {
        found_id: foundItem.id,
        kode_barang: foundItem.kode_barang,
        nama_penerima: nama_penerima.trim(),
        diwakilkan: Boolean(diwakilkan),
        petugas: officer.nama,
      },
    });

    // Notify recipient / owner
    if (penerima_id) {
      await createNotification({
        userId: parseInt(penerima_id, 10),
        tipe: "success",
        judul: "Serah Terima Selesai!",
        isi: `Barang temuan ${foundItem.kode_barang} (${foundItem.judul_publik}) telah resmi diserahkan kepada ${nama_penerima.trim()}.`,
        tautan: `/civitas/laporan-saya`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Serah terima barang ${foundItem.kode_barang} berhasil diselesaikan dan dicatat secara permanen!`,
      handover: result.handover,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Handover recording error:", error);
    return NextResponse.json({ error: "Gagal mencatat serah terima." }, { status: 500 });
  }
}
