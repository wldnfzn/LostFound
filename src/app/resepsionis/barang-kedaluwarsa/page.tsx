"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Clock, ShieldAlert, ArrowRight, CheckCircle, PackageX } from "lucide-react";

export default function BarangKedaluwarsaPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Disposition modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [tindakLanjut, setTindakLanjut] = useState("DiserahkanBagianUmum");
  const [catatan, setCatatan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchExpiredItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/receptionist/expired");
      if (res.ok) {
        const data = await res.json();
        setItems(data.expiredItems || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchExpiredItems();
  }, [user]);

  const handleOpenModal = (item: any) => {
    setSelectedItem(item);
    setTindakLanjut("DiserahkanBagianUmum");
    setCatatan("");
    setModalOpen(true);
  };

  const handleConfirmDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/receptionist/expired", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItem.id,
          tindakLanjut,
          catatan,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setModalOpen(false);
        fetchExpiredItems();
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal memproses tindak lanjut.");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memeriksa barang temuan kedaluwarsa...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800">
          <Clock className="w-3.5 h-3.5 text-red-600" />
          <span>SOP Barang Melewati Masa Simpan (BR-04, BR-09, FR-DASH-02)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Penanganan Barang Temuan Tidak Diklaim
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Barang yang telah melewati batas simpan 60 hari wajib ditindaklanjuti sesuai kebijakan kampus (diserahkan ke Bagian Umum, dihibahkan, atau dimusnahkan).
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-lg">
            Tidak Ada Barang Kedaluwarsa
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Semua barang temuan yang tersimpan saat ini masih berada dalam batas masa simpan yang berlaku.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Kode & Judul Barang</th>
                <th className="py-3.5 px-4">Kategori & Lokasi Simpan</th>
                <th className="py-3.5 px-4">Batas Simpan Terlampaui</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 space-y-0.5">
                    <span className="font-mono font-bold text-red-600 block">
                      {item.kode_barang}
                    </span>
                    <span className="font-semibold text-slate-900">{item.judul_publik}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div>{item.category?.nama}</div>
                    <div className="text-slate-400">{item.lokasi_simpan}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-red-600">
                    {new Date(item.batas_simpan).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors"
                    >
                      Proses Tindak Lanjut
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Disposition Modal */}
      {modalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Tindak Lanjut: {selectedItem.kode_barang}
            </h3>
            <p className="text-xs text-slate-500">
              Pilih tindakan resmi kampus untuk barang temuan yang tidak diklaim ini.
            </p>

            <form onSubmit={handleConfirmDisposition} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tindakan Resmi:</label>
                <select
                  value={tindakLanjut}
                  onChange={(e) => setTindakLanjut(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50"
                >
                  <option value="DiserahkanBagianUmum">
                    Diserahkan ke Bagian Umum Kampus
                  </option>
                  <option value="Dihibahkan">Dihibahkan untuk Sosial / BEM</option>
                  <option value="Dimusnahkan">
                    Dimusnahkan (Sesuai Aturan untuk Dokumen / Makanan)
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Catatan Berita Acara:</label>
                <textarea
                  rows={3}
                  placeholder="Nomor surat berita acara penyerahan atau catatan pemusnahan..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
              </div>

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
                  className="px-4 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-xl hover:bg-red-700"
                >
                  {submitting ? "Menyimpan..." : "Simpan Berita Acara"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
