import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Settings
  const settingsData = [
    { key: "masa_simpan_hari", value: "60", deskripsi: "Masa simpan default barang temuan di resepsionis (hari)" },
    { key: "pengingat_sebelum_hari", value: "7", deskripsi: "Pengingat otomatis sebelum barang kedaluwarsa (hari)" },
    { key: "masa_tayang_hari", value: "30", deskripsi: "Masa tayang pengumuman kehilangan sebelum kedaluwarsa (hari)" },
    { key: "maks_perpanjangan", value: "2", deskripsi: "Batas maksimal perpanjangan masa tayang per laporan" },
    { key: "batas_laporan_harian", value: "5", deskripsi: "Maksimal laporan yang bisa dibuat civitas per hari" },
    { key: "ambang_skor_kandidat", value: "60", deskripsi: "Skor minimal untuk dinyatakan sebagai kandidat kecocokan" },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: { value: s.value, deskripsi: s.deskripsi },
      create: s,
    });
  }

  // 2. Categories
  const categoriesData = [
    "Elektronik & Gadget",
    "Dompet & Tas",
    "Dokumen & Identitas",
    "Kunci & Gantungan",
    "Pakaian & Aksesoris",
    "Buku & Alat Tulis",
    "Lain-lain",
  ];

  const categories = [];
  for (const catName of categoriesData) {
    const c = await prisma.category.upsert({
      where: { nama: catName },
      update: { aktif: true },
      create: { nama: catName, aktif: true },
    });
    categories.push(c);
  }

  // 3. Locations
  const locationsData = [
    { nama_gedung: "Gedung Kuliah Bersama A", zona_area: "Zona Pusat", nama_ruang: "Ruang 204" },
    { nama_gedung: "Gedung Kuliah Bersama A", zona_area: "Zona Pusat", nama_ruang: "Toilet Lantai 1" },
    { nama_gedung: "Gedung Fakultas Ilmu Komputer", zona_area: "Zona Utara", nama_ruang: "Lab Komputer 2" },
    { nama_gedung: "Gedung Fakultas Ilmu Komputer", zona_area: "Zona Utara", nama_ruang: "Selasar Lantai 1" },
    { nama_gedung: "Perpustakaan Pusat", zona_area: "Zona Pusat", nama_ruang: "Area Baca Lantai 1" },
    { nama_gedung: "Perpustakaan Pusat", zona_area: "Zona Pusat", nama_ruang: "Loker Penitipan" },
    { nama_gedung: "Kantin Utama", zona_area: "Zona Barat", nama_ruang: "Meja 12" },
    { nama_gedung: "Masjid Kampus", zona_area: "Zona Timur", nama_ruang: "Area Wudhu Pria" },
    { nama_gedung: "Gelanggang Olahraga", zona_area: "Zona Selatan", nama_ruang: "Tribun Barat" },
  ];

  const locations = [];
  for (const loc of locationsData) {
    const l = await prisma.location.create({
      data: {
        nama_gedung: loc.nama_gedung,
        zona_area: loc.zona_area,
        nama_ruang: loc.nama_ruang,
        aktif: true,
      },
    });
    locations.push(l);
  }

  // 4. Users
  const passwordHash = await bcrypt.hash("password123", 10);

  const superadmin = await prisma.user.upsert({
    where: { email_kampus: "superadmin@kampus.ac.id" },
    update: {},
    create: {
      nama: "Super Administrator",
      email_kampus: "superadmin@kampus.ac.id",
      nim_nip: "198001012005011001",
      no_hp: "081234567890",
      password_hash: passwordHash,
      role: "superadmin",
      prodi_unit: "Biro Sistem Informasi & Tata Kelola",
      status_aktif: true,
      email_verified_at: new Date(),
    },
  });

  const resepsionis = await prisma.user.upsert({
    where: { email_kampus: "resepsionis@kampus.ac.id" },
    update: {},
    create: {
      nama: "Siti Rahma (Resepsionis)",
      email_kampus: "resepsionis@kampus.ac.id",
      nim_nip: "198802022010012002",
      no_hp: "081234567891",
      password_hash: passwordHash,
      role: "resepsionis",
      prodi_unit: "Bagian Umum & Layanan Terpadu",
      status_aktif: true,
      email_verified_at: new Date(),
    },
  });

  const mhs1 = await prisma.user.upsert({
    where: { email_kampus: "ahmad.fauzi@mhs.kampus.ac.id" },
    update: {},
    create: {
      nama: "Ahmad Fauzi",
      email_kampus: "ahmad.fauzi@mhs.kampus.ac.id",
      nim_nip: "220101001",
      no_hp: "081298765432",
      password_hash: passwordHash,
      role: "civitas",
      prodi_unit: "Teknik Informatika",
      status_aktif: true,
      email_verified_at: new Date(),
    },
  });

  const dosen1 = await prisma.user.upsert({
    where: { email_kampus: "budi.santoso@dosen.kampus.ac.id" },
    update: {},
    create: {
      nama: "Dr. Budi Santoso, M.Kom",
      email_kampus: "budi.santoso@dosen.kampus.ac.id",
      nim_nip: "197505152000121001",
      no_hp: "081211223344",
      password_hash: passwordHash,
      role: "civitas",
      prodi_unit: "Sistem Informasi",
      status_aktif: true,
      email_verified_at: new Date(),
    },
  });

  // 5. Sample Lost Reports
  const now = new Date();
  const expireDate = new Date();
  expireDate.setDate(now.getDate() + 30);

  const lostReport1 = await prisma.lostReport.create({
    data: {
      user_id: mhs1.id,
      category_id: categories[0].id, // Elektronik
      location_id: locations[2].id, // Lab Komputer 2 Fasilkom
      judul: "Laptop Lenovo ThinkPad T480 Warna Hitam",
      deskripsi: "Tertinggal setelah praktikum Pemrograman Web. Body hitam, ada stiker GitHub dan Arch Linux di cover depan.",
      ciri_rahasia: "Ada goresan kecil di dekat trackpoint merah dan nomor seri berakhiran 8892.",
      tanggal_hilang: new Date(Date.now() - 24 * 60 * 60 * 1000), // Kemarin
      status: "Tayang",
      expired_at: expireDate,
    },
  });

  const lostReport2 = await prisma.lostReport.create({
    data: {
      user_id: dosen1.id,
      category_id: categories[1].id, // Dompet
      location_id: locations[4].id, // Perpustakaan Lantai 1
      judul: "Dompet Kulit Coklat Merk Braun Buffel",
      deskripsi: "Tertinggal di meja baca lantai 1 dekat jendela utara.",
      ciri_rahasia: "Berisi KTP atas nama Budi Santoso dan foto keluarga di slip dalam.",
      tanggal_hilang: new Date(Date.now() - 48 * 60 * 60 * 1000), // 2 hari lalu
      status: "MenungguVerifikasi",
      expired_at: expireDate,
    },
  });

  // 6. Sample Found Item
  const foundItem1 = await prisma.foundItem.create({
    data: {
      kode_barang: "TMN-2026-0001",
      category_id: categories[0].id,
      location_id: locations[2].id, // Lab Komputer 2 Fasilkom
      judul_publik: "Laptop Hitam Lenovo ThinkPad",
      deskripsi: "Ditemukan di meja praktikum Lab Komputer 2 baris ke-3.",
      ciri_rahasia: "Ada stiker Arch Linux & nomor seri belakang T480-8892.",
      tanggal_temuan: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 jam lalu
      nama_penemu: "Pak Agus (Petugas Lab)",
      lokasi_simpan: "Brankas Resepsionis Gedung Fasilkom (Loker A-1)",
      bernilai_tinggi: true,
      dicatat_oleh: resepsionis.id,
      batas_simpan: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      status: "Disimpan",
    },
  });

  // 7. Initial Match calculation
  await prisma.match.create({
    data: {
      lost_id: lostReport1.id,
      found_id: foundItem1.id,
      skor: 92.5,
      rincian_skor: JSON.stringify({
        kategori: 30,
        lokasi: 25,
        waktu: 20,
        kata_kunci: 17.5,
      }),
      status: "kandidat",
    },
  });

  // 8. Audit Log
  await prisma.auditLog.create({
    data: {
      user_id: resepsionis.id,
      aksi: "INIT_SEED",
      entitas: "system",
      detail: JSON.stringify({ message: "Initial database seeded successfully" }),
      ip: "127.0.0.1",
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
