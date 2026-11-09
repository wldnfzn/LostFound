import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, signToken } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const { nama, email_kampus, nim_nip, no_hp, prodi_unit, password } =
      await req.json();

    if (!nama || !email_kampus || !nim_nip || !password) {
      return NextResponse.json(
        { error: "Nama lengkap, email kampus, NIM/NIP, dan password wajib diisi." },
        { status: 400 }
      );
    }

    const trimmedEmail = email_kampus.trim().toLowerCase();
    const trimmedNimNip = nim_nip.trim();

    // Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email_kampus: trimmedEmail },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Email kampus ini sudah terdaftar. Silakan login." },
        { status: 400 }
      );
    }

    // Check existing NIM/NIP
    const existingNim = await prisma.user.findUnique({
      where: { nim_nip: trimmedNimNip },
    });
    if (existingNim) {
      return NextResponse.json(
        { error: "NIM / NIP ini sudah terdaftar." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create user with verified status (or simulated campus email verification)
    const newUser = await prisma.user.create({
      data: {
        nama: nama.trim(),
        email_kampus: trimmedEmail,
        nim_nip: trimmedNimNip,
        no_hp: no_hp ? no_hp.trim() : null,
        prodi_unit: prodi_unit ? prodi_unit.trim() : null,
        password_hash: passwordHash,
        role: "civitas",
        email_verified_at: new Date(),
        status_aktif: true,
      },
    });

    await logAudit({
      userId: newUser.id,
      aksi: "REGISTER",
      entitas: "users",
      entitasId: newUser.id,
      detail: { email: trimmedEmail, nim_nip: trimmedNimNip },
    });

    const token = await signToken({
      userId: newUser.id,
      email: newUser.email_kampus,
      role: newUser.role as "civitas",
      nama: newUser.nama,
    });

    const response = NextResponse.json({
      success: true,
      message: "Pendaftaran berhasil. Selamat datang di Sistem Laporan Kehilangan Kampus!",
      user: {
        id: newUser.id,
        nama: newUser.nama,
        email_kampus: newUser.email_kampus,
        nim_nip: newUser.nim_nip,
        role: newUser.role,
        prodi_unit: newUser.prodi_unit,
      },
    });

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pendaftaran akun." },
      { status: 500 }
    );
  }
}
