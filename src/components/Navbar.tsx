"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  Menu,
  X,
  Search,
  PlusCircle,
  Archive,
  LayoutDashboard,
  CheckSquare,
  Sparkles,
  ClipboardCheck,
  FileBarChart,
  Database,
  Shield,
  LogOut,
  ChevronDown,
  PackageOpen,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [receptionistDropdownOpen, setReceptionistDropdownOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);

  useEffect(() => {
    if (user) {
      fetch("/api/civitas/notifications")
        .then((res) => res.json())
        .then((data) => {
          if (data.unreadCount !== undefined) {
            setUnreadNotif(data.unreadCount);
          }
        })
        .catch(() => {});
    }
  }, [user, pathname]);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setReceptionistDropdownOpen(false);
  }, [pathname]);

  const isRole = (roles: string[]) => user && roles.includes(user.role);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo Branding */}
          <Link href="/" className="flex items-center space-x-3 group py-1">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-blue-700 flex items-center justify-center text-white shadow-sm shadow-blue-700/30 group-hover:bg-blue-800 transition-all flex-shrink-0">
              <Search className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight group-hover:text-blue-700 transition-colors">
                  Lost & Found Kampus
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                  Resmi
                </span>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                Sistem Terpadu Pelaporan & Penitipan Barang
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-700 hover:text-blue-700 hover:bg-slate-100"
              }`}
            >
              Papan Pengumuman
            </Link>

            <Link
              href="/galeri-temuan"
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === "/galeri-temuan"
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                  : "text-slate-700 hover:text-blue-700 hover:bg-slate-100"
              }`}
            >
              <PackageOpen className="w-4 h-4" />
              <span>Galeri Temuan</span>
            </Link>

            {user && (
              <>
                <Link
                  href="/civitas/lapor"
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname === "/civitas/lapor"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Lapor Hilang</span>
                </Link>

                <Link
                  href="/civitas/laporan-saya"
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    pathname.startsWith("/civitas/laporan-saya")
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-700 hover:text-blue-700 hover:bg-slate-100"
                  }`}
                >
                  Laporan Saya
                </Link>
              </>
            )}

            {/* Receptionist Menu Dropdown */}
            {isRole(["resepsionis", "superadmin"]) && (
              <div className="relative">
                <button
                  onClick={() => setReceptionistDropdownOpen(!receptionistDropdownOpen)}
                  onBlur={() => setTimeout(() => setReceptionistDropdownOpen(false), 200)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                    pathname.startsWith("/resepsionis")
                      ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                      : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <span>Panel Resepsionis</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${receptionistDropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {receptionistDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-1.5 mb-1 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Layanan Resepsionis
                    </div>
                    <Link
                      href="/resepsionis/dashboard"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <LayoutDashboard className="w-4 h-4 text-blue-600" />
                      <span>Dashboard Utama</span>
                    </Link>
                    <Link
                      href="/resepsionis/verifikasi"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      <span>Verifikasi Laporan Masuk</span>
                    </Link>
                    <Link
                      href="/resepsionis/catat-temuan"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <PlusCircle className="w-4 h-4 text-indigo-600" />
                      <span>Input Barang Temuan (Webcam)</span>
                    </Link>
                    <Link
                      href="/resepsionis/barang-temuan"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Archive className="w-4 h-4 text-purple-600" />
                      <span>Inventaris Titipan & Label QR</span>
                    </Link>
                    <Link
                      href="/resepsionis/kandidat-cocok"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Kandidat Kecocokan Skor</span>
                    </Link>
                    <Link
                      href="/resepsionis/serah-terima"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <ClipboardCheck className="w-4 h-4 text-teal-600" />
                      <span>Verifikasi & Serah Terima Fisik</span>
                    </Link>
                    <Link
                      href="/resepsionis/laporan"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <FileBarChart className="w-4 h-4 text-cyan-600" />
                      <span>Statistik & Ekspor (Excel/PDF)</span>
                    </Link>
                    <Link
                      href="/resepsionis/master-data"
                      className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Database className="w-4 h-4 text-slate-500" />
                      <span>Master Data Gedung & Kategori</span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Superadmin Menu */}
            {isRole(["superadmin"]) && (
              <Link
                href="/superadmin/pengguna"
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                  pathname.startsWith("/superadmin")
                    ? "bg-rose-600 text-white border-rose-700 shadow-sm"
                    : "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                }`}
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Superadmin</span>
              </Link>
            )}
          </nav>

          {/* Right Area (Profile / Notifications / Login) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <div className="flex items-center space-x-2 sm:space-x-3">
                {/* Notification Bell */}
                <Link
                  href="/civitas/notifikasi"
                  className="relative p-2.5 rounded-xl text-slate-700 hover:text-blue-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                  title="Notifikasi Masuk"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotif > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1 text-[11px] font-extrabold text-white bg-red-600 rounded-full border-2 border-white shadow-xs">
                      {unreadNotif > 9 ? "9+" : unreadNotif}
                    </span>
                  )}
                </Link>

                {/* User Info Capsule */}
                <div className="hidden sm:flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-slate-900 leading-tight">
                      {user.nama}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 capitalize">
                      {user.role} {user.prodi_unit ? `• ${user.prodi_unit}` : ""}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="p-2 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-all"
                    title="Keluar (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-blue-700 hover:bg-slate-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-600/25 transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label="Buka Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-8 space-y-3 shadow-lg">
          {user && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">{user.nama}</div>
                <div className="text-xs text-slate-500 capitalize">{user.role} {user.prodi_unit ? `(${user.prodi_unit})` : ""}</div>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg"
              >
                Keluar
              </button>
            </div>
          )}

          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Papan Pengumuman
            </Link>

            <Link
              href="/galeri-temuan"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
            >
              Galeri Barang Temuan
            </Link>

            {user && (
              <>
                <Link
                  href="/civitas/lapor"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 shadow-sm"
                >
                  + Buat Laporan Kehilangan
                </Link>

                <Link
                  href="/civitas/laporan-saya"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  Laporan Kehilangan Saya
                </Link>

                <Link
                  href="/civitas/notifikasi"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-800 hover:bg-slate-100"
                >
                  <span>Notifikasi</span>
                  {unreadNotif > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                      {unreadNotif}
                    </span>
                  )}
                </Link>
              </>
            )}
          </div>

          {isRole(["resepsionis", "superadmin"]) && (
            <div className="pt-3 border-t border-slate-200 space-y-1">
              <span className="px-3 text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Menu Resepsionis
              </span>
              <Link
                href="/resepsionis/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Dashboard Resepsionis
              </Link>
              <Link
                href="/resepsionis/verifikasi"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Verifikasi Laporan
              </Link>
              <Link
                href="/resepsionis/catat-temuan"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Input Barang Temuan
              </Link>
              <Link
                href="/resepsionis/barang-temuan"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Daftar Inventaris & Label QR
              </Link>
              <Link
                href="/resepsionis/kandidat-cocok"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Kandidat Kecocokan
              </Link>
              <Link
                href="/resepsionis/serah-terima"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Verifikasi & Serah Terima
              </Link>
              <Link
                href="/resepsionis/laporan"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-700 hover:bg-amber-50"
              >
                Laporan Statistik
              </Link>
            </div>
          )}

          {isRole(["superadmin"]) && (
            <div className="pt-3 border-t border-slate-200">
              <Link
                href="/superadmin/pengguna"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3.5 py-2.5 rounded-xl text-sm font-bold text-rose-800 bg-rose-50 border border-rose-200"
              >
                Panel Superadmin
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
