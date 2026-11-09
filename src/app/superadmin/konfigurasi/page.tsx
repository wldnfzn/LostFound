"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Settings, Shield, Save, Check } from "lucide-react";

export default function KonfigurasiSistemPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "superadmin")) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "superadmin") fetchSettings();
  }, [user]);

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      const res = await fetch("/api/superadmin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (res.ok) {
        fetchSettings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-rose-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat konfigurasi sistem...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Nav Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <Shield className="w-3.5 h-3.5 text-rose-600" />
            <span>Parameter Bisnis (NFR-MAINT-02)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Konfigurasi & Parameter Sistem
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ubah parameter operasional kampus tanpa perlu mengubah kode sumber aplikasi.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/superadmin/pengguna"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Pengguna
          </Link>
          <Link
            href="/superadmin/konfigurasi"
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
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

      {/* Settings Form Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="divide-y divide-slate-100">
          {settings.map((s) => (
            <div key={s.key} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-0.5 max-w-lg">
                <span className="font-mono text-xs font-bold text-slate-800 block">
                  {s.key}
                </span>
                <p className="text-xs text-slate-500">{s.deskripsi}</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  defaultValue={s.value}
                  id={`input-${s.key}`}
                  className="w-24 p-2 rounded-xl border border-slate-200 text-xs font-bold text-center focus:ring-2 focus:ring-rose-500"
                />
                <button
                  onClick={() => {
                    const el = document.getElementById(`input-${s.key}`) as HTMLInputElement;
                    if (el) handleUpdate(s.key, el.value);
                  }}
                  disabled={savingKey === s.key}
                  className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingKey === s.key ? "Menyimpan..." : "Simpan"}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
