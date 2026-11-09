import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireAuth();

    const notifications = await prisma.notification.findMany({
      where: { user_id: user.id },
      orderBy: { created_at: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { user_id: user.id, dibaca: false },
    });

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memuat notifikasi." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { notificationId, markAll } = await req.json();

    if (markAll) {
      await prisma.notification.updateMany({
        where: { user_id: user.id, dibaca: false },
        data: { dibaca: true },
      });
      return NextResponse.json({ success: true, message: "Semua notifikasi ditandai dibaca." });
    }

    if (notificationId) {
      await prisma.notification.update({
        where: { id: parseInt(notificationId, 10), user_id: user.id },
        data: { dibaca: true },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Silakan login." }, { status: 401 });
    }
    return NextResponse.json({ error: "Gagal memperbarui notifikasi." }, { status: 500 });
  }
}
