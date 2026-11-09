"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Shield, FileText, Search, Filter, Lock } from "lucide-react";

export default function AuditLogPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState("all");

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "superadmin" && user.role !== "resepsionis"))) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/audit-logs?aksi=${selectedAction}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchLogs();
  }, [user, selectedAction]);

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat log audit sistem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-900 text-white">
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span>Keterlacakan Permanen (FR-AUDIT-02, NFR-LOG-01)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Log Audit Aktivitas Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Seluruh aksi penting (login, persetujuan, input temuan, klaim, serah terima) dicatat secara kekal dan tidak dapat diubah/dihapus lewat UI aplikasi.
          </p>
        </div>

        {user?.role === "superadmin" && (
          <div className="flex items-center space-x-2">
            <Link
              href="/superadmin/pengguna"
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
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
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
            >
              Audit Log
            </Link>
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-semibold text-slate-700">Filter Aksi:</span>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50"
          >
            <option value="all">Semua Aksi</option>
            <option value="LOGIN_SUCCESS">Login Sukses</option>
            <option value="LOGIN_FAILED">Login Gagal</option>
            <option value="CREATE_LOST_REPORT">Buat Laporan Kehilangan</option>
            <option value="APPROVE_LOST_REPORT">Setujui Laporan</option>
            <option value="REJECT_LOST_REPORT">Tolak Laporan</option>
            <option value="CREATE_FOUND_ITEM">Catat Barang Temuan</option>
            <option value="ACCEPT_MATCH_CANDIDATE">Terima Kandidat Cocok</option>
            <option value="COMPLETE_HANDOVER">Serah Terima Selesai</option>
            <option value="CRON_DAILY_RUN">Eksekusi Cron Harian</option>
          </select>
        </div>

        <span className="text-xs text-slate-400">
          Total catatan: <strong>{logs.length}</strong>
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Waktu (WIB)</th>
                <th className="py-3.5 px-4">Pengguna</th>
                <th className="py-3.5 px-4">Aksi</th>
                <th className="py-3.5 px-4">Entitas Terkait</th>
                <th className="py-3.5 px-4">Detail Data (JSON)</th>
                <th className="py-3.5 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("id-ID")}
                  </td>

                  <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                    {log.user ? `${log.user.nama} (${log.user.role})` : "Sistem Otomatis"}
                  </td>

                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {log.aksi}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-600">
                    {log.entitas} {log.entitas_id ? `#${log.entitas_id}` : ""}
                  </td>

                  <td className="py-3 px-4 max-w-xs truncate text-[11px] text-slate-500" title={log.detail}>
                    {log.detail || "-"}
                  </td>

                  <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                    {log.ip || "127.0.0.1"}
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
