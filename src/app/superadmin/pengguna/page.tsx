"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, Settings, FileText, UserPlus, Check, X } from "lucide-react";

export default function SuperadminUsersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "superadmin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "superadmin") fetchUsers();
  }, [user]);

  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          userId,
          role: newRole,
        }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_status",
          userId,
          status_aktif: !currentStatus,
        }),
      });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Superadmin Top Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Panel Khusus Superadmin</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Manajemen Pengguna & Peran
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/superadmin/pengguna"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
          >
            Pengguna
          </Link>
          <Link
            href="/superadmin/konfigurasi"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Konfigurasi Sistem
          </Link>
          <Link
            href="/superadmin/audit-log"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Audit Log
          </Link>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Lengkap & Email</th>
                <th className="py-3.5 px-4">NIM / NIP & Prodi</th>
                <th className="py-3.5 px-4">Peran (Role)</th>
                <th className="py-3.5 px-4">Status Akun</th>
                <th className="py-3.5 px-4 text-right">Ubah Peran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="font-semibold text-slate-900">{u.nama}</div>
                    <div className="text-slate-500">{u.email_kampus}</div>
                  </td>

                  <td className="py-3.5 px-4 space-y-0.5">
                    <div className="font-mono text-slate-800">{u.nim_nip}</div>
                    <div className="text-slate-400">{u.prodi_unit || "-"}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === "superadmin"
                          ? "bg-rose-100 text-rose-800"
                          : u.role === "resepsionis"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <button
                      onClick={() => handleToggleStatus(u.id, u.status_aktif)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        u.status_aktif
                          ? "bg-emerald-100 text-emerald-800 hover:bg-red-100 hover:text-red-800"
                          : "bg-red-100 text-red-800 hover:bg-emerald-100 hover:text-emerald-800"
                      }`}
                    >
                      {u.status_aktif ? "Aktif" : "Dinonaktifkan"}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <select
                      value={u.role}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs bg-slate-50 font-semibold"
                    >
                      <option value="civitas">Civitas</option>
                      <option value="resepsionis">Resepsionis</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
