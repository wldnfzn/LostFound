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
  Share2,
  ShieldAlert,
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
    <div className="space-y-10 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Papan Pengumuman Resmi Kampus</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Kehilangan Barang di Kampus? <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-teal-200 to-indigo-200">
              Cari & Laporkan dengan Cepat
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
            Pusat koordinasi laporan barang hilang dan penitipan barang temuan terpadu. Verifikasi kepemilikan aman melalui ciri rahasia dan serah terima resmi di resepsionis.
          </p>

          {/* Quick Action CTA */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/civitas/lapor"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/25 transition-all text-sm"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Laporkan Kehilangan</span>
            </Link>

            <Link
              href="/galeri-temuan"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold backdrop-blur-sm transition-all text-sm border border-white/20"
            >
              <PackageOpen className="w-5 h-5 text-teal-300" />
              <span>Lihat Galeri Barang Temuan</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Search & Filter Bar */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama barang, laptop, dompet, kunci, dsb..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-colors"
            >
              Cari Laporan
            </button>
          </form>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs sm:text-sm">
            <div className="flex items-center space-x-1.5 text-slate-500 font-medium">
              <Filter className="w-4 h-4" />
              <span>Filter:</span>
            </div>

            {/* Kategori Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nama}
                </option>
              ))}
            </select>

            {/* Gedung Filter */}
            <select
              value={selectedGedung}
              onChange={(e) => setSelectedGedung(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium text-xs focus:ring-2 focus:ring-blue-500"
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
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Reports Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-slate-900">
              Laporan Kehilangan Aktif ({reports.length})
            </h2>
            <span className="text-xs text-slate-500">
              Diperbarui secara real-time
            </span>
          </div>

          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
              <p className="text-sm text-slate-500">Memuat laporan tayang...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <PackageOpen className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-semibold text-slate-800 text-lg">
                Tidak ada laporan yang cocok
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Belum ada laporan kehilangan yang sesuai dengan pencarian atau filter Anda.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/pengumuman/${report.id}`}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col"
                >
                  {/* Image Thumbnail */}
                  <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                    {report.images && report.images.length > 0 ? (
                      <img
                        src={report.images[0].path}
                        alt={report.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <Tag className="w-10 h-10 mx-auto mb-1 stroke-1" />
                        <span className="text-xs">Foto tidak dilampirkan</span>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      {report.status === "AdaKandidat" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-md">
                          <Sparkles className="w-3 h-3" />
                          <span>Ada Kandidat</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-md">
                          Tayang
                        </span>
                      )}
                    </div>

                    {/* Category Pill */}
                    <div className="absolute bottom-3 right-3">
                      <span className="bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-md text-[11px] font-medium">
                        {report.category?.nama}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-2">
                        {report.judul}
                      </h3>
                      <p className="text-slate-600 text-xs line-clamp-2 leading-relaxed">
                        {report.deskripsi}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">
                          {report.location?.nama_gedung} • {report.location?.nama_ruang}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          Hilang pada:{" "}
                          {new Date(report.tanggal_hilang).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between text-blue-600 text-xs font-semibold">
                      <span>Lihat Rincian Pengumuman</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
