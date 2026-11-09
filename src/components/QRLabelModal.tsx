"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Printer, X, Tag } from "lucide-react";

interface QRLabelModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    kode_barang: string;
    judul_publik: string;
    category?: { nama: string };
    location?: { nama_gedung: string; nama_ruang: string };
    lokasi_simpan?: string;
    tanggal_temuan?: string | Date;
    bernilai_tinggi?: boolean;
  } | null;
}

export default function QRLabelModal({ isOpen, onClose, item }: QRLabelModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    if (item?.kode_barang) {
      QRCode.toDataURL(item.kode_barang, {
        width: 180,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      })
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800">Label Barang Temuan & QR</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Label Area */}
        <div className="p-6">
          <div
            id="printable-label"
            className="border-2 border-dashed border-slate-300 p-5 rounded-xl bg-slate-50/50 flex flex-col items-center text-center space-y-3"
          >
            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              L&F KAMPUS • RESEPSIONIS
            </div>

            {qrDataUrl && (
              <img
                src={qrDataUrl}
                alt={`QR ${item.kode_barang}`}
                className="w-36 h-36 bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
              />
            )}

            <div>
              <div className="text-xl font-mono font-extrabold text-blue-700 tracking-wider">
                {item.kode_barang}
              </div>
              <div className="font-semibold text-slate-900 text-sm mt-0.5">
                {item.judul_publik}
              </div>
            </div>

            <div className="w-full text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200 text-left">
              <div className="flex justify-between">
                <span className="text-slate-400">Kategori:</span>
                <span className="font-medium text-slate-700">
                  {item.category?.nama || "-"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lokasi Simpan:</span>
                <span className="font-semibold text-slate-900">
                  {item.lokasi_simpan || "Meja Resepsionis"}
                </span>
              </div>
              {item.bernilai_tinggi && (
                <div className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-center text-[10px] uppercase">
                  ⚠️ BARANG BERNILAI TINGGI • SIMPAN TERKUNCI
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Label (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
