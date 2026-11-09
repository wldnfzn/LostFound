import { prisma } from "./prisma";

export async function createNotification({
  userId,
  tipe = "info",
  judul,
  isi,
  tautan,
}: {
  userId: number;
  tipe?: "info" | "success" | "warning" | "match";
  judul: string;
  isi: string;
  tautan?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        tipe,
        judul,
        isi,
        tautan,
      },
    });

    // In production or when SMTP is configured, this can send an email asynchronously.
    // For local dev & demo, we log the email event.
    console.log(`[EMAIL NOTIFICATION SENT] To User ID ${userId}: [${judul}] - ${isi}`);

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
