"use client";

import React, { useRef, useState } from "react";
import { Camera, RefreshCw, Check, Upload, X } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (dataUrl: string) => void;
  label?: string;
}

export default function CameraCapture({ onCapture, label = "Ambil Foto atau Unggah" }: CameraCaptureProps) {
  const [streamActive, setStreamActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStreamActive(true);
      }
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Tidak dapat mengakses kamera perangkat. Silakan gunakan tombol unggah berkas.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    setPreview(dataUrl);
    stopCamera();
    onCapture(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran berkas maksimal 5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreview(result);
      onCapture(result);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreview(null);
    stopCamera();
    onCapture("");
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-sm">
          <img src={preview} alt="Pratinjau Foto" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={clearPhoto}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-900/70 text-white hover:bg-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : streamActive ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-black max-w-sm">
          <video ref={videoRef} className="w-full h-48 object-cover" autoPlay playsInline />
          <div className="absolute bottom-2 inset-x-0 flex justify-center space-x-2">
            <button
              type="button"
              onClick={capturePhoto}
              className="flex items-center space-x-1 px-4 py-1.5 rounded-full bg-blue-600 text-white font-medium text-xs shadow-lg hover:bg-blue-700"
            >
              <Camera className="w-4 h-4" />
              <span>Ambil Jepretan</span>
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="px-3 py-1.5 rounded-full bg-slate-800 text-slate-200 text-xs hover:bg-slate-700"
            >
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={startCamera}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span>Kamera Webcam / HP</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1.5 px-3.5 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Pilih Berkas</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>
      )}
    </div>
  );
}
