export const HARI_DALAM_SEMINGGU = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export function hitungHariUjian(
  hariMulai: string = "Senin",
  hariLibur: string[] = ["Minggu"],
  jumlahHari: number = 6
): string[] {
  const result: string[] = [];
  const startIndex = HARI_DALAM_SEMINGGU.indexOf(hariMulai as any);
  let currentIdx = startIndex >= 0 ? startIndex : 0;
  let safety = 0;

  while (result.length < Math.max(1, jumlahHari) && safety < 100) {
    const hari = HARI_DALAM_SEMINGGU[currentIdx % 7];
    if (!hariLibur.includes(hari)) {
      result.push(hari);
    }
    currentIdx++;
    safety++;
  }
  return result;
}

export interface Murid {
  nisn: string;
  nis: string;
  nama: string;
  kelas: string;
  jenjang: string;
  jk: string;
  nomorPeserta?: string;
  riwayatRuang: string[]; // [ruangHari1, ruangHari2, ...]
  jadwal: string[]; // [bangkuHari1, ruangHari1, bangkuHari2, ruangHari2, ...]
  piketHari?: string;
  piketRuang?: string;
  piketHariKe?: number;
  [key: string]: any;
}

export interface MuridPiket {
  nama: string;
  kelas: string;
  nomorPeserta?: string;
  jk: string;
}

export interface JadwalPiketPerRuang {
  namaRuang: string;
  jadwalHari: {
    hari: string;
    urutanHariKe: number;
    murid: MuridPiket[];
  }[];
}

export interface RandomizerOptions {
  modeGender: "campur" | "pisah" | "seling";
  genderOrder?: "L-P" | "P-L";
  jumlahHari: number;
  jenjang: string;
  jumlahRuang: number;
  namaRuang: string[];
  startNomorPeserta: number;
  incrementNomorPeserta: number;
  hariMulai?: string;
  hariLibur?: string[];
  jumlahPiketPerHari?: number;
}

export interface RoomSummary {
  name: string;
  count: number;
  genderCounts: { L: number; P: number };
}

export interface RandomizerResult {
  headers: string[];
  data: (string | number)[][];
  jenjang: string;
  roomSummary: RoomSummary[];
  jadwalPiket: JadwalPiketPerRuang[];
  examDays: string[];
}

// Fisher-Yates Shuffle
function acakArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Helper to distribute total count into balanced buckets
// E.g. 247 murid into 16 rooms:
// base = 15, remainder = 7 -> Rooms 1..7 get 16, Rooms 8..16 get 15.
export function distributeCapacity(total: number, roomCount: number): number[] {
  if (roomCount <= 0) return [];
  const base = Math.floor(total / roomCount);
  const remainder = total % roomCount;
  const capacities = Array(roomCount).fill(base);
  for (let i = 0; i < remainder; i++) {
    capacities[i]++;
  }
  return capacities;
}

// Interleave students by class so that all rooms get an even mix of classes
function interleaveByClass(students: Murid[]): Murid[] {
  const byClass: Record<string, Murid[]> = {};
  students.forEach((s) => {
    const k = s.kelas || "Default";
    if (!byClass[k]) byClass[k] = [];
    byClass[k].push(s);
  });

  // Shuffle within each class first
  Object.values(byClass).forEach((arr) => acakArray(arr));

  // Sort classes by count descending
  const classKeys = Object.keys(byClass).sort(
    (a, b) => byClass[b].length - byClass[a].length
  );

  const result: Murid[] = [];
  let added = true;
  let round = 0;
  while (added) {
    added = false;
    for (const k of classKeys) {
      if (round < byClass[k].length) {
        result.push(byClass[k][round]);
        added = true;
      }
    }
    round++;
  }
  return result;
}

/**
 * Rotasi Ruang Harian Menggunakan Bipartite Matching (Kuhn's Algorithm):
 * - Memastikan setiap murid BERGANTI RUANG setiap hari (tidak mengulang ruang jika jumlahHari <= jumlahRuang).
 * - Menjamin kapasitas setiap ruang TEPAT sama dengan roomCapacities di SETIAP HARI ujian.
 */
function rotateStudentsToRooms(
  students: Murid[],
  availableRooms: string[],
  roomCapacities: number[],
  numDays: number
): void {
  const numStudents = students.length;
  if (numStudents === 0 || availableRooms.length === 0 || numDays <= 0) return;

  // Bangun daftar slot berdasarkan kapasitas ruang
  const slotToRoom: string[] = [];
  for (let r = 0; r < availableRooms.length; r++) {
    const roomName = availableRooms[r];
    const cap = roomCapacities[r] || 0;
    for (let c = 0; c < cap; c++) {
      slotToRoom.push(roomName);
    }
  }

  // Jaga konsistensi panjang slot
  if (slotToRoom.length !== numStudents) {
    while (slotToRoom.length < numStudents) {
      slotToRoom.push(availableRooms[slotToRoom.length % availableRooms.length]);
    }
    slotToRoom.length = numStudents;
  }

  // Riwayat ruangan yang sudah pernah dikunjungi tiap murid
  const visitedRooms: Set<string>[] = Array.from({ length: numStudents }, () => new Set());
  const lastRoom: string[] = Array(numStudents).fill("");

  // Alokasikan hari demi hari
  for (let d = 0; d < numDays; d++) {
    const slotToStudent = Array(numStudents).fill(-1);
    const studentToSlot = Array(numStudents).fill(-1);

    // Acak urutan murid agar tidak ada bias
    const studentIndices = Array.from({ length: numStudents }, (_, i) => i);
    acakArray(studentIndices);

    // DFS Augmenting Path untuk Bipartite Matching
    function dfs(u: number, seen: boolean[], allowVisitedFallback: boolean): boolean {
      for (let slot = 0; slot < numStudents; slot++) {
        const room = slotToRoom[slot];
        let canTake = false;

        if (!allowVisitedFallback) {
          // Ketat: Ruang belum pernah dikunjungi murid ini
          canTake = !visitedRooms[u].has(room);
        } else {
          // Fallback jika hari > jumlah ruang: Jangan sama dengan ruang kemarin
          canTake = room !== lastRoom[u];
        }

        if (canTake && !seen[slot]) {
          seen[slot] = true;
          if (slotToStudent[slot] < 0 || dfs(slotToStudent[slot], seen, allowVisitedFallback)) {
            slotToStudent[slot] = u;
            studentToSlot[u] = slot;
            return true;
          }
        }
      }
      return false;
    }

    // Tahap 1: Pencocokan ketat (ruang baru yang belum pernah dikunjungi)
    const unmatched: number[] = [];
    for (const u of studentIndices) {
      const seen = Array(numStudents).fill(false);
      if (!dfs(u, seen, false)) {
        unmatched.push(u);
      }
    }

    // Tahap 2: Fallback jika diperlukan
    if (unmatched.length > 0) {
      for (const u of unmatched) {
        const seen = Array(numStudents).fill(false);
        dfs(u, seen, true);
      }
    }

    // Tahap 3: Emergency safeguard
    for (let slot = 0; slot < numStudents; slot++) {
      if (slotToStudent[slot] < 0) {
        for (let u = 0; u < numStudents; u++) {
          if (studentToSlot[u] < 0) {
            slotToStudent[slot] = u;
            studentToSlot[u] = slot;
            break;
          }
        }
      }
    }

    // Rekam alokasi ruang untuk hari ini
    for (let u = 0; u < numStudents; u++) {
      const slot = studentToSlot[u];
      const room = slotToRoom[slot];
      students[u].riwayatRuang.push(room);
      visitedRooms[u].add(room);
      lastRoom[u] = room;
    }
  }
}

// Assign Jadwal Piket (1× selama pekan ujian untuk setiap murid)
function assignJadwalPiket(
  allMurid: Murid[],
  roomNames: string[],
  examDays: string[],
  roomCapacities: number[]
): JadwalPiketPerRuang[] {
  const numDays = examDays.length;

  allMurid.forEach((s) => {
    s.piketHari = "";
    s.piketRuang = "";
    s.piketHariKe = 0;
  });

  const piketPerRuangHari: Record<string, Record<string, MuridPiket[]>> = {};
  roomNames.forEach((r) => {
    piketPerRuangHari[r] = {};
    examDays.forEach((d) => {
      piketPerRuangHari[r][d] = [];
    });
  });

  // Bagikan piket hari demi hari berdasarkan ruang tempat murid berada pada hari tersebut
  for (let d = 0; d < numDays; d++) {
    const dayName = examDays[d];

    for (let r = 0; r < roomNames.length; r++) {
      const roomName = roomNames[r];
      const cap = roomCapacities[r] || 16;
      const targetPiket = Math.max(1, Math.ceil(cap / numDays));

      // Cari murid yang berada di ruang ini pada hari ini dan belum dapat jadwal piket
      const candidates = allMurid.filter(
        (s) => s.riwayatRuang[d] === roomName && !s.piketHari
      );
      acakArray(candidates);

      const picked = candidates.slice(0, targetPiket);
      picked.forEach((s) => {
        s.piketHari = dayName;
        s.piketRuang = roomName;
        s.piketHariKe = d + 1;

        piketPerRuangHari[roomName][dayName].push({
          nama: s.nama,
          kelas: s.kelas,
          nomorPeserta: s.nomorPeserta,
          jk: s.jk,
        });
      });
    }
  }

  // Alokasikan murid yang belum terjadwal (jika ada) ke hari di mana ruangnya paling sedikit piket
  const unassigned = allMurid.filter((s) => !s.piketHari);
  unassigned.forEach((s) => {
    let bestDayIdx = 0;
    let minPiket = Infinity;

    for (let d = 0; d < numDays; d++) {
      const dayName = examDays[d];
      const roomAtDay = s.riwayatRuang[d] || roomNames[0];
      const count = piketPerRuangHari[roomAtDay]?.[dayName]?.length || 0;
      if (count < minPiket) {
        minPiket = count;
        bestDayIdx = d;
      }
    }

    const dayName = examDays[bestDayIdx];
    const roomAtDay = s.riwayatRuang[bestDayIdx] || roomNames[0];
    s.piketHari = dayName;
    s.piketRuang = roomAtDay;
    s.piketHariKe = bestDayIdx + 1;

    if (!piketPerRuangHari[roomAtDay]) piketPerRuangHari[roomAtDay] = {};
    if (!piketPerRuangHari[roomAtDay][dayName]) piketPerRuangHari[roomAtDay][dayName] = [];
    piketPerRuangHari[roomAtDay][dayName].push({
      nama: s.nama,
      kelas: s.kelas,
      nomorPeserta: s.nomorPeserta,
      jk: s.jk,
    });
  });

  return roomNames.map((roomName) => {
    const jadwalHari = examDays.map((dayName, idx) => ({
      hari: dayName,
      urutanHariKe: idx + 1,
      murid: piketPerRuangHari[roomName]?.[dayName] || [],
    }));
    return {
      namaRuang: roomName,
      jadwalHari,
    };
  });
}

export function processRandomization(
  rawData: (string | number)[][],
  options: RandomizerOptions
): RandomizerResult {
  if (!rawData || rawData.length === 0) {
    throw new Error("Data kosong.");
  }

  const header = rawData[0].map((h) => String(h).trim().toUpperCase());
  const dataRows = rawData.slice(1);

  // Column detection
  let idxNISN = -1,
    idxNIS = -1,
    idxNama = -1,
    idxKelas = -1,
    idxJenjang = -1,
    idxJK = -1;

  for (let i = 0; i < header.length; i++) {
    const judul = header[i];
    if (judul === "NISN") idxNISN = i;
    else if (judul === "NIS") idxNIS = i;
    else if (judul === "NAMA" || judul === "NAMA MURID" || judul === "NAMA SISWA") idxNama = i;
    else if (judul === "KELAS" || judul === "ROMBEL") idxKelas = i;
    else if (judul === "JENJANG") idxJenjang = i;
    else if (
      judul === "JK" ||
      judul === "JENIS KELAMIN" ||
      judul === "L/P"
    )
      idxJK = i;
  }

  const missingHeaders = [];
  if (idxNama === -1) missingHeaders.push("NAMA");
  if (idxKelas === -1) missingHeaders.push("KELAS");
  if (idxJenjang === -1) missingHeaders.push("JENJANG");
  if (idxJK === -1) missingHeaders.push("JK");

  if (missingHeaders.length > 0) {
    throw new Error(
      `Kolom wajib tidak ditemukan: ${missingHeaders.join(
        ", "
      )}. Pastikan header Excel/CSV sesuai.`
    );
  }

  const dataInduk: Murid[] = [];

  for (let r = 0; r < dataRows.length; r++) {
    const baris = dataRows[r];
    const jenjangVal = idxJenjang > -1 ? String(baris[idxJenjang]).trim() : "-";

    if (
      options.jenjang === "Semua" ||
      jenjangVal === String(options.jenjang).trim()
    ) {
      dataInduk.push({
        nisn: idxNISN > -1 ? String(baris[idxNISN]).trim() : "-",
        nis: idxNIS > -1 ? String(baris[idxNIS]).trim() : "-",
        nama: idxNama > -1 ? String(baris[idxNama]).trim() : "-",
        kelas: idxKelas > -1 ? String(baris[idxKelas]).trim() : "-",
        jenjang: jenjangVal,
        jk: idxJK > -1 ? String(baris[idxJK]).trim().toUpperCase() : "-",
        riwayatRuang: [],
        jadwal: [],
      });
    }
  }

  const totalMurid = dataInduk.length;
  if (totalMurid === 0) {
    throw new Error(
      "Tidak ada data murid yang cocok dengan pilihan jenjang."
    );
  }

  // Assign Nomor Peserta
  let currentNo = options.startNomorPeserta || 1;
  const increment = options.incrementNomorPeserta || 1;

  for (let i = 0; i < dataInduk.length; i++) {
    dataInduk[i].nomorPeserta = String(currentNo);
    currentNo += increment;
  }

  // Setup Room Names
  let roomNames = options.namaRuang;
  if (!roomNames || roomNames.length !== options.jumlahRuang) {
    roomNames = Array.from(
      { length: options.jumlahRuang },
      (_, i) => `R.${i + 1 < 10 ? "0" + (i + 1) : i + 1}`
    );
  }

  // =========================================================================
  // 1. TAHAP PEMBAGIAN KAPASITAS RUANG SEIMBANG
  //    Contoh: 247 murid di 16 ruang -> Ruang 1 s.d 7 = 16 murid, Ruang 8 s.d 16 = 15 murid.
  // =========================================================================
  const roomCapacities = distributeCapacity(totalMurid, options.jumlahRuang);

  // Bersihkan riwayat dan jadwal
  dataInduk.forEach((s) => {
    s.riwayatRuang = [];
    s.jadwal = [];
  });

  // =========================================================================
  // 2. TAHAP ROTASI RUANG HARIAN (SETIAP MURID BERGANTI RUANG SETIAP HARI)
  // =========================================================================
  if (options.modeGender === "pisah") {
    const males = dataInduk.filter((s) => s.jk === "L");
    const females = dataInduk.filter((s) => s.jk === "P");

    if (males.length === 0 || females.length === 0) {
      // Jika hanya ada 1 gender
      rotateStudentsToRooms(
        interleaveByClass(dataInduk),
        roomNames,
        roomCapacities,
        options.jumlahHari
      );
    } else {
      let ruangP = Math.round((females.length / totalMurid) * options.jumlahRuang);
      ruangP = Math.max(1, Math.min(options.jumlahRuang - 1, ruangP));
      const ruangL = options.jumlahRuang - ruangP;

      let roomsP: string[];
      let roomsL: string[];

      if (options.genderOrder === "P-L") {
        roomsP = roomNames.slice(0, ruangP);
        roomsL = roomNames.slice(ruangP);
      } else {
        roomsL = roomNames.slice(0, ruangL);
        roomsP = roomNames.slice(ruangL);
      }

      const capsL = distributeCapacity(males.length, roomsL.length);
      const capsP = distributeCapacity(females.length, roomsP.length);

      rotateStudentsToRooms(interleaveByClass(males), roomsL, capsL, options.jumlahHari);
      rotateStudentsToRooms(interleaveByClass(females), roomsP, capsP, options.jumlahHari);
    }
  } else if (options.modeGender === "seling") {
    // Mode Seling:
    // Prioritas: Jumlah murid per ruang tetap seimbang (Ruang 1..7: 16 murid, Ruang 8..16: 15 murid).
    // Tentukan target L dan P per ruang.
    const males = dataInduk.filter((s) => s.jk === "L");
    const females = dataInduk.filter((s) => s.jk === "P");

    const targetLPerRoom: number[] = [];
    const targetPPerRoom: number[] = [];

    let remL = males.length;
    let remP = females.length;

    for (let r = 0; r < options.jumlahRuang; r++) {
      const targetCap = roomCapacities[r];
      let idealL: number;
      let idealP: number;

      if (options.genderOrder === "P-L") {
        idealP = Math.ceil(targetCap / 2);
        idealL = targetCap - idealP;
      } else {
        idealL = Math.ceil(targetCap / 2);
        idealP = targetCap - idealL;
      }

      let takeL = Math.min(idealL, remL);
      let takeP = Math.min(idealP, remP);

      let deficit = targetCap - (takeL + takeP);
      if (deficit > 0) {
        const extraL = Math.min(deficit, remL - takeL);
        takeL += extraL;
        deficit -= extraL;
      }
      if (deficit > 0) {
        const extraP = Math.min(deficit, remP - takeP);
        takeP += extraP;
        deficit -= extraP;
      }

      targetLPerRoom.push(takeL);
      targetPPerRoom.push(takeP);
      remL -= takeL;
      remP -= takeP;
    }

    // Rotasi murid L dan P ke ruangan setiap hari
    rotateStudentsToRooms(interleaveByClass(males), roomNames, targetLPerRoom, options.jumlahHari);
    rotateStudentsToRooms(interleaveByClass(females), roomNames, targetPPerRoom, options.jumlahHari);
  } else {
    // Mode Campur Bebas
    rotateStudentsToRooms(
      interleaveByClass(dataInduk),
      roomNames,
      roomCapacities,
      options.jumlahHari
    );
  }

  // =========================================================================
  // 3. TAHAP PENGACAKAN NOMOR BANGKU HARIAN DI DALAM RUANGAN
  // =========================================================================
  for (let hari = 1; hari <= options.jumlahHari; hari++) {
    const dayIdx = hari - 1;

    for (let r = 0; r < roomNames.length; r++) {
      const roomName = roomNames[r];
      // Ambil murid yang berada di ruang ini pada hari ini
      const studentsInThisRoom = dataInduk.filter(
        (s) => s.riwayatRuang[dayIdx] === roomName
      );

      if (options.modeGender === "seling") {
        const arrL = studentsInThisRoom.filter((s) => s.jk === "L");
        const arrP = studentsInThisRoom.filter((s) => s.jk === "P");
        acakArray(arrL);
        acakArray(arrP);

        const orderedStudents: Murid[] = [];
        const maxLen = Math.max(arrL.length, arrP.length);
        const startWithL = options.genderOrder !== "P-L";

        for (let i = 0; i < maxLen; i++) {
          if (startWithL) {
            if (i < arrL.length) orderedStudents.push(arrL[i]);
            if (i < arrP.length) orderedStudents.push(arrP[i]);
          } else {
            if (i < arrP.length) orderedStudents.push(arrP[i]);
            if (i < arrL.length) orderedStudents.push(arrL[i]);
          }
        }

        for (let i = 0; i < orderedStudents.length; i++) {
          const noBangku = i + 1;
          const formatBangku = `'${orderedStudents[i].jenjang}.${
            noBangku < 10 ? "0" + noBangku : noBangku
          }`;
          orderedStudents[i].jadwal.push(formatBangku, roomName);
        }
      } else {
        // Campur atau Pisah
        const shuffled = [...studentsInThisRoom];
        acakArray(shuffled);

        for (let i = 0; i < shuffled.length; i++) {
          const noBangku = i + 1;
          const formatBangku = `'${shuffled[i].jenjang}.${
            noBangku < 10 ? "0" + noBangku : noBangku
          }`;
          shuffled[i].jadwal.push(formatBangku, roomName);
        }
      }
    }
  }

  // =========================================================================
  // 4. TAHAP JADWAL PIKET MURID
  // =========================================================================
  const examDays = hitungHariUjian(
    options.hariMulai || "Senin",
    options.hariLibur || ["Minggu"],
    options.jumlahHari
  );

  const jadwalPiket = assignJadwalPiket(
    dataInduk,
    roomNames,
    examDays,
    roomCapacities
  );

  // =========================================================================
  // 5. SUSUN OUTPUT HASIL DAN HEADER
  // =========================================================================
  const headerSheet = [
    "NO. PESERTA",
    "NISN",
    "NIS",
    "NAMA",
    "KELAS",
    "JENJANG",
    "JK",
    "HARI PIKET",
    "RUANG PIKET",
  ];

  for (let h = 1; h <= options.jumlahHari; h++) {
    const dayLabel = examDays[h - 1] ? ` (${examDays[h - 1]})` : "";
    headerSheet.push(`BANGKU HARI ${h}${dayLabel}`);
    headerSheet.push(`RUANG HARI ${h}${dayLabel}`);
  }

  const outputData: (string | number)[][] = [];
  for (let i = 0; i < dataInduk.length; i++) {
    const murid = dataInduk[i];
    const baris = [
      murid.nomorPeserta || "",
      murid.nisn,
      murid.nis,
      murid.nama,
      murid.kelas,
      murid.jenjang,
      murid.jk,
      murid.piketHari || "-",
      murid.piketRuang || "-",
      ...murid.jadwal,
    ];
    outputData.push(baris);
  }

  // Rekapitulasi Ruang (Hari ke-1 sebagai acuan kapasitas konsisten)
  const roomSummary: RoomSummary[] = roomNames.map((roomName, idx) => {
    const cap = roomCapacities[idx];
    const listDay1 = dataInduk.filter((s) => s.riwayatRuang[0] === roomName);
    const countL = listDay1.filter((s) => s.jk === "L").length;
    const countP = listDay1.filter((s) => s.jk === "P").length;
    return {
      name: roomName,
      count: cap,
      genderCounts: { L: countL, P: countP },
    };
  });

  return {
    headers: headerSheet,
    data: outputData,
    jenjang: options.jenjang,
    roomSummary,
    jadwalPiket,
    examDays,
  };
}

export const SAMPLE_DATA = [
  ["NISN", "NIS", "NAMA", "KELAS", "JENJANG", "JK"],
  ["001", "101", "Ahmad", "7A", "7", "L"],
  ["002", "102", "Budi", "7A", "7", "L"],
  ["003", "103", "Citra", "7A", "7", "P"],
  ["004", "104", "Dewi", "7B", "7", "P"],
  ["005", "105", "Eko", "7B", "7", "L"],
  ["006", "106", "Fajar", "8A", "8", "L"],
  ["007", "107", "Gita", "8A", "8", "P"],
  ["008", "108", "Hadi", "8B", "8", "L"],
  ["009", "109", "Indah", "8B", "8", "P"],
  ["010", "110", "Joko", "9A", "9", "L"],
  ["011", "111", "Kartika", "9A", "9", "P"],
  ["012", "112", "Lestari", "9B", "9", "P"],
  ["013", "113", "Maman", "9B", "9", "L"],
  ["014", "114", "Nina", "9C", "9", "P"],
  ["015", "115", "Oki", "9C", "9", "L"],
  ["016", "116", "Putri", "7A", "7", "P"],
  ["017", "117", "Qori", "7B", "7", "P"],
  ["018", "118", "Rian", "8A", "8", "L"],
  ["019", "119", "Siti", "8B", "8", "P"],
  ["020", "120", "Tono", "9A", "9", "L"],
];
