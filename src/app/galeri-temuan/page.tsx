"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  PackageOpen,
  Search,
  Filter,
  MapPin,
  Calendar,
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
} from "lucide-react";

interface FoundItem {
  id: number;
  kode_barang: string;
  judul_publik: string;
  deskripsi: string;
  tanggal_temuan: string;
  bernilai_tinggi: boolean;
  is_dokumen_identitas: boolean;
  category: { id: number; nama: string };
  location: { id: number; nama_gedung: string; nama_ruang: string };
  images: Array<{ id: number; path: string; thumbnail_path: string | null; is_blurred: boolean }>;
}

export default function GaleriTemuanPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState<Array<{ id: number; nama: string }>>([]);

  // Claim modal
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FoundItem | null>(null);
  const [claimDescription, setClaimDescription] = useState("");
  const [identityType, setIdentityType] = useState("KTM");
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/public/master")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
      })
      .catch(console.error);
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await fetch(`/api/public/found-items?${params.toString()}`);
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
    fetchItems();
  }, [selectedCategory]);

  const handleOpenClaimModal = (item: FoundItem) => {
    setSelectedItem(item);
    setClaimDescription("");
    setClaimSuccessMessage(null);
    setClaimModalOpen(true);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !claimDescription.trim()) return;

    setSubmittingClaim(true);
    try {
      const res = await fetch("/api/civitas/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          found_id: selectedItem.id,
          keterangan: claimDescription.trim(),
          jenis_identitas: identityType,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setClaimSuccessMessage(data.message);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal mengirim klaim.");
    } finally {
      setSubmittingClaim(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      {/* Header Info Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold">
          <PackageOpen className="w-4 h-4 text-teal-700" />
          <span>Inventaris Meja Resepsionis Kampus</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Galeri Barang Temuan
        </h1>
        <p className="text-slate-600 text-sm max-w-3xl leading-relaxed">
          Seluruh barang di bawah ini saat ini dititipkan dan diamankan di Meja Resepsionis Lobi Utama Gedung Rektorat. Demi mencegah klaim palsu dan menjaga privasi pemilik asli, foto dan detail khusus disensor.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode barang (TMN-...) atau judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchItems()}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-600 font-bold whitespace-nowrap">Kategori:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Items Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-600">Memuat galeri barang temuan...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center space-y-3 shadow-xs">
          <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-800 text-lg">
            Tidak Ada Barang Temuan Tersimpan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Saat ini tidak ada barang titipan di resepsionis untuk filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              {/* Blurred Photo Area */}
              <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center border-b border-slate-100">
                {item.images && item.images.length > 0 ? (
                  <div className="relative w-full h-full">
                    <img
                      src={item.images[0].path}
                      alt={item.judul_publik}
                      className="w-full h-full object-cover filter blur-[8px] scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-[11px] font-bold shadow-md">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Foto Disensor (Keamanan)</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4 text-slate-400">
                    <Lock className="w-8 h-8 mx-auto mb-1 stroke-1 text-slate-300" />
                    <span className="text-xs font-semibold text-slate-500">Tersimpan di Resepsionis</span>
                  </div>
                )}

                {/* Item Code Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-3 py-1 rounded-lg text-xs font-mono font-extrabold bg-slate-900 text-white shadow-md">
                    {item.kode_barang}
                  </span>
                </div>

                {/* High Value Warning */}
                {item.bernilai_tinggi && (
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500 text-white shadow-md uppercase">
                      Nilai Tinggi
                    </span>
                  </div>
                )}
              </div>

              {/* Item Info */}
              <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                      {item.category?.nama}
                    </span>
                    {item.is_dokumen_identitas && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md">
                        Dokumen Identitas
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {item.judul_publik}
                  </h3>

                  <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                    {item.deskripsi}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-slate-700 truncate">
                      Ditemukan: {item.location?.nama_gedung} • {item.location?.nama_ruang}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>
                      Tanggal:{" "}
                      <strong className="text-slate-700">
                        {new Date(item.tanggal_temuan).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2">
                  {user ? (
                    <button
                      onClick={() => handleOpenClaimModal(item)}
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-600/20"
                    >
                      <FileCheck className="w-4 h-4" />
                      <span>Ajukan Klaim Barang Ini</span>
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-center border border-slate-200"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Masuk Akun Civitas untuk Klaim</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      {claimModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5">
            <div className="space-y-1">
              <span className="text-xs font-mono font-extrabold text-blue-700">
                {selectedItem.kode_barang}
              </span>
              <h3 className="font-extrabold text-slate-900 text-lg">
                Pengajuan Klaim: {selectedItem.judul_publik}
              </h3>
            </div>

            {claimSuccessMessage ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3 text-emerald-950">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <span>Klaim Berhasil Diajukan!</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed font-medium">
                  {claimSuccessMessage}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setClaimModalOpen(false)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Kartu Identitas Fisik yang Akan Dibawa:
                  </label>
                  <select
                    value={identityType}
                    onChange={(e) => setIdentityType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  >
                    <option value="KTM">KTM (Kartu Tanda Mahasiswa)</option>
                    <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                    <option value="SIM">SIM (Surat Izin Mengemudi)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800">
                    Ciri Khusus / Bukti Kepemilikan Anda:
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Sebutkan ciri khusus yang membuktikan barang ini milik Anda (misal: warna casing dalam, nomor seri, isi khusus dompet, stiker tersembunyi)..."
                    value={claimDescription}
                    onChange={(e) => setClaimDescription(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
                  ⚠️ <strong>Perhatian:</strong> Klaim palsu dapat dikenakan sanksi tata tertib kampus. Serah terima barang hanya sah setelah resepsionis memverifikasi kartu identitas fisik dan mencocokkan ciri rahasia.
                </div>

                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submittingClaim}
                    className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    {submittingClaim ? "Mengirim..." : "Kirim Pengajuan Klaim"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
