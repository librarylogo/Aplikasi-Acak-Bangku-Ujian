export interface Murid {
  nisn: string;
  nis: string;
  nama: string;
  kelas: string;
  jenjang: string;
  jk: string;
  nomorPeserta?: string;
  riwayatRuang: string[];
  jadwal: string[]; // [bangkuHari1, ruangHari1, bangkuHari2, ruangHari2, ...]
  [key: string]: any;
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
}

// Fisher-Yates Shuffle
function acakArray<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function alokasiRuangUnik(
  muridGroup: Murid[],
  availableRooms: string[],
  kapasitasRuang: Record<string, number>
) {
  // 1. Reset daily room assignment for this group
  const ruangTerisi: Record<string, number> = {};
  availableRooms.forEach((r) => {
    ruangTerisi[r] = 0;
  });

  // 2. Group students by Class (Kelas) to ensure balanced distribution
  const studentsByClass: Record<string, Murid[]> = {};
  muridGroup.forEach((s) => {
    const k = s.kelas || "Unknown";
    if (!studentsByClass[k]) studentsByClass[k] = [];
    studentsByClass[k].push(s);
  });

  // 3. Shuffle classes order to avoid bias
  const classes = Object.keys(studentsByClass);
  acakArray(classes);

  // 4. Distribute each class across rooms
  const leftover: Murid[] = [];

  classes.forEach((className) => {
    const studentsInClass = studentsByClass[className];
    acakArray(studentsInClass); // Shuffle students within the class

    // Try to distribute round-robin to ensure this class is spread out
    // We start at a random room index for each class to further randomize
    let roomIdx = Math.floor(Math.random() * availableRooms.length);

    studentsInClass.forEach((s) => {
      let assigned = false;
      let attempts = 0;

      // Try to find a valid room
      while (attempts < availableRooms.length) {
        const roomName = availableRooms[roomIdx % availableRooms.length];
        const maxKap = kapasitasRuang[roomName] || 0;
        
        // Check capacity AND history
        if (
          (ruangTerisi[roomName] || 0) < maxKap &&
          !s.riwayatRuang.includes(roomName)
        ) {
          // Assign
          s.ruangHariIni = roomName;
          s.riwayatRuang.push(roomName);
          ruangTerisi[roomName] = (ruangTerisi[roomName] || 0) + 1;
          assigned = true;
          
          // Move to next room for next student
          roomIdx++;
          break;
        }

        // Try next room
        roomIdx++;
        attempts++;
      }

      if (!assigned) {
        leftover.push(s);
      }
    });
  });

  // 5. Handle leftovers (students who couldn't fit due to history constraints)
  // We relax the history constraint for them, but still respect capacity
  leftover.forEach((s) => {
    // Find any room with space
    // Sort rooms by least filled to maintain balance
    const sortedRooms = [...availableRooms].sort(
      (a, b) => (ruangTerisi[a] || 0) - (ruangTerisi[b] || 0)
    );

    let assigned = false;
    for (const roomName of sortedRooms) {
      const maxKap = kapasitasRuang[roomName] || 0;
      if ((ruangTerisi[roomName] || 0) < maxKap) {
        s.ruangHariIni = roomName;
        s.riwayatRuang.push(roomName);
        ruangTerisi[roomName] = (ruangTerisi[roomName] || 0) + 1;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      // Emergency: Overfill the room with least students
      // This should ideally not happen if capacities are calculated correctly
      const emergencyRoom = sortedRooms[0];
      s.ruangHariIni = emergencyRoom;
      s.riwayatRuang.push(emergencyRoom);
      ruangTerisi[emergencyRoom]++;
    }
  });
}

function assignSeats(allMurid: Murid[], modeGender: string, genderOrder?: "L-P" | "P-L") {
  const perRuang: Record<string, Murid[]> = {};
  allMurid.forEach((s) => {
    if (!perRuang[s.ruangHariIni]) perRuang[s.ruangHariIni] = [];
    perRuang[s.ruangHariIni].push(s);
  });

  for (const namaR in perRuang) {
    const arr = perRuang[namaR];
    
    if (modeGender === "seling") {
      const arrL = arr.filter(s => s.jk.toUpperCase() === 'L');
      const arrP = arr.filter(s => s.jk.toUpperCase() === 'P');
      acakArray(arrL);
      acakArray(arrP);
      
      const combined: Murid[] = [];
      const maxLen = Math.max(arrL.length, arrP.length);
      const startWithL = genderOrder !== "P-L"; // Default L-P
      
      for (let i = 0; i < maxLen; i++) {
        if (startWithL) {
          if (i < arrL.length) combined.push(arrL[i]);
          if (i < arrP.length) combined.push(arrP[i]);
        } else {
          if (i < arrP.length) combined.push(arrP[i]);
          if (i < arrL.length) combined.push(arrL[i]);
        }
      }
      
      for (let i = 0; i < combined.length; i++) {
        const noBangku = i + 1;
        const formatBangku = `'${combined[i].jenjang}.${noBangku < 10 ? "0" + noBangku : noBangku}`;
        combined[i].bangkuHariIni = formatBangku;
        combined[i].jadwal.push(combined[i].bangkuHariIni, combined[i].ruangHariIni);
      }
    } else {
      // Shuffle again for seat assignment
      acakArray(arr);
      
      for (let i = 0; i < arr.length; i++) {
        const noBangku = i + 1;
        // Format: 'Jenjang.NoBangku (e.g., '7.01)
        const formatBangku = `'${arr[i].jenjang}.${
          noBangku < 10 ? "0" + noBangku : noBangku
        }`;

        arr[i].bangkuHariIni = formatBangku;
        arr[i].jadwal.push(arr[i].bangkuHariIni, arr[i].ruangHariIni);
      }
    }
  }
}

// Helper to distribute total count into buckets
function distributeCapacity(total: number, roomCount: number): number[] {
  const base = Math.floor(total / roomCount);
  const remainder = total % roomCount;
  const capacities = Array(roomCount).fill(base);
  for (let i = 0; i < remainder; i++) {
    capacities[i]++;
  }
  return capacities;
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
    // Safe access to columns
    const jenjangVal = idxJenjang > -1 ? String(baris[idxJenjang]) : "-";
    
    if (
      options.jenjang === "Semua" ||
      jenjangVal === String(options.jenjang)
    ) {
      dataInduk.push({
        nisn: idxNISN > -1 ? String(baris[idxNISN]) : "-",
        nis: idxNIS > -1 ? String(baris[idxNIS]) : "-",
        nama: idxNama > -1 ? String(baris[idxNama]) : "-",
        kelas: idxKelas > -1 ? String(baris[idxKelas]) : "-",
        jenjang: jenjangVal,
        jk: idxJK > -1 ? String(baris[idxJK]) : "-",
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

  // Use custom room names or default if not provided/enough
  let roomNames = options.namaRuang;
  if (!roomNames || roomNames.length !== options.jumlahRuang) {
     // Fallback if mismatch, though UI should prevent this
     roomNames = Array.from({ length: options.jumlahRuang }, (_, i) => `R.${i + 1 < 10 ? "0" + (i + 1) : i + 1}`);
  }

  const grupData: {
    list: Murid[];
    rooms: string[];
    kapMap: Record<string, number>;
  }[] = [];

  if (options.modeGender === "pisah") {
    const perempuan = dataInduk.filter(
      (s) => s.jk.toString().toUpperCase() === "P"
    );
    const lakiLaki = dataInduk.filter(
      (s) => s.jk.toString().toUpperCase() === "L"
    );

    const totalP = perempuan.length;
    const totalL = lakiLaki.length;

    let ruangP = Math.round((totalP / totalMurid) * options.jumlahRuang);
    if (ruangP < 1 && totalP > 0) ruangP = 1;
    if (ruangP >= options.jumlahRuang && totalL > 0)
      ruangP = options.jumlahRuang - 1;
    
    // Split room names
    let roomsP: string[] = [];
    let roomsL: string[] = [];

    if (options.genderOrder === "P-L") {
        // Perempuan first
        roomsP = roomNames.slice(0, ruangP);
        roomsL = roomNames.slice(ruangP);
    } else {
        // L-P: Laki-laki first (Default)
        // Calculate rooms for L first
        const ruangL = options.jumlahRuang - ruangP;
        roomsL = roomNames.slice(0, ruangL);
        roomsP = roomNames.slice(ruangL);
    }

    // Calculate capacities for P
    const capsP = distributeCapacity(totalP, roomsP.length);
    const kapMapP: Record<string, number> = {};
    roomsP.forEach((r, i) => kapMapP[r] = capsP[i]);

    // Calculate capacities for L
    const capsL = distributeCapacity(totalL, roomsL.length);
    const kapMapL: Record<string, number> = {};
    roomsL.forEach((r, i) => kapMapL[r] = capsL[i]);

    if (totalP > 0)
      grupData.push({
        list: perempuan,
        rooms: roomsP,
        kapMap: kapMapP,
      });
    if (totalL > 0)
      grupData.push({
        list: lakiLaki,
        rooms: roomsL,
        kapMap: kapMapL,
      });
  } else if (options.modeGender === "seling") {
    const perempuan = dataInduk.filter(
      (s) => s.jk.toString().toUpperCase() === "P"
    );
    const lakiLaki = dataInduk.filter(
      (s) => s.jk.toString().toUpperCase() === "L"
    );

    const totalP = perempuan.length;
    const totalL = lakiLaki.length;

    // Calculate capacities for P across ALL rooms
    const capsP = distributeCapacity(totalP, options.jumlahRuang);
    const kapMapP: Record<string, number> = {};
    roomNames.forEach((r, i) => kapMapP[r] = capsP[i]);

    // Calculate capacities for L across ALL rooms
    const capsL = distributeCapacity(totalL, options.jumlahRuang);
    const kapMapL: Record<string, number> = {};
    roomNames.forEach((r, i) => kapMapL[r] = capsL[i]);

    if (totalP > 0)
      grupData.push({
        list: perempuan,
        rooms: roomNames,
        kapMap: kapMapP,
      });
    if (totalL > 0)
      grupData.push({
        list: lakiLaki,
        rooms: roomNames,
        kapMap: kapMapL,
      });
  } else {
    // Calculate capacities for all
    const caps = distributeCapacity(totalMurid, options.jumlahRuang);
    const kapMap: Record<string, number> = {};
    roomNames.forEach((r, i) => kapMap[r] = caps[i]);

    grupData.push({
      list: dataInduk,
      rooms: roomNames,
      kapMap: kapMap,
    });
  }

  for (let hari = 1; hari <= options.jumlahHari; hari++) {
    for (let g = 0; g < grupData.length; g++) {
      alokasiRuangUnik(
        grupData[g].list,
        grupData[g].rooms,
        grupData[g].kapMap
      );
    }
    assignSeats(dataInduk, options.modeGender, options.genderOrder);
  }

  const headerSheet = ["NO. PESERTA", "NISN", "NIS", "NAMA", "KELAS", "JENJANG", "JK"];
  for (let h = 1; h <= options.jumlahHari; h++) {
    headerSheet.push("BANGKU HARI " + h);
    headerSheet.push("RUANG HARI " + h);
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
      ...murid.jadwal,
    ];
    outputData.push(baris);
  }

  // Calculate Room Summary
  const roomCounts: Record<string, { total: number; L: number; P: number }> = {};
  
  // Initialize with all room names
  roomNames.forEach(r => {
      roomCounts[r] = { total: 0, L: 0, P: 0 };
  });

  dataInduk.forEach(murid => {
      // Use the room from the first day
      const room = murid.riwayatRuang[0]; 
      if (room && roomCounts[room]) {
          roomCounts[room].total++;
          const jk = murid.jk.toString().toUpperCase();
          if (jk === 'L') roomCounts[room].L++;
          else if (jk === 'P') roomCounts[room].P++;
      }
  });

  const roomSummary: RoomSummary[] = Object.entries(roomCounts).map(([name, counts]) => ({
      name,
      count: counts.total,
      genderCounts: { L: counts.L, P: counts.P }
  }));

  return {
    headers: headerSheet,
    data: outputData,
    jenjang: options.jenjang,
    roomSummary,
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
];
