import { prisma } from "./prisma";

export async function logAudit({
  userId,
  aksi,
  entitas,
  entitasId,
  detail,
  ip = "127.0.0.1",
}: {
  userId?: number | null;
  aksi: string;
  entitas: string;
  entitasId?: number | null;
  detail?: Record<string, unknown> | string;
  ip?: string;
}) {
  try {
    const detailString =
      typeof detail === "object" ? JSON.stringify(detail) : detail || null;

    return await prisma.auditLog.create({
      data: {
        user_id: userId || null,
        aksi,
        entitas,
        entitas_id: entitasId || null,
        detail: detailString,
        ip,
      },
    });
  } catch (error) {
    console.error("Failed to log audit action:", error);
  }
}
