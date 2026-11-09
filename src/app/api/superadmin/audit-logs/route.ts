import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(["superadmin", "resepsionis"]);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const aksi = searchParams.get("aksi");

    const where: any = {};
    if (aksi && aksi !== "all") {
      where.aksi = aksi;
    }

    // FR-AUDIT-02: Read-only, immutable logs
    const logs = await prisma.auditLog.findMany({
      where,
      take: limit,
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { id: true, nama: true, email_kampus: true, role: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat log audit." }, { status: 500 });
  }
}
