"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";

export default function NotifikasiPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/civitas/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotifs();
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/civitas/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      if (res.ok) {
        fetchNotifs();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (tipe: string) => {
    switch (tipe) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
      case "match":
        return <Sparkles className="w-5 h-5 text-purple-600 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
        <p className="text-sm text-slate-500">Memuat notifikasi...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifikasi Saya
          </h1>
          <p className="text-xs text-slate-500">
            Pemberitahuan perubahan status laporan, kecocokan barang, dan peringatan batas waktu.
          </p>
        </div>

        {notifications.some((n) => !n.dibaca) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tandai Semua Dibaca</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
          <Bell className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-semibold text-slate-800 text-base">Belum Ada Notifikasi</h3>
          <p className="text-xs text-slate-500">
            Anda akan menerima notifikasi otomatis ketika laporan disetujui atau saat ada barang temuan yang cocok.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start space-x-3.5 ${
                notif.dibaca
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-blue-50/50 border-blue-200 shadow-sm text-slate-900"
              }`}
            >
              <div className="mt-0.5">{getIcon(notif.tipe)}</div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-slate-900">{notif.judul}</h4>
                  <span className="text-[10px] text-slate-400">
                    {new Date(notif.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{notif.isi}</p>
                {notif.tautan && (
                  <div className="pt-1">
                    <Link
                      href={notif.tautan}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-600 hover:underline"
                    >
                      <span>Lihat Rincian</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
