"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import QRLabelModal from "@/components/QRLabelModal";
import {
  Archive,
  Search,
  Printer,
  ShieldAlert,
  ClipboardCheck,
  PlusCircle,
  Clock,
  Sparkles,
} from "lucide-react";

export default function DaftarBarangTemuanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("Disimpan");
  const [search, setSearch] = useState("");
  const [bernilaiTinggi, setBernilaiTinggi] = useState(false);

  // Label modal
  const [selectedItemForLabel, setSelectedItemForLabel] = useState<any>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search.trim()) params.append("search", search.trim());
      if (bernilaiTinggi) params.append("bernilaiTinggi", "true");

      const res = await fetch(`/api/receptionist/found-items?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchItems();
  }, [user, statusFilter, bernilaiTinggi]);

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat inventaris barang temuan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Daftar Inventaris Barang Temuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola barang fisik titipan di resepsionis, cetak ulang label QR, dan pantau status serah terima.
          </p>
        </div>

        <Link
          href="/resepsionis/catat-temuan"
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Catat Barang Temuan Baru</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-[240px]">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kode (TMN-...), judul, atau lokasi simpan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchItems()}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={fetchItems}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Cari
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
          >
            <option value="Disimpan">Status: Disimpan (Aktif)</option>
            <option value="Diserahkan">Status: Diserahkan (Selesai)</option>
            <option value="TidakDiklaim">Status: Tidak Diklaim (Lewat Batas)</option>
            <option value="Dialihkan">Status: Dialihkan</option>
            <option value="all">Semua Status</option>
          </select>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={bernilaiTinggi}
              onChange={(e) => setBernilaiTinggi(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded"
            />
            <span>Hanya Nilai Tinggi</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Kode & Judul Barang</th>
                <th className="py-3.5 px-4">Kategori & Lokasi Temuan</th>
                <th className="py-3.5 px-4">Lokasi Simpan (Meja)</th>
                <th className="py-3.5 px-4">Batas Simpan</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-extrabold text-blue-700">
                        {item.kode_barang}
                      </span>
                      {item.bernilai_tinggi && (
                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-bold rounded">
                          Nilai Tinggi
                        </span>
                      )}
                    </div>
                    <div className="font-semibold text-slate-900">{item.judul_publik}</div>
                    {item.ciri_rahasia && (
                      <div className="text-[11px] text-amber-700 italic">
                        Ciri: {item.ciri_rahasia}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="font-medium text-slate-800">{item.category?.nama}</div>
                    <div className="text-slate-400">
                      {item.location?.nama_gedung} • {item.location?.nama_ruang}
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {item.lokasi_simpan}
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div>
                      {new Date(item.batas_simpan).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    {item.status === "Disimpan" && (
                      <div className="text-[10px] text-slate-400">
                        {Math.ceil(
                          (new Date(item.batas_simpan).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        hari lagi
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === "Disimpan"
                          ? "bg-blue-100 text-blue-800"
                          : item.status === "Diserahkan"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                    {/* Print Label Button (FR-FOUND-05) */}
                    <button
                      onClick={() => {
                        setSelectedItemForLabel(item);
                        setLabelModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                      title="Cetak Label QR"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Handover Shortcut if stored */}
                    {item.status === "Disimpan" && (
                      <Link
                        href={`/resepsionis/serah-terima?foundId=${item.id}`}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm transition-colors"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        <span>Serah Terima</span>
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Label Print Modal */}
      <QRLabelModal
        isOpen={labelModalOpen}
        onClose={() => setLabelModalOpen(false)}
        item={selectedItemForLabel}
      />
    </div>
  );
}
