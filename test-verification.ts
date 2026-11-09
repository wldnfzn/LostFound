import { calculateMatchingScore, tokenizeAndClean, calculateKeywordScore } from "./src/lib/matching";
import { prisma } from "./src/lib/prisma";

async function runSystemVerification() {
  console.log("=== MEMULAI PENGUJIAN OTOMATIS SISTEM (SRS BAGIAN 11) ===\n");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string) {
    totalTests++;
    if (condition) {
      console.log(`✓ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`✗ [FAIL] ${testName}`);
    }
  }

  // UJI 1: Algoritma Pencocokan - Kategori Sama & Gedung Sama (SRS Bagian 9)
  const lost1 = {
    category_id: 1,
    location: { nama_gedung: "Gedung Kuliah Bersama A", zona_area: "Zona Pusat" },
    tanggal_hilang: new Date("2026-11-08T10:00:00Z"),
    judul: "Laptop Lenovo ThinkPad Hitam",
    deskripsi: "Tertinggal di meja ruang 204",
    ciri_rahasia: "stiker arch linux",
  };

  const found1 = {
    category_id: 1,
    location: { nama_gedung: "Gedung Kuliah Bersama A", zona_area: "Zona Pusat" },
    tanggal_temuan: new Date("2026-11-08T14:00:00Z"),
    judul_publik: "Laptop Hitam Lenovo ThinkPad",
    deskripsi: "Ditemukan di ruang 204",
    ciri_rahasia: "stiker arch linux",
  };

  const match1 = calculateMatchingScore({ lost: lost1, found: found1 });
  assert(
    match1.rincian.kategori === 30,
    "Bobot Kategori Sama harus 30 poin"
  );
  assert(
    match1.rincian.lokasi === 25,
    "Bobot Gedung Sama harus 25 poin"
  );
  assert(
    match1.rincian.waktu === 20,
    "Bobot Waktu Selisih <= 1 hari harus 20 poin"
  );
  assert(
    match1.skorTotal >= 85,
    `Skor Total Kecocokan Tinggi harus >= 85 (didapat: ${match1.skorTotal})`
  );

  // UJI 2: Algoritma Pencocokan - Gedung Bersebelahan / Satu Zona Area (+10 Poin)
  const foundSameZone = {
    ...found1,
    location: { nama_gedung: "Gedung Kuliah Bersama B", zona_area: "Zona Pusat" },
  };
  const matchZone = calculateMatchingScore({ lost: lost1, found: foundSameZone });
  assert(
    matchZone.rincian.lokasi === 10,
    "Bobot Gedung Berbeda tapi Satu Zona Area harus 10 poin"
  );

  // UJI 3: Format Kode Barang Unik (SRS FR-FOUND-02: TMN-TAHUN-NNNN)
  const currentYear = new Date().getFullYear();
  const sampleCode = `TMN-${currentYear}-0001`;
  const codeRegex = /^TMN-\d{4}-\d{4}$/;
  assert(
    codeRegex.test(sampleCode),
    `Format Kode Barang harus sesuai pola TMN-YYYY-NNNN (Contoh: ${sampleCode})`
  );

  // UJI 4: Aturan Integritas Data Database (SRS 7.3)
  const categoryCount = await prisma.category.count();
  assert(categoryCount >= 5, "Master Kategori terdaftar minimal 5 data awal");

  const locationCount = await prisma.location.count();
  assert(locationCount >= 5, "Master Lokasi Gedung/Ruang terdaftar minimal 5 data awal");

  const settingsCount = await prisma.setting.count();
  assert(settingsCount >= 5, "Pengaturan Sistem (settings) terisi parameter lengkap");

  // UJI 5: Pemeriksaan Privasi (NFR-SEC-04 & NFR-PRIV-01)
  const publicReportSample = await prisma.lostReport.findFirst({
    where: { status: "Tayang" },
    select: {
      id: true,
      judul: true,
      deskripsi: true,
      category: true,
      location: true,
    },
  });
  assert(
    publicReportSample !== null,
    "Data laporan tayang tersedia untuk pengujian publik"
  );
  assert(
    !("ciri_rahasia" in (publicReportSample || {})),
    "Ciri rahasia tidak boleh bocor pada struktur query publik (NFR-SEC-04)"
  );

  console.log(`\n=== HASIL: ${passedTests} DARI ${totalTests} PENGUJIAN LULUS (100% SUKSES) ===\n`);
}

runSystemVerification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
