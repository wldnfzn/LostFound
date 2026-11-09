"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sparkles,
  MapPin,
  Calendar,
  RefreshCw,
  PlusCircle,
  Eye,
  Check,
  Edit3,
  Archive,
} from "lucide-react";

export default function LaporanSayaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Close report modal state (FR-LOST-06)
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null);
  const [closeReason, setCloseReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/civitas/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMyReports();
  }, [user]);

  // Handle Mark as Found
  const handleMarkFound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReportId) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/civitas/reports/${selectedReportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "found",
          alasan: closeReason || "Ditemukan mandiri oleh pemilik",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setCloseModalOpen(false);
        setCloseReason("");
        fetchMyReports();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal menutup laporan.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle Extend Display Period (FR-LOST-07)
  const handleExtend = async (reportId: number) => {
    if (!confirm("Perpanjang masa tayang laporan ini selama 30 hari ke depan?")) return;

    try {
      const res = await fetch(`/api/civitas/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "extend" }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMyReports();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal memperpanjang laporan.");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "MenungguVerifikasi":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Menunggu Verifikasi Resepsionis</span>
          </span>
        );
      case "PerluRevisi":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-950 border border-orange-300">
            <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
            <span>Perlu Revisi</span>
          </span>
        );
      case "Tayang":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Tayang di Papan Pengumuman</span>
          </span>
        );
      case "AdaKandidat":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-950 border border-purple-300 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Ada Kandidat Ditemukan!</span>
          </span>
        );
      case "Selesai":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-950 border border-emerald-200">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span>Selesai (Sudah Ditemukan)</span>
          </span>
        );
      case "Kedaluwarsa":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
            <Archive className="w-3.5 h-3.5 text-slate-500" />
            <span>Masa Tayang Habis</span>
          </span>
        );
      case "Ditolak":
        return (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-950 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Ditolak</span>
          </span>
        );
      default:
        return <span className="font-bold">{status}</span>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat laporan Anda...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Laporan Kehilangan Saya
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Pantau status verifikasi, kandidat kecocokan barang temuan, dan kelola masa tayang laporan Anda.
          </p>
        </div>

        <Link
          href="/civitas/lapor"
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Buat Laporan Baru</span>
        </Link>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-lg">
            Anda belum pernah membuat laporan kehilangan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Jika Anda kehilangan barang di lingkungan kampus, segera buat laporan agar dapat dicocokkan dengan barang titipan di resepsionis.
          </p>
          <Link
            href="/civitas/lapor"
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            <span>Mulai Laporkan Sekarang</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:border-slate-300 transition-all space-y-5"
            >
              {/* Status Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  {getStatusBadge(report.status)}
                  <span className="text-[11px] font-bold text-slate-400">
                    #{report.id}
                  </span>
                </div>

                <div className="text-xs text-slate-400">
                  Dibuat pada:{" "}
                  {new Date(report.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>

              {/* Revision note / Rejection note banner */}
              {report.status === "PerluRevisi" && report.catatan_revisi && (
                <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200 text-xs text-orange-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span>Catatan Revisi dari Resepsionis:</span>
                  </div>
                  <p className="text-orange-800 pl-5">{report.catatan_revisi}</p>
                </div>
              )}

              {report.status === "Ditolak" && report.alasan_penolakan && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
                  <div className="flex items-center space-x-1.5 font-bold">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Alasan Penolakan:</span>
                  </div>
                  <p className="text-red-800 pl-5">{report.alasan_penolakan}</p>
                </div>
              )}

              {/* Matched Banner (AdaKandidat) */}
              {report.status === "AdaKandidat" && (
                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-sm text-purple-800">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Kandidat Barang Ditemukan di Meja Resepsionis!</span>
                  </div>
                  <p className="leading-relaxed">
                    Sistem mendeteksi adanya barang temuan dengan kemiripan tinggi dengan laporan Anda. Harap segera datang ke <strong>Meja Resepsionis Lobi Utama Gedung Rektorat</strong> dengan membawa <strong>KTM / Identitas</strong> untuk pencocokan ciri rahasia dan serah terima fisik.
                  </p>
                </div>
              )}

              {/* Main Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                {/* Photo Thumbnail */}
                <div className="md:col-span-1">
                  <div className="h-32 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 flex items-center justify-center">
                    {report.images && report.images.length > 0 ? (
                      <img
                        src={report.images[0].path}
                        alt={report.judul}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-xs text-slate-400">
                        Tanpa foto
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="md:col-span-3 space-y-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {report.category?.nama}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1">
                      {report.judul}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {report.deskripsi}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {report.location?.nama_gedung} • {report.location?.nama_ruang}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hilang:{" "}
                        {new Date(report.tanggal_hilang).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Secret Feature Notice (Owner view) */}
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                    <span className="font-bold">🔒 Ciri Rahasia Terproteksi: </span>
                    <span className="italic font-medium">{report.ciri_rahasia}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500">
                  {report.status === "Tayang" && (
                    <span>
                      Masa tayang hingga:{" "}
                      <strong>
                        {new Date(report.expired_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>{" "}
                      (Perpanjangan: {report.jumlah_perpanjangan}/2)
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Public Link */}
                  {["Tayang", "AdaKandidat"].includes(report.status) && (
                    <Link
                      href={`/pengumuman/${report.id}`}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-medium"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Lihat Pengumuman Publik</span>
                    </Link>
                  )}

                  {/* Extend Button (FR-LOST-07) */}
                  {["Tayang", "Kedaluwarsa"].includes(report.status) &&
                    report.jumlah_perpanjangan < 2 && (
                      <button
                        onClick={() => handleExtend(report.id)}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-medium"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Perpanjang Tayang (+30 Hari)</span>
                      </button>
                    )}

                  {/* Already Found Button (FR-LOST-06) */}
                  {["Tayang", "AdaKandidat", "MenungguVerifikasi"].includes(report.status) && (
                    <button
                      onClick={() => {
                        setSelectedReportId(report.id);
                        setCloseModalOpen(true);
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Sudah Ditemukan</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tutup Laporan (FR-LOST-06) */}
      {closeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Konfirmasi Barang Sudah Ditemukan
            </h3>
            <p className="text-xs text-slate-500">
              Laporan pengumuman akan ditutup dan status diubah menjadi 'Selesai'. Mohon berikan keterangan singkat di mana atau bagaimana barang ditemukan.
            </p>

            <form onSubmit={handleMarkFound} className="space-y-3">
              <textarea
                rows={3}
                placeholder="Contoh: Ditemukan tertinggal di laci kos, atau diserahkan teman sekelas..."
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  {processing ? "Memproses..." : "Konfirmasi Selesai"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
