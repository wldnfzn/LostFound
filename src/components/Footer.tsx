import React from "react";
import Link from "next/link";
import { ShieldCheck, Heart, MapPin, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                L&F
              </div>
              <span className="font-bold text-white text-lg tracking-tight">
                Sistem Laporan Kehilangan Kampus
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-md leading-relaxed">
              Platform resmi pelaporan kehilangan dan penitipan barang temuan civitas kampus. Menghubungkan pelapor dan penemu secara terstruktur, aman, dan terpercaya di meja resepsionis kampus.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Sesuai UU Pelindungan Data Pribadi (UU PDP No. 27/2022)</span>
            </div>
          </div>

          {/* Navigasi Cepat */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Papan Pengumuman
                </Link>
              </li>
              <li>
                <Link href="/galeri-temuan" className="hover:text-white transition-colors">
                  Galeri Barang Temuan
                </Link>
              </li>
              <li>
                <Link href="/civitas/lapor" className="hover:text-white transition-colors">
                  Buat Laporan Kehilangan
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Masuk Akun Civitas
                </Link>
              </li>
            </ul>
          </div>

          {/* Meja Bantuan Resepsionis */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Pusat Penitipan & Serah Terima
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>Meja Resepsionis Lobi Utama Gedung Rektorat (Senin – Jumat, 08.00 – 16.00 WIB)</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>resepsionis@kampus.ac.id</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-blue-400 flex-shrink-0" />
                <span>(021) 555-KAMPUS ext. 101</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 Sistem Laporan Kehilangan Kampus. Hak cipta dilindungi.</p>
          <p className="mt-2 sm:mt-0 flex items-center space-x-1">
            <span>Dikelola oleh Bagian Umum & Biro Sistem Informasi Kampus</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
