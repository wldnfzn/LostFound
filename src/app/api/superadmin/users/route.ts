import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireAuth(["superadmin"]);

    const users = await prisma.user.findMany({
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        nama: true,
        email_kampus: true,
        nim_nip: true,
        role: true,
        prodi_unit: true,
        no_hp: true,
        status_aktif: true,
        created_at: true,
        _count: {
          select: { lost_reports: true, found_items: true, claims: true },
        },
      },
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak. Khusus Superadmin." }, { status: 403 });
    }
    return NextResponse.json({ error: "Gagal memuat pengguna." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAuth(["superadmin"]);
    const { action, userId, role, status_aktif, nama, email_kampus, nim_nip, password } =
      await req.json();

    if (action === "create") {
      if (!nama || !email_kampus || !nim_nip || !password || !role) {
        return NextResponse.json({ error: "Data pengguna tidak lengkap." }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      const newUser = await prisma.user.create({
        data: {
          nama: nama.trim(),
          email_kampus: email_kampus.trim().toLowerCase(),
          nim_nip: nim_nip.trim(),
          role,
          password_hash: passwordHash,
          status_aktif: true,
          email_verified_at: new Date(),
        },
      });

      await logAudit({
        userId: admin.id,
        aksi: "CREATE_USER_BY_ADMIN",
        entitas: "users",
        entitasId: newUser.id,
        detail: { nama: newUser.nama, role: newUser.role },
      });

      return NextResponse.json({ success: true, user: newUser });
    }

    if (action === "update_role") {
      const updated = await prisma.user.update({
        where: { id: parseInt(userId, 10) },
        data: { role },
      });

      await logAudit({
        userId: admin.id,
        aksi: "CHANGE_USER_ROLE",
        entitas: "users",
        entitasId: updated.id,
        detail: { roleBaru: role },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    if (action === "toggle_status") {
      const updated = await prisma.user.update({
        where: { id: parseInt(userId, 10) },
        data: { status_aktif: Boolean(status_aktif) },
      });

      await logAudit({
        userId: admin.id,
        aksi: "TOGGLE_USER_STATUS",
        entitas: "users",
        entitasId: updated.id,
        detail: { status_aktif: updated.status_aktif },
      });

      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "FORBIDDEN") {
      return NextResponse.json({ error: "Akses ditolak." }, { status: 403 });
    }
    console.error("Admin user management error:", error);
    return NextResponse.json({ error: "Gagal memproses manajemen pengguna." }, { status: 500 });
  }
}
