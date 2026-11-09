"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import CameraCapture from "@/components/CameraCapture";
import {
  FileText,
  Lock,
  MapPin,
  Calendar,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function BuatLaporanPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedGedung, setSelectedGedung] = useState("");
  const [filteredRooms, setFilteredRooms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    judul: "",
    category_id: "",
    location_id: "",
    tanggal_hilang: "",
    deskripsi: "",
    ciri_rahasia: "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      tanggal_hilang: new Date().toISOString().split("T")[0],
    }));
  }, []);

  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load categories and locations
  useEffect(() => {
    fetch("/api/public/master")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.locations) setLocations(data.locations);
      })
      .catch(console.error);
  }, []);

  // Filter rooms when building changes (SRS 5.1: dropdown bertingkat gedung lalu ruang)
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
    setError(null);
    setLoading(true);

    try {
      const payload = {
        ...formData,
        images: photoDataUrl ? [{ path: photoDataUrl }] : [],
      };

      const res = await fetch("/api/civitas/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat laporan.");
      } else {
        alert("Laporan berhasil dibuat dan masuk antrean verifikasi resepsionis!");
        router.push("/civitas/laporan-saya");
      }
    } catch {
      setError("Terjadi gangguan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Buat Laporan Kehilangan
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Isi detail barang yang hilang. Laporan akan ditinjau oleh resepsionis kampus sebelum tayang di papan pengumuman resmi.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs leading-relaxed flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Nama Barang */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">
            Nama / Judul Barang <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Contoh: Laptop Asus Zenbook Hitam, Dompet Kulit Coklat, Kunci Motor Honda..."
            value={formData.judul}
            onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Kategori & Tanggal Hilang */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Kategori Barang <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Perkiraan Tanggal Hilang <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.tanggal_hilang}
              onChange={(e) => setFormData({ ...formData, tanggal_hilang: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Dropdown Bertingkat: Gedung lalu Ruang (SRS 5.1) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Lokasi Gedung Terakhir <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedGedung}
              onChange={(e) => setSelectedGedung(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Pilih Gedung Kampus --</option>
              {uniqueGedung.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Ruang / Titik Area Spesifik <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={!selectedGedung}
              value={formData.location_id}
              onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">-- Pilih Ruangan / Area --</option>
              {filteredRooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama_ruang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deskripsi Umum */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-800">
            Deskripsi Umum (Akan Tayang di Publik) <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Jelaskan ciri umum barang, perkiraan kronologi tertinggal, warna utama..."
            value={formData.deskripsi}
            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
            className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Ciri Rahasia (Secret Feature) - CRITICAL (BR-03, NFR-SEC-04) */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-900">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Ciri Rahasia Barang (HANYA Anda dan Resepsionis yang Tahu) *</span>
          </div>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Ciri ini <strong>TIDAK PERNAH DITAMPILKAN KE PUBLIK</strong>. Digunakan sebagai bukti sah kepemilikan ketika mencocokkan barang dengan resepsionis (misal: nomor seri, gantungan khusus di dalam resleting, stiker tersembunyi, goresan khas, isi dompet).
          </p>
          <textarea
            rows={2}
            required
            placeholder="Contoh: Ada stiker kecil logo Marvel di bagian bawah, atau digit terakhir nomor seri 8892..."
            value={formData.ciri_rahasia}
            onChange={(e) => setFormData({ ...formData, ciri_rahasia: e.target.value })}
            className="w-full p-2.5 rounded-xl border border-amber-300 bg-white text-xs focus:ring-2 focus:ring-amber-500"
          />
        </div>

        {/* Foto Barang (Opsional) */}
        <div className="space-y-2">
          <CameraCapture
            label="Lampirkan Foto Barang (Opsional - Webcam atau Unggah Berkas)"
            onCapture={setPhotoDataUrl}
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            <span>{loading ? "Menyimpan..." : "Kirim Laporan"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
