"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  User,
  MapPin,
  Calendar,
  Sparkles,
} from "lucide-react";

export default function VerifikasiLaporanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("MenungguVerifikasi");

  // Modal action states
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "request_revision">("approve");
  const [actionInput, setActionInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/verification?status=${filterStatus}`);
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
    if (user) fetchQueue();
  }, [user, filterStatus]);

  const handleOpenActionModal = (report: any, action: "approve" | "reject" | "request_revision") => {
    setSelectedReport(report);
    setActionType(action);
    setActionInput("");
    setModalOpen(true);
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    setSubmitting(true);
    try {
      const payload: any = {
        reportId: selectedReport.id,
        action: actionType,
      };

      if (actionType === "reject") {
        payload.alasan = actionInput.trim();
      } else if (actionType === "request_revision") {
        payload.catatanRevisi = actionInput.trim();
      }

      const res = await fetch("/api/receptionist/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setModalOpen(false);
        fetchQueue();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal memproses verifikasi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleHide = async (reportId: number, currentHidden: boolean) => {
    try {
      const res = await fetch("/api/receptionist/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          action: "moderate_hide",
          isHidden: !currentHidden,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchQueue();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat antrean verifikasi laporan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verifikasi & Moderasi Laporan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Tinjau kesesuaian laporan civitas sebelum diizinkan tayang ke papan pengumuman kampus.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm"
          >
            <option value="MenungguVerifikasi">Menunggu Verifikasi Saja</option>
            <option value="PerluRevisi">Perlu Revisi</option>
            <option value="Tayang">Tayang</option>
            <option value="Ditolak">Ditolak</option>
            <option value="all">Semua Status</option>
          </select>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CheckSquare className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-lg">
            Antrean Bersih!
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada laporan yang menunggu verifikasi saat ini. Seluruh laporan telah ditinjau.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {reports.map((report) => (
            <div
              key={report.id}
              className={`bg-white rounded-3xl border p-6 shadow-sm transition-all space-y-5 ${
                report.is_hidden ? "border-red-300 bg-red-50/20" : "border-slate-200"
              }`}
            >
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {report.category?.nama}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    ID #{report.id}
                  </span>
                  {report.is_hidden && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 text-white uppercase">
                      Konten Disembunyikan
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400">
                  Diajukan: {new Date(report.created_at).toLocaleString("id-ID")}
                </div>
              </div>

              {/* Main Content Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">
                    {report.judul}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {report.deskripsi}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{report.location?.nama_gedung} • {report.location?.nama_ruang}</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Hilang: {new Date(report.tanggal_hilang).toLocaleDateString("id-ID")}
                      </span>
                    </div>
                  </div>

                  {/* Secret Feature Review (Visible ONLY to receptionist - BR-03) */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
                      <Lock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ciri Rahasia (Hanya Resepsionis):</span>
                    </div>
                    <p className="text-xs text-amber-800 font-medium italic">
                      {report.ciri_rahasia}
                    </p>
                  </div>
                </div>

                {/* Submitter details & Photo */}
                <div className="space-y-3 md:border-l md:border-slate-100 md:pl-6">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <span className="font-bold text-slate-700 block">Identitas Pelapor:</span>
                    <div className="font-semibold text-slate-900">{report.user?.nama}</div>
                    <div className="text-slate-500">{report.user?.email_kampus}</div>
                    <div className="text-slate-500">NIM/NIP: {report.user?.nim_nip}</div>
                    {report.user?.no_hp && (
                      <div className="text-slate-500">WA: {report.user?.no_hp}</div>
                    )}
                  </div>

                  {report.images && report.images.length > 0 && (
                    <div className="h-28 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                      <img
                        src={report.images[0].path}
                        alt={report.judul}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons for Receptionist */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleHide(report.id, report.is_hidden)}
                  className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-red-600 font-medium"
                >
                  {report.is_hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  <span>{report.is_hidden ? "Tampilkan Kembali" : "Sembunyikan dari Publik"}</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenActionModal(report, "reject")}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Tolak Laporan</span>
                  </button>

                  <button
                    onClick={() => handleOpenActionModal(report, "request_revision")}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-orange-200 text-orange-700 hover:bg-orange-50 text-xs font-semibold"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Minta Revisi</span>
                  </button>

                  <button
                    onClick={() => handleOpenActionModal(report, "approve")}
                    className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Setujui (Tayangkan & Cocokkan)</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {modalOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              {actionType === "approve"
                ? "Konfirmasi Setujui Laporan"
                : actionType === "reject"
                ? "Tolak Laporan Kehilangan"
                : "Minta Civitas Merevisi Laporan"}
            </h3>

            <p className="text-xs text-slate-500">
              {actionType === "approve"
                ? `Laporan "${selectedReport.judul}" akan langsung tayang di papan pengumuman dan dipindai secara otomatis terhadap seluruh barang temuan di resepsionis.`
                : actionType === "reject"
                ? "Pelapor akan menerima notifikasi penolakan beserta alasan yang Anda cantumkan di bawah."
                : "Tuliskan petunjuk jelas perbaikan yang harus dilakukan pelapor (misal: deskripsi kurang jelas, foto buram, dsb)."}
            </p>

            <form onSubmit={handleConfirmAction} className="space-y-4">
              {actionType !== "approve" && (
                <textarea
                  rows={3}
                  required
                  placeholder={
                    actionType === "reject"
                      ? "Alasan penolakan (misal: konten duplikat, barang tidak relevan kampus)..."
                      : "Instruksi revisi (misal: mohon perjelas ciri spesifik barang)..."
                  }
                  value={actionInput}
                  onChange={(e) => setActionInput(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              )}

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-1.5 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm ${
                    actionType === "approve"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : actionType === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {submitting ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
