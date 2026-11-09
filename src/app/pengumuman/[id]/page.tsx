"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Tag,
  Share2,
  Copy,
  Check,
  FileDown,
  Flag,
  ShieldCheck,
  Building,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (reportId) {
      fetch(`/api/public/reports/${reportId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.report) {
            setReport(data.report);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [reportId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    if (!report) return;
    const text = `📢 PENGUMUMAN KEHILANGAN KAMPUS: ${report.judul}\nKategori: ${report.category?.nama}\nLokasi Terakhir: ${report.location?.nama_gedung} (${report.location?.nama_ruang})\nBila menemukan, mohon serahkan ke Meja Resepsionis Kampus.\nLihat detail: ${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDownloadPoster = () => {
    if (!report) return;

    const doc = new jsPDF();
    doc.setFillColor(30, 58, 138); // Blue 900
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("PENGUMUMAN KEHILANGAN BARANG", 105, 18, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Laporan Kehilangan Kampus Terpadu", 105, 26, { align: "center" });

    // Body
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(report.judul, 20, 50);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);

    let y = 62;
    doc.text(`Kategori: ${report.category?.nama || "-"}`, 20, y);
    y += 8;
    doc.text(
      `Lokasi Terakhir: ${report.location?.nama_gedung || "-"} (${report.location?.nama_ruang || "-"})`,
      20,
      y
    );
    y += 8;
    doc.text(
      `Tanggal Hilang: ${new Date(report.tanggal_hilang).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      20,
      y
    );
    y += 12;

    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Deskripsi Barang:", 20, y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(51, 65, 85);
    const splitDesc = doc.splitTextToSize(report.deskripsi, 170);
    doc.text(splitDesc, 20, y);
    y += splitDesc.length * 6 + 15;

    // Notice box
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(20, y, 170, 38, 3, 3, "F");
    doc.setTextColor(30, 58, 138);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("APAKAH ANDA MENEMUKAN BARANG INI?", 105, y + 10, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(
      "Mohon segera serahkan ke Meja Resepsionis Lobi Utama Gedung Rektorat.",
      105,
      y + 18,
      { align: "center" }
    );
    doc.text(
      "Barang akan diverifikasi dan diserahterimakan secara resmi kepada pemilik sah.",
      105,
      y + 25,
      { align: "center" }
    );

    doc.save(`Poster_Kehilangan_${report.id}.pdf`);
  };

  const handleReportContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/public/reports/${report.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alasan: reportReason.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setReportModalOpen(false);
        setReportReason("");
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal mengirim laporan konten.");
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat rincian pengumuman...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Laporan Tidak Ditemukan</h2>
        <p className="text-sm text-slate-600">
          Pengumuman ini mungkin telah selesai diserahkan, kedaluwarsa, atau dihapus oleh pemiliknya.
        </p>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Papan Pengumuman</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center space-x-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Papan Pengumuman</span>
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Top Header Card */}
        <div className="p-6 sm:p-8 border-b border-slate-100 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {report.category?.nama}
              </span>
              {report.status === "AdaKandidat" ? (
                <span className="flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ada Kandidat Ditemukan</span>
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                  Tayang di Papan Pengumuman
                </span>
              )}
            </div>

            <span className="text-xs text-slate-400">
              ID Pengumuman: #{report.id}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            {report.judul}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 pt-2">
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Lokasi Terakhir:</strong> {report.location?.nama_gedung} • {report.location?.nama_ruang}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                <strong>Tanggal Hilang:</strong>{" "}
                {new Date(report.tanggal_hilang).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Photos (if any) */}
        {report.images && report.images.length > 0 && (
          <div className="p-6 sm:p-8 bg-slate-50 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Foto Barang yang Dilampirkan
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {report.images.map((img: any) => (
                <div
                  key={img.id}
                  className="rounded-xl overflow-hidden border border-slate-200 bg-white h-56 flex items-center justify-center"
                >
                  <img
                    src={img.path}
                    alt={report.judul}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Description */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Deskripsi Lengkap
            </h3>
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {report.deskripsi}
            </p>
          </div>

          {/* Privacy Protection notice (BR-03, BR-10, NFR-SEC-04) */}
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start space-x-3 text-xs text-blue-900">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Perlindungan Ciri Rahasia & Privasi Pelapor</p>
              <p className="text-blue-700 leading-relaxed">
                Nomor telepon, email, dan ciri rahasia barang disembunyikan dari publik. Ciri rahasia hanya dicocokkan secara tatap muka oleh resepsionis kampus ketika Anda datang mengambil barang.
              </p>
            </div>
          </div>

          {/* Social share & actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleShareWhatsApp}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Bagikan ke WhatsApp</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Tautan Disalin!" : "Salin Tautan"}</span>
              </button>

              <button
                onClick={handleDownloadPoster}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs transition-colors"
              >
                <FileDown className="w-4 h-4 text-blue-600" />
                <span>Unduh Poster PDF</span>
              </button>
            </div>

            <button
              onClick={() => setReportModalOpen(true)}
              className="flex items-center space-x-1 text-xs text-slate-400 hover:text-red-600 transition-colors"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Laporkan Konten</span>
            </button>
          </div>
        </div>

        {/* Found callout banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-lg">Apakah Anda menemukan barang ini?</h4>
            <p className="text-xs text-blue-200 max-w-xl">
              Harap serahkan barang temuan ke Meja Resepsionis Lobi Utama Gedung Rektorat agar dapat dicatat secara resmi dan dikembalikan kepada pemilik sah.
            </p>
          </div>
          <Link
            href="/galeri-temuan"
            className="px-5 py-2.5 bg-white text-blue-800 font-bold rounded-xl text-xs hover:bg-blue-50 transition-colors shadow flex-shrink-0"
          >
            Lihat Galeri Temuan
          </Link>
        </div>
      </div>

      {/* Report Inappropriate Content Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Laporkan Konten Tidak Pantas</h3>
            <p className="text-xs text-slate-500">
              Laporan Anda akan dikirimkan kepada tim resepsionis untuk dilakukan moderasi dan penyembunyian konten jika terbukti melanggar aturan kampus.
            </p>

            <form onSubmit={handleReportContent} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="Tuliskan alasan pelaporan (misal: konten spam, penipuan, kata-kata kasar, dsb)..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors"
                >
                  {submittingReport ? "Mengirim..." : "Kirim Laporan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
