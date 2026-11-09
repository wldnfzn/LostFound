import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "kampus-lost-and-found-fallback-secret-2026-secure"
);

export interface TokenPayload {
  userId: number;
  email: string;
  role: "civitas" | "resepsionis" | "superadmin";
  nama: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<{
  id: number;
  nama: string;
  email_kampus: string;
  nim_nip: string;
  role: "civitas" | "resepsionis" | "superadmin";
  prodi_unit: string | null;
  no_hp: string | null;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      nama: true,
      email_kampus: true,
      nim_nip: true,
      role: true,
      prodi_unit: true,
      no_hp: true,
      status_aktif: true,
    },
  });

  if (!user || !user.status_aktif) return null;

  return user as {
    id: number;
    nama: string;
    email_kampus: string;
    nim_nip: string;
    role: "civitas" | "resepsionis" | "superadmin";
    prodi_unit: string | null;
    no_hp: string | null;
  };
}

export async function requireAuth(roles?: ("civitas" | "resepsionis" | "superadmin")[]) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  if (roles && !roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
