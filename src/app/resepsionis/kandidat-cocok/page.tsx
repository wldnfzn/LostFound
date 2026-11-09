"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Sparkles,
  CheckCircle,
  XCircle,
  MapPin,
  Calendar,
  Lock,
  ArrowRight,
  ClipboardCheck,
  Tag,
} from "lucide-react";

export default function KandidatKecocokanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("kandidat");

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/receptionist/matches?status=${filterStatus}`);
      if (res.ok) {
        const data = await res.json();
        setMatches(data.matches || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMatches();
  }, [user, filterStatus]);

  const handleDecision = async (matchId: number, action: "accept" | "reject") => {
    const confirmMsg =
      action === "accept"
        ? "Terima kandidat ini? Pelapor akan mendapatkan notifikasi untuk mengambil barang ke resepsionis."
        : "Tolak kandidat ini? Pasangan ini tidak akan dimunculkan lagi di sistem.";

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch("/api/receptionist/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, action }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchMatches();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal memproses keputusan.");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Menghitung kandidat kecocokan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Algoritma Pencocokan Otomatis (SRS Bagian 9)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kandidat Pasangan Kecocokan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Sistem menghitung skor kecocokan berbobot (0–100) berdasarkan kesamaan kategori, lokasi gedung, waktu kejadian, dan kata kunci.
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 shadow-sm"
        >
          <option value="kandidat">Menunggu Keputusan Saja</option>
          <option value="diterima">Diterima (Ada Kandidat)</option>
          <option value="ditolak">Ditolak</option>
          <option value="all">Semua Status</option>
        </select>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Sparkles className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-lg">
            Tidak Ada Kandidat Kecocokan
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Belum ada pasangan laporan kehilangan dan barang temuan yang mencapai ambang skor minimal (≥ 60).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {matches.map((match) => {
            let breakdown: any = {};
            try {
              if (match.rincian_skor) breakdown = JSON.parse(match.rincian_skor);
            } catch {}

            return (
              <div
                key={match.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6"
              >
                {/* Header Score & Decision Status */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xl shadow-md shadow-purple-500/20">
                      {match.skor}%
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Tingkat Kemiripan
                      </div>
                      <div className="text-sm font-bold text-purple-700">
                        {match.skor >= 85
                          ? "Sangat Tinggi (Prioritas Serah Terima)"
                          : "Tinggi (Kandidat Kuat)"}
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Kategori: {breakdown.kategori || 0}/30
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Lokasi: {breakdown.lokasi || 0}/25
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Waktu: {breakdown.waktu || 0}/20
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 font-semibold text-slate-700">
                      Kata Kunci: {breakdown.kata_kunci || 0}/25
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Left: Laporan Kehilangan (Civitas) */}
                  <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase">
                        Laporan Kehilangan #{match.lost_report?.id}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">
                        {match.lost_report?.judul}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {match.lost_report?.deskripsi}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-blue-200/60">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          {match.lost_report?.location?.nama_gedung} •{" "}
                          {match.lost_report?.location?.nama_ruang}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>
                          Hilang:{" "}
                          {new Date(match.lost_report?.tanggal_hilang).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 pt-1">
                        Pelapor: {match.lost_report?.user?.nama} ({match.lost_report?.user?.email_kampus})
                      </div>
                    </div>

                    {/* Secret feature of lost report */}
                    <div className="p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-amber-800">
                      <div className="font-bold flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ciri Rahasia Pengumuman:</span>
                      </div>
                      <span className="italic">{match.lost_report?.ciri_rahasia}</span>
                    </div>
                  </div>

                  {/* Right: Barang Temuan Fisik di Meja */}
                  <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-700 text-white uppercase">
                          {match.found_item?.kode_barang}
                        </span>
                        {match.found_item?.bernilai_tinggi && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 uppercase">
                            Nilai Tinggi
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">
                        {match.found_item?.judul_publik}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {match.found_item?.deskripsi}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-3 border-t border-emerald-200/60">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {match.found_item?.location?.nama_gedung} •{" "}
                          {match.found_item?.location?.nama_ruang}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Ditemukan:{" "}
                          {new Date(match.found_item?.tanggal_temuan).toLocaleDateString(
                            "id-ID"
                          )}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 pt-1">
                        Disimpan di: {match.found_item?.lokasi_simpan}
                      </div>
                    </div>

                    {/* Secret feature of found item */}
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs text-amber-800">
                      <div className="font-bold flex items-center space-x-1">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Ciri Fisik Temuan di Meja:</span>
                      </div>
                      <span className="italic">
                        {match.found_item?.ciri_rahasia || "(Tidak ada catatan khusus)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons for Receptionist */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Status saat ini: <strong>{match.status}</strong>
                  </span>

                  <div className="flex flex-wrap items-center gap-2">
                    {match.status === "kandidat" && (
                      <>
                        <button
                          onClick={() => handleDecision(match.id, "reject")}
                          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Tolak Pasangan</span>
                        </button>

                        <button
                          onClick={() => handleDecision(match.id, "accept")}
                          className="flex items-center space-x-1 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Terima Kandidat & Beritahu Pelapor</span>
                        </button>
                      </>
                    )}

                    {match.status === "diterima" && (
                      <Link
                        href={`/resepsionis/serah-terima?foundId=${match.found_id}&lostId=${match.lost_id}`}
                        className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        <span>Lanjutkan ke Serah Terima</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
