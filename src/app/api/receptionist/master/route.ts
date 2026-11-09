import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAuth(["resepsionis", "superadmin"]);

    const categories = await prisma.category.findMany({
      orderBy: { nama: "asc" },
      include: {
        _count: { select: { lost_reports: true, found_items: true } },
      },
    });

    const locations = await prisma.location.findMany({
      orderBy: [{ nama_gedung: "asc" }, { nama_ruang: "asc" }],
      include: {
        _count: { select: { lost_reports: true, found_items: true } },
      },
    });

    return NextResponse.json({ categories, locations });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat master data." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth(["resepsionis", "superadmin"]);
    const { type, action, data } = await req.json();

    if (type === "category") {
      if (action === "create") {
        const cat = await prisma.category.create({
          data: { nama: data.nama.trim(), aktif: true },
        });
        await logAudit({
          userId: user.id,
          aksi: "CREATE_CATEGORY",
          entitas: "categories",
          entitasId: cat.id,
          detail: { nama: cat.nama },
        });
        return NextResponse.json({ success: true, item: cat });
      }

      if (action === "toggle") {
        const cat = await prisma.category.update({
          where: { id: parseInt(data.id, 10) },
          data: { aktif: Boolean(data.aktif) },
        });
        await logAudit({
          userId: user.id,
          aksi: "TOGGLE_CATEGORY",
          entitas: "categories",
          entitasId: cat.id,
          detail: { aktif: cat.aktif },
        });
        return NextResponse.json({ success: true, item: cat });
      }
    }

    if (type === "location") {
      if (action === "create") {
        const loc = await prisma.location.create({
          data: {
            nama_gedung: data.nama_gedung.trim(),
            zona_area: data.zona_area ? data.zona_area.trim() : null,
            nama_ruang: data.nama_ruang.trim(),
            aktif: true,
          },
        });
        await logAudit({
          userId: user.id,
          aksi: "CREATE_LOCATION",
          entitas: "locations",
          entitasId: loc.id,
          detail: loc,
        });
        return NextResponse.json({ success: true, item: loc });
      }

      if (action === "toggle") {
        const loc = await prisma.location.update({
          where: { id: parseInt(data.id, 10) },
          data: { aktif: Boolean(data.aktif) },
        });
        await logAudit({
          userId: user.id,
          aksi: "TOGGLE_LOCATION",
          entitas: "locations",
          entitasId: loc.id,
          detail: { aktif: loc.aktif },
        });
        return NextResponse.json({ success: true, item: loc });
      }
    }

    return NextResponse.json({ error: "Permintaan master data tidak valid." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Master data modification error:", error);
    return NextResponse.json({ error: "Gagal memproses perubahan master data." }, { status: 500 });
  }
}
