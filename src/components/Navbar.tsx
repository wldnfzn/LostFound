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
  User,
  ExternalLink,
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const isRole = (roles: string[]) => user && roles.includes(user.role);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
                  Lost & Found Kampus
                </span>
                <span className="text-xs text-blue-600 font-medium">
                  Sistem Laporan Kehilangan
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Papan Pengumuman
            </Link>

            <Link
              href="/galeri-temuan"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/galeri-temuan"
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              Galeri Temuan
            </Link>

            {user && (
              <>
                <Link
                  href="/civitas/lapor"
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === "/civitas/lapor"
                      ? "bg-blue-600 text-white"
                      : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Laporan</span>
                </Link>

                <Link
                  href="/civitas/laporan-saya"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname.startsWith("/civitas/laporan-saya")
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  Laporan Saya
                </Link>
              </>
            )}

            {/* Receptionist Menu Items */}
            {isRole(["resepsionis", "superadmin"]) && (
              <div className="relative group">
                <button className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 transition-colors">
                  <LayoutDashboard className="w-4 h-4 text-amber-600" />
                  <span>Resepsionis</span>
                </button>

                <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 hidden group-hover:block transition-all">
                  <Link
                    href="/resepsionis/dashboard"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-blue-600" />
                    <span>Dashboard Utama</span>
                  </Link>
                  <Link
                    href="/resepsionis/verifikasi"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                    <span>Verifikasi Laporan</span>
                  </Link>
                  <Link
                    href="/resepsionis/catat-temuan"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <PlusCircle className="w-4 h-4 text-indigo-600" />
                    <span>Input Barang Temuan</span>
                  </Link>
                  <Link
                    href="/resepsionis/barang-temuan"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Archive className="w-4 h-4 text-purple-600" />
                    <span>Daftar Barang & Label</span>
                  </Link>
                  <Link
                    href="/resepsionis/kandidat-cocok"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Kandidat Kecocokan</span>
                  </Link>
                  <Link
                    href="/resepsionis/serah-terima"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <ClipboardCheck className="w-4 h-4 text-teal-600" />
                    <span>Verifikasi & Serah Terima</span>
                  </Link>
                  <Link
                    href="/resepsionis/laporan"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <FileBarChart className="w-4 h-4 text-cyan-600" />
                    <span>Statistik & Ekspor</span>
                  </Link>
                  <Link
                    href="/resepsionis/master-data"
                    className="flex items-center space-x-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Database className="w-4 h-4 text-slate-500" />
                    <span>Master Data</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Superadmin Menu */}
            {isRole(["superadmin"]) && (
              <Link
                href="/superadmin/pengguna"
                className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-700 bg-rose-50 hover:bg-rose-100"
              >
                <Shield className="w-4 h-4 text-rose-600" />
                <span>Superadmin</span>
              </Link>
            )}
          </nav>

          {/* User Profile / Notifications / Login Action */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <>
                {/* Notifications Bell */}
                <Link
                  href="/civitas/notifikasi"
                  className="relative p-2 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Notifikasi"
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotif > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-600 rounded-full animate-pulse">
                      {unreadNotif > 9 ? "9+" : unreadNotif}
                    </span>
                  )}
                </Link>

                {/* User Dropdown */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      {user.nama}
                    </span>
                    <span className="text-[11px] capitalize text-slate-500">
                      {user.role} {user.prodi_unit ? `• ${user.prodi_unit}` : ""}
                    </span>
                  </div>

                  <button
                    onClick={logout}
                    className="flex items-center space-x-1 p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Keluar (Logout)"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs font-medium">Keluar</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                >
                  Daftar
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Papan Pengumuman
          </Link>
          <Link
            href="/galeri-temuan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
          >
            Galeri Barang Temuan
          </Link>

          {user && (
            <>
              <Link
                href="/civitas/lapor"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 bg-blue-50"
              >
                + Buat Laporan Kehilangan
              </Link>
              <Link
                href="/civitas/laporan-saya"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Laporan Saya
              </Link>
              <Link
                href="/civitas/notifikasi"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>Notifikasi</span>
                {unreadNotif > 0 && (
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {unreadNotif}
                  </span>
                )}
              </Link>
            </>
          )}

          {isRole(["resepsionis", "superadmin"]) && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-xs font-bold text-amber-700 px-3 uppercase tracking-wider">
                Menu Resepsionis
              </span>
              <Link
                href="/resepsionis/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Dashboard Resepsionis
              </Link>
              <Link
                href="/resepsionis/verifikasi"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Verifikasi Laporan
              </Link>
              <Link
                href="/resepsionis/catat-temuan"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Input Barang Temuan
              </Link>
              <Link
                href="/resepsionis/kandidat-cocok"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Kandidat Kecocokan
              </Link>
              <Link
                href="/resepsionis/serah-terima"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Verifikasi & Serah Terima
              </Link>
              <Link
                href="/resepsionis/laporan"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
              >
                Statistik & Laporan
              </Link>
            </div>
          )}

          {isRole(["superadmin"]) && (
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/superadmin/pengguna"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 bg-rose-50"
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
