"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileBarChart,
  FileSpreadsheet,
  FileDown,
  TrendingUp,
  PackageCheck,
  Building,
  Tag,
  CheckCircle2,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LaporanStatistikPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch("/api/receptionist/analytics")
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Export to Excel (FR-DASH-04)
  const handleExportExcel = () => {
    if (!analytics) return;

    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan
    const summaryData = [
      ["METRIK", "NILAI"],
      ["Total Laporan Kehilangan", analytics.summary?.totalLost || 0],
      ["Total Barang Temuan Dicatat", analytics.summary?.totalFound || 0],
      ["Total Serah Terima Berhasil", analytics.summary?.totalHandover || 0],
      ["Tingkat Pengembalian (%)", `${analytics.summary?.returnRate || 0}%`],
      ["Barang Temuan Kedaluwarsa", analytics.summary?.totalExpiredFound || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Ringkasan Eksekutif");

    // Sheet 2: Kategori
    const categoryData = [
      ["ID Kategori", "Nama Kategori", "Laporan Kehilangan", "Barang Temuan"],
      ...(analytics.categories || []).map((c: any) => [
        c.id,
        c.nama,
        c.lostCount,
        c.foundCount,
      ]),
    ];
    const wsCategory = XLSX.utils.aoa_to_sheet(categoryData);
    XLSX.utils.book_append_sheet(wb, wsCategory, "Berdasarkan Kategori");

    // Sheet 3: Gedung
    const buildingData = [
      ["Nama Gedung Kampus", "Laporan Hilang", "Barang Temuan", "Total Kejadian"],
      ...(analytics.topBuildings || []).map((b: any) => [
        b.gedung,
        b.lostCount,
        b.foundCount,
        b.total,
      ]),
    ];
    const wsBuilding = XLSX.utils.aoa_to_sheet(buildingData);
    XLSX.utils.book_append_sheet(wb, wsBuilding, "Titik Rawan Gedung");

    XLSX.writeFile(wb, `Laporan_Statistik_LostFound_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF (FR-DASH-04)
  const handleExportPDF = () => {
    if (!analytics) return;

    const doc = new jsPDF();

    doc.setFillColor(30, 58, 138);
    doc.rect(0, 0, 210, 28, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LAPORAN STATISTIK LAPORAN KEHILANGAN KAMPUS", 105, 14, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Dicetak pada: ${new Date().toLocaleString("id-ID")}`, 105, 21, { align: "center" });

    // Summary table
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Ringkasan Eksekutif & Metrik Keberhasilan", 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [["Indikator", "Realisasi Sistem", "Target PRD", "Status"]],
      body: [
        [
          "Persentase Barang Temuan yang Berhasil Dikembalikan",
          `${analytics.summary?.returnRate || 0}%`,
          "≥ 60%",
          analytics.summary?.returnRate >= 60 ? "MEMENUHI TARGET" : "PROGRES",
        ],
        ["Total Laporan Kehilangan", analytics.summary?.totalLost || 0, "-", "-"],
        ["Total Barang Temuan Dicatat", analytics.summary?.totalFound || 0, "-", "-"],
        ["Total Serah Terima Berhasil dengan Bukti", analytics.summary?.totalHandover || 0, "100%", "100% TERCATAT"],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 58, 138] },
    });

    const finalY1 = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text("2. Titik Rawan Kehilangan per Gedung Kampus", 14, finalY1);

    autoTable(doc, {
      startY: finalY1 + 4,
      head: [["Nama Gedung", "Laporan Kehilangan", "Barang Temuan", "Total Kasus"]],
      body: (analytics.topBuildings || []).map((b: any) => [
        b.gedung,
        b.lostCount,
        b.foundCount,
        b.total,
      ]),
      theme: "grid",
      headStyles: { fillColor: [71, 85, 105] },
    });

    doc.save(`Laporan_Statistik_LostFound_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Mengkalkulasi analitik & statistik...</p>
      </div>
    );
  }

  const summary = analytics?.summary || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laporan Statistik & Evaluasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Rekapitulasi periodik pengembalian barang, tren kategori, dan pemetaan titik rawan kehilangan kampus.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportExcel}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
          >
            <FileDown className="w-4 h-4" />
            <span>Ekspor PDF</span>
          </button>
        </div>
      </div>

      {/* Target Metric Banner (PRD Target >= 60%) */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs uppercase tracking-wider text-blue-300 font-bold">
              Metrik Keberhasilan Utama (PRD Bagian 3)
            </span>
            <h2 className="text-2xl font-bold">Tingkat Pengembalian Barang Temuan</h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Target kampus setelah 6 bulan rilis adalah ≥ 60% barang temuan berhasil diserahterimakan kembali kepada pemilik sah.
            </p>
          </div>

          <div className="text-center sm:text-right bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <div className="text-4xl font-extrabold text-teal-300">
              {summary.returnRate}%
            </div>
            <div className="text-[11px] text-blue-200 mt-0.5">
              Target: ≥ 60% {summary.returnRate >= 60 ? "✓ TERCAPAI" : "• DALAM PROGRES"}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Laporan Hilang</span>
          <div className="text-3xl font-extrabold text-slate-900">{summary.totalLost || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Barang Temuan</span>
          <div className="text-3xl font-extrabold text-slate-900">{summary.totalFound || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Serah Terima Berhasil</span>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.totalHandover || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Barang Dialihkan</span>
          <div className="text-3xl font-extrabold text-slate-600">{summary.totalExpiredFound || 0}</div>
        </div>
      </div>

      {/* Breakdown by Category & Buildings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Category Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Distribusi Berdasarkan Kategori</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics?.categories?.map((cat: any) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">{cat.nama}</span>
                <div className="flex items-center space-x-3 text-slate-500">
                  <span>Hilang: <strong>{cat.lostCount}</strong></span>
                  <span>Temuan: <strong>{cat.foundCount}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Buildings (Titik Rawan Kehilangan) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Titik Rawan Kehilangan Kampus</h3>
          </div>

          <div className="divide-y divide-slate-100">
            {analytics?.topBuildings?.map((b: any, idx: number) => (
              <div key={b.gedung} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{b.gedung}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-blue-600">{b.total} kejadian</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
