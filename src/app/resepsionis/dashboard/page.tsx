"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  PackagePlus,
  Sparkles,
  ClipboardCheck,
  AlertTriangle,
  Archive,
  Clock,
  ArrowRight,
  ShieldAlert,
  FileBarChart,
  Tag,
} from "lucide-react";

export default function ReceptionistDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/dashboard");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat dashboard resepsionis...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              Meja Resepsionis & Administrator
            </span>
            <span className="text-xs text-slate-500 font-medium">• Lobi Utama Rektorat</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Operasional
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/resepsionis/catat-temuan"
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Input Barang Temuan (≤ 3 Menit)</span>
          </Link>

          <Link
            href="/resepsionis/serah-terima"
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all"
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>Verifikasi & Serah Terima</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid (FR-DASH-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Antrean Verifikasi */}
        <Link
          href="/resepsionis/verifikasi"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-amber-300 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Antrean Verifikasi
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.menungguVerifikasi || 0}
            </span>
            <span className="text-xs text-slate-500">laporan baru</span>
          </div>
          <div className="text-[11px] text-amber-700 font-medium flex items-center space-x-1">
            <span>Perlu ditinjau sebelum tayang</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 2: Barang Disimpan & Nilai Tinggi */}
        <Link
          href="/resepsionis/barang-temuan"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Barang Dititipkan
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Archive className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.barangDisimpan || 0}
            </span>
            <span className="text-xs text-slate-500">item fisik</span>
          </div>
          <div className="text-[11px] text-slate-600 flex items-center space-x-1">
            <span className="font-bold text-amber-600">
              {metrics.barangBernilaiTinggi || 0} bernilai tinggi
            </span>
            <span>(tersimpan terkunci)</span>
          </div>
        </Link>

        {/* Card 3: Kandidat Kecocokan Baru */}
        <Link
          href="/resepsionis/kandidat-cocok"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-300 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kandidat Cocok (Skor ≥ 60)
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.kandidatBaru || 0}
            </span>
            <span className="text-xs text-slate-500">pasangan</span>
          </div>
          <div className="text-[11px] text-purple-700 font-medium flex items-center space-x-1">
            <span>Dihitung otomatis oleh sistem</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>

        {/* Card 4: Mendekati Batas Simpan (H-7) */}
        <Link
          href="/resepsionis/barang-kedaluwarsa"
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-red-300 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Batas Simpan Segera Habis
            </span>
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center text-red-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {metrics.mendekatiBatasSimpan || 0}
            </span>
            <span className="text-xs text-slate-500">item (≤ 7 hari)</span>
          </div>
          <div className="text-[11px] text-red-600 font-medium flex items-center space-x-1">
            <span>Perlu dialihkan / tindak lanjut</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </Link>
      </div>

      {/* Tables of recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Found Items */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">
              Barang Temuan Terbaru di Meja
            </h3>
            <Link
              href="/resepsionis/barang-temuan"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentFoundItems?.length > 0 ? (
              data.recentFoundItems.map((item: any) => (
                <div key={item.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {item.kode_barang}
                      </span>
                      {item.bernilai_tinggi && (
                        <span className="px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 rounded">
                          Nilai Tinggi
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {item.judul_publik}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {item.category?.nama} • {item.location?.nama_gedung}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                    {item.lokasi_simpan}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada barang temuan dicatat.
              </p>
            )}
          </div>
        </div>

        {/* Recent Lost Reports */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">
              Laporan Kehilangan Terkini
            </h3>
            <Link
              href="/resepsionis/verifikasi"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Lihat Antrean
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {data?.recentLostReports?.length > 0 ? (
              data.recentLostReports.map((report: any) => (
                <div key={report.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-800">
                      {report.judul}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pelapor: {report.user?.nama} • {report.category?.nama}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      report.status === "MenungguVerifikasi"
                        ? "bg-amber-100 text-amber-800"
                        : report.status === "Tayang"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Belum ada laporan kehilangan.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
