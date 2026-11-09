"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import SignaturePad from "@/components/SignaturePad";
import CameraCapture from "@/components/CameraCapture";
import {
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
  UserCheck,
  Lock,
  Camera,
  PenTool,
  ArrowRight,
  AlertCircle,
  FileText,
} from "lucide-react";

function SerahTerimaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [foundItems, setFoundItems] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string>(
    searchParams.get("foundId") || ""
  );
  const [selectedItem, setSelectedItem] = useState<any>(null);

  // Handover form states
  const [namaPenerima, setNamaPenerima] = useState("");
  const [jenisIdentitas, setJenisIdentitas] = useState("KTM");
  const [identitasDicek, setIdentitasDicek] = useState(false);
  const [ciriCocok, setCiriCocok] = useState(false);
  const [catatanVerifikasi, setCatatanVerifikasi] = useState("");

  // Representative (FR-CLAIM-06)
  const [diwakilkan, setDiwakilkan] = useState(false);
  const [namaPerwakilan, setNamaPerwakilan] = useState("");
  const [alasanPerwakilan, setAlasanPerwakilan] = useState("");

  // Proofs (Photo or Signature)
  const [signatureData, setSignatureData] = useState("");
  const [photoProofData, setPhotoProofData] = useState("");

  const [loading, setLoading] = useState(false);
  const [successResult, setSuccessResult] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "resepsionis" && user.role !== "superadmin"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load stored found items
  useEffect(() => {
    fetch("/api/receptionist/found-items?status=Disimpan")
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          setFoundItems(data.items);
          if (selectedItemId) {
            const found = data.items.find((i: any) => String(i.id) === selectedItemId);
            if (found) setSelectedItem(found);
          }
        }
      })
      .catch(console.error);
  }, [selectedItemId]);

  const handleSelectItem = (id: string) => {
    setSelectedItemId(id);
    const item = foundItems.find((i) => String(i.id) === id);
    setSelectedItem(item || null);
  };

  const handleSubmitHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !namaPenerima.trim()) return;

    if (!identitasDicek || !ciriCocok) {
      alert("Harap centang verifikasi fisik kartu identitas dan pencocokan ciri rahasia!");
      return;
    }

    if (!signatureData && !photoProofData) {
      alert("Bukti serah terima wajib disertakan (Tanda tangan digital atau foto serah terima fisik)!");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        found_id: selectedItem.id,
        nama_penerima: namaPenerima.trim(),
        identitas_dicek: identitasDicek,
        jenis_identitas: jenisIdentitas,
        ciri_cocok: ciriCocok,
        catatan_verifikasi: catatanVerifikasi.trim(),
        diwakilkan,
        nama_perwakilan: diwakilkan ? namaPerwakilan.trim() : null,
        alasan_perwakilan: diwakilkan ? alasanPerwakilan.trim() : null,
        bukti_foto: photoProofData || null,
        ttd_digital: signatureData || null,
      };

      const res = await fetch("/api/receptionist/handover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessResult(data);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Gagal memproses serah terima.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>SOP Resmi Serah Terima Barang (UC-03 / BR-06)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verifikasi Identitas & Serah Terima Barang
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Pencatatan serah terima fisik kepada pemilik sah atau perwakilan resmi dengan bukti digital permanen.
        </p>
      </div>

      {successResult ? (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Serah Terima Berhasil Diselesaikan!
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto">
              Barang telah resmi diserahkan. Status barang diubah menjadi <strong>Diserahkan</strong>, pengumuman terkait ditutup dengan status <strong>Selesai</strong>, dan riwayat audit telah dicatat secara permanen.
            </p>
          </div>

          <div className="pt-4 flex justify-center space-x-3">
            <button
              onClick={() => {
                setSuccessResult(null);
                setSelectedItemId("");
                setSelectedItem(null);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
            >
              Proses Serah Terima Lainnya
            </button>
            <button
              onClick={() => router.push("/resepsionis/barang-temuan")}
              className="px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-200"
            >
              Kembali ke Daftar Inventaris
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitHandover} className="space-y-6">
          {/* Step 1: Select Stored Item */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span>Pilih Barang Temuan yang Hendak Diserahkan</span>
            </h3>

            <div className="space-y-2">
              <select
                value={selectedItemId}
                onChange={(e) => handleSelectItem(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-xs font-semibold bg-slate-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Barang Temuan di Meja Resepsionis --</option>
                {foundItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    [{item.kode_barang}] {item.judul_publik} ({item.lokasi_simpan})
                  </option>
                ))}
              </select>
            </div>

            {selectedItem && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-blue-700 text-sm">
                    {selectedItem.kode_barang}
                  </span>
                  <span className="font-semibold text-slate-800">
                    Lokasi Simpan: {selectedItem.lokasi_simpan}
                  </span>
                </div>
                <div className="text-slate-600">{selectedItem.deskripsi}</div>
                {selectedItem.ciri_rahasia && (
                  <div className="p-2 rounded-lg bg-amber-50 text-amber-900 text-[11px] font-medium border border-amber-200">
                    <span className="font-bold">Ciri Rahasia Fisik di Meja: </span>
                    {selectedItem.ciri_rahasia}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Verification Check */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                2
              </span>
              <span>Pemeriksaan Identitas & Validasi Ciri Rahasia (FR-CLAIM-02)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Nama Penerima Barang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap sesuai kartu identitas"
                  value={namaPenerima}
                  onChange={(e) => setNamaPenerima(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">
                  Jenis Kartu Identitas Fisik yang Diperiksa <span className="text-red-500">*</span>
                </label>
                <select
                  value={jenisIdentitas}
                  onChange={(e) => setJenisIdentitas(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option value="KTM">KTM (Kartu Tanda Mahasiswa)</option>
                  <option value="KTP">KTP (Kartu Tanda Penduduk)</option>
                  <option value="SIM">SIM</option>
                  <option value="Kartu Pegawai">Kartu Pegawai / Dosen</option>
                </select>
              </div>
            </div>

            {/* Checkboxes Checklist */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="identitas_dicek"
                  checked={identitasDicek}
                  onChange={(e) => setIdentitasDicek(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded mt-0.5"
                />
                <label htmlFor="identitas_dicek" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Kartu Identitas Fisik ({jenisIdentitas}) telah dicek dan valid sesuai pemilik/perwakilan.
                </label>
              </div>

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="ciri_cocok"
                  checked={ciriCocok}
                  onChange={(e) => setCiriCocok(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                />
                <label htmlFor="ciri_cocok" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Ciri rahasia yang disebutkan penerima COCOK dengan ciri fisik barang temuan di meja.
                </label>
              </div>
            </div>

            {/* Representative Check (FR-CLAIM-06) */}
            <div className="border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="diwakilkan"
                  checked={diwakilkan}
                  onChange={(e) => setDiwakilkan(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="diwakilkan" className="text-xs font-bold text-purple-900 cursor-pointer">
                  Penerima Adalah Perwakilan / Diwakilkan (Bukan Pemilik Asli Langsung)
                </label>
              </div>

              {diwakilkan && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nama Perwakilan:</label>
                    <input
                      type="text"
                      required={diwakilkan}
                      placeholder="Nama orang yang mengambil"
                      value={namaPerwakilan}
                      onChange={(e) => setNamaPerwakilan(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Alasan Perwakilan:</label>
                    <input
                      type="text"
                      required={diwakilkan}
                      placeholder="Misal: Pemilik sedang sakit / surat kuasa"
                      value={alasanPerwakilan}
                      onChange={(e) => setAlasanPerwakilan(e.target.value)}
                      className="w-full p-2 rounded-lg border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Catatan Petugas Resepsionis (Opsional):
              </label>
              <input
                type="text"
                placeholder="Catatan tambahan bila diperlukan..."
                value={catatanVerifikasi}
                onChange={(e) => setCatatanVerifikasi(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Step 3: Proof Collection (Signature or Photo) (FR-CLAIM-03) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">
                3
              </span>
              <span>Bukti Serah Terima Digital (Tanda Tangan atau Foto)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Signature Pad */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <PenTool className="w-4 h-4 text-blue-600" />
                  <span>Tanda Tangan Digital Penerima</span>
                </div>
                <SignaturePad
                  onSave={setSignatureData}
                  onClear={() => setSignatureData("")}
                />
              </div>

              {/* Camera Photo Proof */}
              <div className="space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Atau Foto Fisik Serah Terima</span>
                </div>
                <CameraCapture
                  label="Ambil foto serah terima bersama penerima/KTM"
                  onCapture={setPhotoProofData}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || !selectedItem}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <span>{loading ? "Memproses Serah Terima..." : "Selesaikan Serah Terima"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function SerahTerimaPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <SerahTerimaContent />
    </Suspense>
  );
}
