import { prisma } from "./prisma";

// Indonesian stopwords to filter out common noise words
const STOPWORDS = new Set([
  "dan", "di", "ke", "dari", "yang", "pada", "untuk", "dengan", "adalah", "ini", "itu",
  "atau", "ada", "saya", "kami", "milik", "berisi", "warna", "merk", "tertinggal", "hilang",
  "ditemukan", "di", "atas", "bawah", "ruang", "gedung", "meja", "lantai", "area"
]);

export function tokenizeAndClean(text: string): Set<string> {
  if (!text) return new Set();
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2 && !STOPWORDS.has(w));
  return new Set(cleaned);
}

export function calculateKeywordScore(textLost: string, textFound: string): number {
  const setA = tokenizeAndClean(textLost);
  const setB = tokenizeAndClean(textFound);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }

  // Jaccard similarity scaled to 25 points
  const unionSize = new Set([...setA, ...setB]).size;
  const ratio = unionSize > 0 ? intersectionCount / unionSize : 0;
  
  // Also reward direct overlap
  const overlapRatio = intersectionCount / Math.min(setA.size, setB.size);
  const blendedRatio = (ratio * 0.4) + (overlapRatio * 0.6);

  return Math.min(25, Math.round(blendedRatio * 25));
}

export function calculateMatchingScore({
  lost,
  found,
}: {
  lost: {
    category_id: number;
    location: { nama_gedung: string; zona_area?: string | null };
    tanggal_hilang: Date;
    judul: string;
    deskripsi: string;
    ciri_rahasia?: string;
  };
  found: {
    category_id: number;
    location: { nama_gedung: string; zona_area?: string | null };
    tanggal_temuan: Date;
    judul_publik: string;
    deskripsi: string;
    ciri_rahasia?: string | null;
  };
}): {
  skorTotal: number;
  rincian: {
    kategori: number;
    lokasi: number;
    waktu: number;
    kata_kunci: number;
  };
} {
  // 1. Kategori (Bobot 30)
  let skorKategori = 0;
  if (lost.category_id === found.category_id) {
    skorKategori = 30;
  }

  // 2. Lokasi (Bobot 25)
  let skorLokasi = 0;
  if (lost.location.nama_gedung.toLowerCase().trim() === found.location.nama_gedung.toLowerCase().trim()) {
    skorLokasi = 25;
  } else if (
    lost.location.zona_area &&
    found.location.zona_area &&
    lost.location.zona_area.toLowerCase().trim() === found.location.zona_area.toLowerCase().trim()
  ) {
    skorLokasi = 10;
  }

  // 3. Waktu (Bobot 20)
  let skorWaktu = 0;
  const lostTime = new Date(lost.tanggal_hilang).getTime();
  const foundTime = new Date(found.tanggal_temuan).getTime();

  if (foundTime >= lostTime - 12 * 60 * 60 * 1000) {
    const diffHours = (foundTime - lostTime) / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffDays <= 1) {
      skorWaktu = 20;
    } else if (diffDays <= 3) {
      skorWaktu = 15;
    } else if (diffDays <= 7) {
      skorWaktu = 10;
    } else if (diffDays <= 14) {
      skorWaktu = 5;
    } else {
      skorWaktu = 0;
    }
  }

  // 4. Kata Kunci (Bobot 25)
  const fullTextLost = `${lost.judul} ${lost.deskripsi} ${lost.ciri_rahasia || ""}`;
  const fullTextFound = `${found.judul_publik} ${found.deskripsi} ${found.ciri_rahasia || ""}`;
  const skorKataKunci = calculateKeywordScore(fullTextLost, fullTextFound);

  const skorTotal = Number((skorKategori + skorLokasi + skorWaktu + skorKataKunci).toFixed(1));

  return {
    skorTotal,
    rincian: {
      kategori: skorKategori,
      lokasi: skorLokasi,
      waktu: skorWaktu,
      kata_kunci: skorKataKunci,
    },
  };
}

/**
 * Run automatic matching for a specific lost report or found item, or all active ones.
 */
export async function runMatchingEngine({
  lostId,
  foundId,
}: {
  lostId?: number;
  foundId?: number;
} = {}) {
  // Get threshold from settings or default 60
  const settingThreshold = await prisma.setting.findUnique({
    where: { key: "ambang_skor_kandidat" },
  });
  const threshold = settingThreshold ? parseFloat(settingThreshold.value) : 60;

  // Active lost reports (status: Tayang or AdaKandidat)
  const lostReports = await prisma.lostReport.findMany({
    where: {
      deleted_at: null,
      is_hidden: false,
      status: { in: ["Tayang", "AdaKandidat"] },
      ...(lostId ? { id: lostId } : {}),
    },
    include: {
      location: true,
      category: true,
    },
  });

  // Stored found items
  const foundItems = await prisma.foundItem.findMany({
    where: {
      status: "Disimpan",
      ...(foundId ? { id: foundId } : {}),
    },
    include: {
      location: true,
      category: true,
    },
  });

  let candidatesFound = 0;

  for (const lost of lostReports) {
    for (const found of foundItems) {
      // Check if already matched or rejected
      const existingMatch = await prisma.match.findUnique({
        where: {
          lost_id_found_id: {
            lost_id: lost.id,
            found_id: found.id,
          },
        },
      });

      if (existingMatch && existingMatch.status === "ditolak") {
        // Ignored as per FR-MATCH-05
        continue;
      }

      const { skorTotal, rincian } = calculateMatchingScore({ lost, found });

      if (skorTotal >= threshold) {
        if (!existingMatch) {
          await prisma.match.create({
            data: {
              lost_id: lost.id,
              found_id: found.id,
              skor: skorTotal,
              rincian_skor: JSON.stringify(rincian),
              status: "kandidat",
            },
          });
          candidatesFound++;
        } else if (existingMatch.status === "kandidat") {
          await prisma.match.update({
            where: { id: existingMatch.id },
            data: {
              skor: skorTotal,
              rincian_skor: JSON.stringify(rincian),
            },
          });
        }
      }
    }
  }

  return { candidatesFound };
}
