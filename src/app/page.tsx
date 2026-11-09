"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  Tag,
  ArrowRight,
  PlusCircle,
  PackageOpen,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

interface Report {
  id: number;
  judul: string;
  deskripsi: string;
  tanggal_hilang: string;
  status: string;
  created_at: string;
  category: { id: number; nama: string };
  location: { id: number; nama_gedung: string; nama_ruang: string };
  images: Array<{ id: number; path: string; thumbnail_path: string | null }>;
}

export default function HomePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGedung, setSelectedGedung] = useState("all");
  const [categories, setCategories] = useState<Array<{ id: number; nama: string }>>([]);
  const [gedungList, setGedungList] = useState<string[]>([]);

  // Fetch master data
  useEffect(() => {
    fetch("/api/public/master")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) setCategories(data.categories);
        if (data.locations) {
          const uniqueGedung = Array.from(
            new Set(data.locations.map((l: any) => l.nama_gedung))
          ) as string[];
          setGedungList(uniqueGedung);
        }
      })
      .catch(console.error);
  }, []);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append("search", search.trim());
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedGedung !== "all") params.append("gedung", selectedGedung);

      const res = await fetch(`/api/public/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedCategory, selectedGedung]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  return (
    <div className="space-y-10 sm:space-y-12 pb-20">
      {/* Institutional Hero Banner */}
      <section className="relative overflow-hidden bg-slate-900 border-b border-slate-800 text-white py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:20px_20px]" />
        
        <div className="relative max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Papan Pengumuman Resmi Kampus</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Pusat Informasi Kehilangan & <br className="hidden sm:inline" />
            <span className="text-blue-400">
              Temuan Barang Kampus
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
            Layanan resmi kampus untuk memfasilitasi civitas dalam mengumumkan barang hilang dan memeriksa barang temuan yang diamankan di meja resepsionis secara akurat dan terpercaya.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/civitas/lapor"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Buat Laporan Kehilangan</span>
            </Link>

            <Link
              href="/galeri-temuan"
              className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm border border-white/20 backdrop-blur-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PackageOpen className="w-5 h-5 text-teal-300" />
              <span>Lihat Galeri Barang Temuan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Search & Filter Card */}
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200/90 shadow-sm space-y-5">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang, laptop, buku, helm, dompet, kunci..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-7 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-2xl shadow-sm transition-colors flex items-center justify-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>Cari Laporan</span>
            </button>
          </form>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
            <div className="flex items-center space-x-1.5 text-slate-700 font-bold">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Filter:</span>
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>

            {/* Building Dropdown */}
            <select
              value={selectedGedung}
              onChange={(e) => setSelectedGedung(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="all">Semua Gedung</option>
              {gedungList.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {(selectedCategory !== "all" || selectedGedung !== "all" || search) && (
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedGedung("all");
                  setSearch("");
                }}
                className="text-xs text-red-600 hover:text-red-700 font-bold ml-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Reports Header & Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Daftar Pengumuman Kehilangan Aktif
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Menampilkan pengumuman resmi yang telah diverifikasi oleh resepsionis
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-200/70 px-3 py-1 rounded-full self-start sm:self-auto">
              {reports.length} Laporan Tersedia
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-9 w-9 border-4 border-blue-600 border-t-transparent" />
              <p className="text-sm font-semibold text-slate-600">Memuat pengumuman kehilangan...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-14 text-center space-y-4 shadow-xs">
              <PackageOpen className="w-14 h-14 text-slate-300 mx-auto" />
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 text-lg">
                  Tidak Ada Laporan yang Cocok
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada laporan kehilangan yang sesuai dengan kata kunci pencarian atau filter yang Anda pilih.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/pengumuman/${report.id}`}
                  className="group bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-300 transition-all duration-200 flex flex-col justify-between"
                >
                  {/* Photo area */}
                  <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    {report.images && report.images.length > 0 ? (
                      <img
                        src={report.images[0].path}
                        alt={report.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Tag className="w-10 h-10 mx-auto mb-1 stroke-1 text-slate-300" />
                        <span className="text-xs font-medium text-slate-400">Foto tidak dilampirkan</span>
                      </div>
                    )}

                    {/* Status Pill */}
                    <div className="absolute top-3 left-3">
                      {report.status === "AdaKandidat" ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ada Kandidat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white shadow-md">
                          Tayang
                        </span>
                      )}
                    </div>

                    {/* Category Label */}
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-slate-900/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs">
                        {report.category?.nama}
                      </span>
                    </div>
                  </div>

                  {/* Body Details */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base leading-snug group-hover:text-blue-700 transition-colors line-clamp-2">
                        {report.judul}
                      </h3>
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {report.deskripsi}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        <span className="truncate font-medium text-slate-700">
                          {report.location?.nama_gedung} • {report.location?.nama_ruang}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-500">
                          Hilang:{" "}
                          <strong className="text-slate-700">
                            {new Date(report.tanggal_hilang).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-blue-700 text-xs font-bold group-hover:translate-x-0.5 transition-transform">
                      <span>Lihat Rincian Pengumuman</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
