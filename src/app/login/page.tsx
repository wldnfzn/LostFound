"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal masuk");
      } else {
        await refreshUser();
        if (data.user.role === "resepsionis") {
          router.push("/resepsionis/dashboard");
        } else if (data.user.role === "superadmin") {
          router.push("/superadmin/pengguna");
        } else {
          router.push("/civitas/laporan-saya");
        }
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for testing/evaluating
  const fillQuickAccount = (ident: string, pass: string = "password123") => {
    setIdentifier(ident);
    setPassword(pass);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Masuk ke Akun Kampus
          </h1>
          <p className="text-xs text-slate-500">
            Gunakan Email Kampus atau Nomor Induk Mahasiswa (NIM) / NIP Anda
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed">
            {error}
          </div>
        )}

        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Email Kampus atau NIM / NIP
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="ahmad.fauzi@mhs.kampus.ac.id atau 220101001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700">Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? "Memverifikasi..." : "Masuk Sekarang"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center text-xs text-slate-500">
            Belum memiliki akun civitas?{" "}
            <Link href="/register" className="text-blue-600 font-bold hover:underline">
              Daftar Akun Baru
            </Link>
          </div>
        </div>

        {/* Demo Fast Login Buttons */}
        <div className="p-4 rounded-2xl bg-slate-100/70 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Pilihan Akun Uji Cepat (Demo):</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillQuickAccount("resepsionis@kampus.ac.id")}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-[10px] font-semibold text-amber-800 hover:bg-amber-50 text-center"
            >
              Resepsionis
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount("ahmad.fauzi@mhs.kampus.ac.id")}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-[10px] font-semibold text-blue-700 hover:bg-blue-50 text-center"
            >
              Mahasiswa
            </button>
            <button
              type="button"
              onClick={() => fillQuickAccount("superadmin@kampus.ac.id")}
              className="py-1.5 px-2 bg-white rounded-lg border border-slate-200 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 text-center"
            >
              Superadmin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
