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
  ruangTetap?: string;
  riwayatRuang: string[];
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
  data: (string | number)[][] ;
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

// Assign Duty Schedule (Piket) per room
// Each student in the room is assigned exactly 1 duty day during the exam week
function assignJadwalPiket(
  roomStudentsMap: Record<string, Murid[]>,
  roomNames: string[],
  examDays: string[],
  _targetPerHari: number = 6
): JadwalPiketPerRuang[] {
  const result: JadwalPiketPerRuang[] = [];

  roomNames.forEach((roomName) => {
    const studentsInRoom = roomStudentsMap[roomName] || [];
    const shuffledStudents = [...studentsInRoom];
    acakArray(shuffledStudents);

    const numDays = examDays.length;
    // Distribute students evenly across exam days so all students piket 1 time
    const dayCapacities = distributeCapacity(shuffledStudents.length, numDays);

    const jadwalHari = examDays.map((dayName, dayIdx) => {
      return {
        hari: dayName,
        urutanHariKe: dayIdx + 1,
        murid: [] as MuridPiket[],
      };
    });

    let currentStudentIdx = 0;
    for (let dayIdx = 0; dayIdx < numDays; dayIdx++) {
      const cap = dayCapacities[dayIdx];
      for (let c = 0; c < cap; c++) {
        if (currentStudentIdx < shuffledStudents.length) {
          const student = shuffledStudents[currentStudentIdx];
          student.piketHari = examDays[dayIdx];
          student.piketRuang = roomName;
          student.piketHariKe = dayIdx + 1;

          jadwalHari[dayIdx].murid.push({
            nama: student.nama,
            kelas: student.kelas,
            nomorPeserta: student.nomorPeserta,
            jk: student.jk,
          });
          currentStudentIdx++;
        }
      }
    }

    result.push({
      namaRuang: roomName,
      jadwalHari,
    });
  });

  return result;
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
  // 1. TAHAP ALOKASI RUANG TETAP (KONSISTEN 100% UNTUK SELURUH HARI UJIAN)
  //    Siswa ditetapkan ke 1 ruang untuk seluruh periode ujian.
  //    Kapasitas ruang dibagi seimbang (misal 247 murid di 16 ruang:
  //    Ruang 1 s.d 7 = 16 murid, Ruang 8 s.d 16 = 15 murid).
  // =========================================================================

  const roomCapacities = distributeCapacity(totalMurid, options.jumlahRuang);

  if (options.modeGender === "pisah") {
    // Mode Pisah: Ruang ujian dipisah L dan P
    const males = dataInduk.filter((s) => s.jk === "L");
    const females = dataInduk.filter((s) => s.jk === "P");

    if (males.length === 0 || females.length === 0) {
      // Jika hanya ada 1 gender, alokasikan seperti campur
      const interleaved = interleaveByClass(dataInduk);
      let sIdx = 0;
      for (let i = 0; i < options.jumlahRuang; i++) {
        const cap = roomCapacities[i];
        for (let c = 0; c < cap; c++) {
          if (sIdx < interleaved.length) {
            interleaved[sIdx].ruangTetap = roomNames[i];
            sIdx++;
          }
        }
      }
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

      const interleavedL = interleaveByClass(males);
      let sLIdx = 0;
      for (let i = 0; i < roomsL.length; i++) {
        const cap = capsL[i];
        for (let c = 0; c < cap; c++) {
          if (sLIdx < interleavedL.length) {
            interleavedL[sLIdx].ruangTetap = roomsL[i];
            sLIdx++;
          }
        }
      }

      const interleavedP = interleaveByClass(females);
      let sPIdx = 0;
      for (let i = 0; i < roomsP.length; i++) {
        const cap = capsP[i];
        for (let c = 0; c < cap; c++) {
          if (sPIdx < interleavedP.length) {
            interleavedP[sPIdx].ruangTetap = roomsP[i];
            sPIdx++;
          }
        }
      }
    }
  } else if (options.modeGender === "seling") {
    // Mode Seling Tempat Duduk:
    // Prioritas UTAMA: Pembagian jumlah murid selalu SEIMBANG di tiap ruang (sesuai roomCapacities).
    // Diisi selang-seling L dan P sebisa mungkin.
    // Jika salah satu gender habis di ruang-ruang akhir, ruang akhir tetap diisi penuh
    // dengan gender yang tersisa agar jumlah murid tiap ruang selalu seimbang (tidak timpang).
    const males = dataInduk.filter((s) => s.jk === "L");
    const females = dataInduk.filter((s) => s.jk === "P");

    const interleavedL = interleaveByClass(males);
    const interleavedP = interleaveByClass(females);

    let sLIdx = 0;
    let sPIdx = 0;

    for (let i = 0; i < options.jumlahRuang; i++) {
      const roomName = roomNames[i];
      const targetCap = roomCapacities[i]; // e.g. 16 or 15

      // Target ideal L dan P per ruang (setengah kapasitas)
      let idealL: number;
      let idealP: number;

      if (options.genderOrder === "P-L") {
        idealP = Math.ceil(targetCap / 2);
        idealL = targetCap - idealP;
      } else {
        idealL = Math.ceil(targetCap / 2);
        idealP = targetCap - idealL;
      }

      // Ambil L dan P yang masih tersedia
      const availableL = interleavedL.length - sLIdx;
      const availableP = interleavedP.length - sPIdx;

      let takeL = Math.min(idealL, availableL);
      let takeP = Math.min(idealP, availableP);

      // Jika total takeL + takeP belum memenuhi target kapasitas ruang,
      // penuhi sisa kekurangan dari gender mana pun yang masih tersisa
      // (ruang-ruang akhir bisa tidak seling demi menjaga jumlah murid seimbang)
      let deficit = targetCap - (takeL + takeP);
      if (deficit > 0) {
        const extraL = Math.min(deficit, availableL - takeL);
        takeL += extraL;
        deficit -= extraL;
      }
      if (deficit > 0) {
        const extraP = Math.min(deficit, availableP - takeP);
        takeP += extraP;
        deficit -= extraP;
      }

      // Alokasikan ke ruang
      for (let c = 0; c < takeL; c++) {
        if (sLIdx < interleavedL.length) {
          interleavedL[sLIdx].ruangTetap = roomName;
          sLIdx++;
        }
      }

      for (let c = 0; c < takeP; c++) {
        if (sPIdx < interleavedP.length) {
          interleavedP[sPIdx].ruangTetap = roomName;
          sPIdx++;
        }
      }
    }

    // Safety fallback: pastikan semua murid teralokasi
    while (sLIdx < interleavedL.length || sPIdx < interleavedP.length) {
      let targetRoom = roomNames[0];
      for (let i = 0; i < options.jumlahRuang; i++) {
        const rName = roomNames[i];
        const currentCount = dataInduk.filter((s) => s.ruangTetap === rName).length;
        if (currentCount < roomCapacities[i]) {
          targetRoom = rName;
          break;
        }
      }
      if (sLIdx < interleavedL.length) {
        interleavedL[sLIdx].ruangTetap = targetRoom;
        sLIdx++;
      } else if (sPIdx < interleavedP.length) {
        interleavedP[sPIdx].ruangTetap = targetRoom;
        sPIdx++;
      }
    }
  } else {
    // Mode Campur Bebas: Pembagian ruang seimbang sempurna
    const interleaved = interleaveByClass(dataInduk);
    let sIdx = 0;
    for (let i = 0; i < options.jumlahRuang; i++) {
      const cap = roomCapacities[i];
      for (let c = 0; c < cap; c++) {
        if (sIdx < interleaved.length) {
          interleaved[sIdx].ruangTetap = roomNames[i];
          sIdx++;
        }
      }
    }
  }

  // Kelompokkan siswa berdasarkan ruang tetapnya
  const roomStudentsMap: Record<string, Murid[]> = {};
  roomNames.forEach((r) => {
    roomStudentsMap[r] = [];
  });
  dataInduk.forEach((s) => {
    if (s.ruangTetap && roomStudentsMap[s.ruangTetap]) {
      roomStudentsMap[s.ruangTetap].push(s);
    }
  });

  // =========================================================================
  // 2. TAHAP PENGACAKAN NOMOR BANGKU HARIAN (HARI 1 S.D JUMLAH HARI)
  //    Siswa tetap berada di ruangnya, tetapi nomor bangku diacak setiap hari.
  //    Menjamin hari ke-6 dan seluruh hari 100% lengkap memiliki nomor bangku.
  // =========================================================================

  dataInduk.forEach((s) => {
    s.jadwal = [];
    s.riwayatRuang = [];
  });

  for (let hari = 1; hari <= options.jumlahHari; hari++) {
    for (let r = 0; r < roomNames.length; r++) {
      const roomName = roomNames[r];
      const students = roomStudentsMap[roomName] || [];

      if (options.modeGender === "seling") {
        const arrL = students.filter((s) => s.jk === "L");
        const arrP = students.filter((s) => s.jk === "P");
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
          orderedStudents[i].riwayatRuang.push(roomName);
          orderedStudents[i].jadwal.push(formatBangku, roomName);
        }
      } else {
        // Campur atau Pisah: acak urutan bangku di dalam ruang
        const shuffled = [...students];
        acakArray(shuffled);

        for (let i = 0; i < shuffled.length; i++) {
          const noBangku = i + 1;
          const formatBangku = `'${shuffled[i].jenjang}.${
            noBangku < 10 ? "0" + noBangku : noBangku
          }`;
          shuffled[i].riwayatRuang.push(roomName);
          shuffled[i].jadwal.push(formatBangku, roomName);
        }
      }
    }
  }

  // =========================================================================
  // 3. TAHAP JADWAL PIKET MURID
  //    Setiap murid di ruang piket 1× selama sepekan ujian.
  // =========================================================================

  const examDays = hitungHariUjian(
    options.hariMulai || "Senin",
    options.hariLibur || ["Minggu"],
    options.jumlahHari
  );

  const targetMuridPiket = options.jumlahPiketPerHari || 6;
  const jadwalPiket = assignJadwalPiket(
    roomStudentsMap,
    roomNames,
    examDays,
    targetMuridPiket
  );

  // =========================================================================
  // 4. SUSUN OUTPUT HASIL DAN HEADER
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

  // Rekapitulasi Ruang
  const roomSummary: RoomSummary[] = roomNames.map((roomName) => {
    const list = roomStudentsMap[roomName] || [];
    const countL = list.filter((s) => s.jk === "L").length;
    const countP = list.filter((s) => s.jk === "P").length;
    return {
      name: roomName,
      count: list.length,
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
