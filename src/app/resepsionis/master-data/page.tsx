"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Database, Plus, Check, X, Building, Tag } from "lucide-react";

export default function MasterDataPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category
  const [newCategoryName, setNewCategoryName] = useState("");
  // New Location
  const [newGedung, setNewGedung] = useState("");
  const [newZona, setNewZona] = useState("Zona Pusat");
  const [newRuang, setNewRuang] = useState("");

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/master");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        setLocations(data.locations || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      const res = await fetch("/api/receptionist/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          action: "create",
          data: { nama: newCategoryName.trim() },
        }),
      });

      if (res.ok) {
        setNewCategoryName("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleCategory = async (id: number, currentAktif: boolean) => {
    try {
      const res = await fetch("/api/receptionist/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "category",
          action: "toggle",
          data: { id, aktif: !currentAktif },
        }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGedung.trim() || !newRuang.trim()) return;

    try {
      const res = await fetch("/api/receptionist/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "location",
          action: "create",
          data: {
            nama_gedung: newGedung.trim(),
            zona_area: newZona.trim(),
            nama_ruang: newRuang.trim(),
          },
        }),
      });

      if (res.ok) {
        setNewRuang("");
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLocation = async (id: number, currentAktif: boolean) => {
    try {
      const res = await fetch("/api/receptionist/master", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "location",
          action: "toggle",
          data: { id, aktif: !currentAktif },
        }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat master data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
          <Database className="w-3.5 h-3.5 text-blue-600" />
          <span>Pengelolaan Data Acuan Sistem (FR-MASTER-01, 02)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Master Data Kategori & Lokasi Kampus
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Sesuai aturan integritas SRS 7.3, data master yang telah digunakan oleh laporan tidak dihapus permanen, melainkan dapat dinonaktifkan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kategori */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Kategori Barang</h3>
          </div>

          <form onSubmit={handleCreateCategory} className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Tambah nama kategori baru..."
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 p-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </form>

          <div className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className={`font-semibold ${cat.aktif ? "text-slate-800" : "text-slate-400 line-through"}`}>
                    {cat.nama}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-2">
                    ({cat._count?.lost_reports || 0} hilang, {cat._count?.found_items || 0} temuan)
                  </span>
                </div>

                <button
                  onClick={() => handleToggleCategory(cat.id, cat.aktif)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    cat.aktif
                      ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                      : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                  }`}
                >
                  {cat.aktif ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lokasi Gedung & Ruang */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-base">Lokasi Gedung & Ruangan</h3>
          </div>

          <form onSubmit={handleCreateLocation} className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Nama Gedung"
                value={newGedung}
                onChange={(e) => setNewGedung(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs"
              />
              <select
                value={newZona}
                onChange={(e) => setNewZona(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs bg-slate-50"
              >
                <option value="Zona Pusat">Zona Pusat</option>
                <option value="Zona Utara">Zona Utara</option>
                <option value="Zona Selatan">Zona Selatan</option>
                <option value="Zona Barat">Zona Barat</option>
                <option value="Zona Timur">Zona Timur</option>
              </select>
              <input
                type="text"
                required
                placeholder="Nama Ruang"
                value={newRuang}
                onChange={(e) => setNewRuang(e.target.value)}
                className="p-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Ruangan Kampus</span>
            </button>
          </form>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {locations.map((loc) => (
              <div key={loc.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className={`font-semibold ${loc.aktif ? "text-slate-800" : "text-slate-400 line-through"}`}>
                    {loc.nama_gedung} • {loc.nama_ruang}
                  </span>
                  <span className="text-[10px] text-slate-400 ml-1.5">
                    [{loc.zona_area}]
                  </span>
                </div>

                <button
                  onClick={() => handleToggleLocation(loc.id, loc.aktif)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    loc.aktif
                      ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                      : "bg-slate-200 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800"
                  }`}
                >
                  {loc.aktif ? "Aktif" : "Nonaktif"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
