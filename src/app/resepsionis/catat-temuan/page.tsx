"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CameraCapture from "@/components/CameraCapture";
import QRLabelModal from "@/components/QRLabelModal";
import {
  PackagePlus,
  Tag,
  MapPin,
  Calendar,
  Lock,
  Printer,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";

export default function CatatBarangTemuanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedGedung, setSelectedGedung] = useState("");
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    judul_publik: "",
    category_id: "",
    location_id: "",
    tanggal_temuan: "",
    deskripsi: "",
    ciri_rahasia: "",
    nama_penemu: "",
    lokasi_simpan: "Loker A-1 Meja Resepsionis",
    bernilai_tinggi: false,
    is_dokumen_identitas: false,
    pemilik_dihubungi: false,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tanggal_temuan: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [createdItem, setCreatedItem] = useState<any>(null);
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    fetch("/api/public/master")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.locations) setLocations(data.locations);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedGedung) {
      const rooms = locations.filter((l) => l.nama_gedung === selectedGedung);
      setFilteredRooms(rooms);
      if (rooms.length > 0) {
        setFormData((prev) => ({ ...prev, location_id: String(rooms[0].id) }));
      }
    } else {
      setFilteredRooms([]);
      setFormData((prev) => ({ ...prev, location_id: "" }));
    }
  }, [selectedGedung, locations]);

  const uniqueGedung = Array.from(new Set(locations.map((l) => l.nama_gedung)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        images: photoDataUrl ? [{ path: photoDataUrl }] : [],
      };

      const res = await fetch("/api/receptionist/found-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedItem(data.item);
        setLabelModalOpen(true);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal mencatat barang temuan.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            <span>Target Pengisian Cepat: ≤ 3 Menit (NFR-USE-02)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pencatatan Barang Temuan Baru
          </h1>
        </div>

        <span className="text-xs text-slate-500">
          Petugas Resepsionis: <strong>{user?.nama}</strong>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Row 1: Nama Barang & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Judul / Nama Barang Temuan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Dompet Hitam Braun Buffel, Kunci Honda Vario..."
              value={formData.judul_publik}
              onChange={(e) => setFormData({ ...formData, judul_publik: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Kategori Barang <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">-- Pilih --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Lokasi Ditemukan & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Gedung Ditemukan <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedGedung}
              onChange={(e) => setSelectedGedung(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            >
              <option value="">-- Pilih Gedung --</option>
              {uniqueGedung.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Ruangan / Titik Ditemukan <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={!selectedGedung}
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 disabled:opacity-50"
            >
              <option value="">-- Pilih Ruangan --</option>
              {filteredRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_ruang}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Tanggal Temuan <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.tanggal_temuan}
              onChange={(e) => setFormData({ ...formData, tanggal_temuan: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>
        </div>

        {/* Row 3: Penemu & Lokasi Simpan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Nama / Identitas Penemu (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Pak Joko (Satpam Gedung A), Mahasiswa Anonim..."
              value={formData.nama_penemu}
              onChange={(e) => setFormData({ ...formData, nama_penemu: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Lokasi Penyimpanan di Resepsionis <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Loker A-1, Brankas Terkunci B-2, Laci Dokumen..."
              value={formData.lokasi_simpan}
              onChange={(e) => setFormData({ ...formData, lokasi_simpan: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Deskripsi & Ciri Rahasia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Deskripsi Umum (Aman Tampil di Galeri Publik) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Deskripsi tanpa menyebutkan kode rahasia atau isi dompet secara mendalam..."
              value={formData.deskripsi}
              onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder:text-slate-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-amber-900 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Ciri Rahasia / Bukti Fisik Validasi (TIDAK Tampil ke Publik)</span>
            </label>
            <textarea
              rows={3}
              placeholder="Nomor seri, stiker tersembunyi, isi kartu dalam dompet, gantungan khusus..."
              value={formData.ciri_rahasia}
              onChange={(e) => setFormData({ ...formData, ciri_rahasia: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-amber-300 bg-amber-50/40 text-xs focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Checkboxes: Bernilai Tinggi & Dokumen Identitas (BR-07, FR-FOUND-08) */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="bernilai_tinggi"
              checked={formData.bernilai_tinggi}
              onChange={(e) => setFormData({ ...formData, bernilai_tinggi: e.target.checked })}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label htmlFor="bernilai_tinggi" className="text-xs font-bold text-slate-800 cursor-pointer">
              ⚠️ Barang Bernilai Tinggi (Laptop, HP, Dompet Berisi Uang Besar) - Disimpan di Brankas Terkunci (BR-07)
            </label>
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_dokumen_identitas"
              checked={formData.is_dokumen_identitas}
              onChange={(e) => setFormData({ ...formData, is_dokumen_identitas: e.target.checked })}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label htmlFor="is_dokumen_identitas" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Dokumen Identitas Kampus (KTM, KTP, SIM, STNK) (BR-08)
            </label>
          </div>
        </div>

        {/* Foto Barang */}
        <CameraCapture
          label="Ambil Foto Barang Fisik (Webcam Meja atau Berkas)"
          onCapture={setPhotoDataUrl}
        />

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2"
          >
            <span>{loading ? "Menyimpan & Mencocokkan..." : "Simpan & Cetak Label QR"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* QR Label Print Modal (FR-FOUND-05) */}
      <QRLabelModal
        isOpen={labelModalOpen}
        onClose={() => {
          setLabelModalOpen(false);
          router.push("/resepsionis/barang-temuan");
        }}
        item={createdItem}
      />
    </div>
  );
}
