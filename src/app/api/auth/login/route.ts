import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "Email kampus / NIM / NIP dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedIdentifier = identifier.trim().toLowerCase();

    // Find user by email or NIM/NIP
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email_kampus: trimmedIdentifier },
          { nim_nip: trimmedIdentifier },
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Akun tidak ditemukan. Periksa kembali email atau NIM/NIP Anda." },
        { status: 401 }
      );
    }

    // Check account lockout (FR-AUTH-05)
    if (user.locked_until && new Date() < user.locked_until) {
      const minutesLeft = Math.ceil(
        (user.locked_until.getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        {
          error: `Akun terkunci sementara karena 5 kali gagal login berturut-turut. Coba lagi dalam ${minutesLeft} menit.`,
        },
        { status: 403 }
      );
    }

    if (!user.status_aktif) {
      return NextResponse.json(
        { error: "Akun Anda dinonaktifkan oleh administrator kampus." },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      const failedAttempts = user.failed_login_attempts + 1;
      let lockedUntil: Date | null = null;

      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Lock for 15 minutes
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failed_login_attempts: failedAttempts,
          locked_until: lockedUntil,
        },
      });

      await logAudit({
        userId: user.id,
        aksi: "LOGIN_FAILED",
        entitas: "users",
        entitasId: user.id,
        detail: { reason: "Invalid password", failedAttempts },
      });

      if (failedAttempts >= 5) {
        return NextResponse.json(
          {
            error:
              "Akun Anda terkunci selama 15 menit setelah 5 kali gagal login berturut-turut.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: `Password salah. Sisa percobaan: ${5 - failedAttempts} kali.`,
        },
        { status: 401 }
      );
    }

    // Reset failed login attempts on successful login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failed_login_attempts: 0,
        locked_until: null,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email_kampus,
      role: user.role as "civitas" | "resepsionis" | "superadmin",
      nama: user.nama,
    });

    await logAudit({
      userId: user.id,
      aksi: "LOGIN_SUCCESS",
      entitas: "users",
      entitasId: user.id,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        nama: user.nama,
        email_kampus: user.email_kampus,
        nim_nip: user.nim_nip,
        role: user.role,
        prodi_unit: user.prodi_unit,
      },
    });

    // Set HttpOnly secure cookie
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server." },
      { status: 500 }
    );
  }
}
