import React, { useState, useEffect, useMemo } from "react";
import { Upload, FileText, Play, RotateCcw, Download, Settings, Users, Calendar, Sparkles, Check } from "lucide-react";
import { SAMPLE_DATA, HARI_DALAM_SEMINGGU, hitungHariUjian } from "@/lib/randomizer";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

interface ConfigFormProps {
  onProcess: (data: any[][], options: any) => void;
  isProcessing: boolean;
}

export function ConfigForm({ onProcess, isProcessing }: ConfigFormProps) {
  const [modeGender, setModeGender] = useState<"campur" | "pisah" | "seling">("campur");
  const [genderOrder, setGenderOrder] = useState<"L-P" | "P-L">("L-P");
  const [jumlahHari, setJumlahHari] = useState(6);
  const [hariMulai, setHariMulai] = useState("Senin");
  const [hariLibur, setHariLibur] = useState<string[]>(["Minggu"]);
  const [jumlahPiketPerHari, setJumlahPiketPerHari] = useState(6);
  const [jenjang, setJenjang] = useState("Semua");
  const [jenjangOptions, setJenjangOptions] = useState<string[]>([]);
  const [jumlahRuang, setJumlahRuang] = useState(5);
  const [namaRuang, setNamaRuang] = useState<string[]>([]);
  const [startNomorPeserta, setStartNomorPeserta] = useState(1);
  const [incrementNomorPeserta, setIncrementNomorPeserta] = useState(1);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  // Active exam days preview
  const activeExamDays = useMemo(() => {
    return hitungHariUjian(hariMulai, hariLibur, jumlahHari);
  }, [hariMulai, hariLibur, jumlahHari]);

  const toggleHariLibur = (hari: string) => {
    setHariLibur((prev) => {
      if (prev.includes(hari)) {
        return prev.filter((h) => h !== hari);
      } else {
        return [...prev, hari];
      }
    });
  };

  // Initialize room names when jumlahRuang changes
  useEffect(() => {
    setNamaRuang((prev) => {
      const newNames = [...prev];
      if (jumlahRuang > prev.length) {
        for (let i = prev.length; i < jumlahRuang; i++) {
          newNames.push(`R.${i + 1 < 10 ? "0" + (i + 1) : i + 1}`);
        }
      } else if (jumlahRuang < prev.length) {
        return newNames.slice(0, jumlahRuang);
      }
      return newNames;
    });
  }, [jumlahRuang]);

  const extractJenjangOptions = (data: any[][]) => {
    if (!data || data.length < 2) return;
    
    const header = data[0].map((h) => String(h).trim().toUpperCase());
    let idxJenjang = -1;
    
    for (let i = 0; i < header.length; i++) {
      if (header[i] === "JENJANG") idxJenjang = i;
    }

    if (idxJenjang > -1) {
      const uniqueJenjang = new Set<string>();
      for (let i = 1; i < data.length; i++) {
        const val = data[i][idxJenjang];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          uniqueJenjang.add(String(val).trim());
        }
      }
      // Sort numerically if possible, else alphabetically
      const sorted = Array.from(uniqueJenjang).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });
      setJenjangOptions(sorted);
    }
  };

  const handleRoomNameChange = (index: number, value: string) => {
    const newNames = [...namaRuang];
    newNames[index] = value;
    setNamaRuang(newNames);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
      setRawData(data);
      setFileName(file.name);
      extractJenjangOptions(data);
    };
    reader.readAsBinaryString(file);
  };

  const loadSampleData = () => {
    setRawData(SAMPLE_DATA);
    setFileName("Sample Data");
    extractJenjangOptions(SAMPLE_DATA);
  };

  const downloadTemplate = () => {
    const headers = [["NISN", "NIS", "NAMA", "KELAS", "JENJANG", "JK"]];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Data_Murid.xlsx");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawData.length === 0) {
      alert("Silakan upload data atau gunakan data sampel terlebih dahulu.");
      return;
    }
    onProcess(rawData, {
      modeGender,
      genderOrder,
      jumlahHari,
      jenjang,
      jumlahRuang,
      namaRuang,
      startNomorPeserta,
      incrementNomorPeserta,
      hariMulai,
      hariLibur,
      jumlahPiketPerHari,
    });
  };

  return (
    <div className="glass-panel rounded-2xl shadow-xl shadow-indigo-950/5 border border-white/70 p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50/80 backdrop-blur-sm border border-indigo-100 rounded-xl">
            <Settings className="w-4 h-4 text-indigo-600" />
          </div>
          Konfigurasi & Data
        </h2>
        <p className="text-xs text-slate-500 ml-8">
          Upload data murid dan atur parameter ujian.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Input Section */}
        <div className="p-4 glass-card rounded-xl border border-white/80 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Sumber Data
            </label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg hover:shadow-xs transition-all flex items-center shadow-sm"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Template
            </button>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <div className="relative w-full group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center w-full h-11 px-4 bg-white/70 border border-indigo-200/80 border-dashed rounded-xl text-sm text-slate-600 group-hover:bg-white group-hover:border-indigo-400 backdrop-blur-sm transition-all duration-200 shadow-xs">
                <Upload className="w-4 h-4 mr-2 text-indigo-400 group-hover:text-indigo-600" />
                {fileName ? <span className="text-slate-900 font-medium truncate">{fileName}</span> : "Upload Excel/CSV"}
              </div>
            </div>
            
            <button
              type="button"
              onClick={loadSampleData}
              className="flex items-center justify-center w-full h-9 bg-white/70 hover:bg-white border border-white/90 rounded-xl text-xs font-medium text-slate-700 hover:text-indigo-600 transition-all shadow-xs backdrop-blur-sm"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Gunakan Data Sample
            </button>
          </div>
          
          {rawData.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 backdrop-blur-sm border border-emerald-300/40 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-700 font-medium">
                {rawData.length - 1} data murid siap diproses
              </span>
            </div>
          )}
        </div>

        {/* Parameters Section */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="jenjang" className="block text-xs font-medium text-slate-700">
                Jenjang / Kelas
              </label>
              <div className="relative">
                <select
                  id="jenjang"
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none shadow-xs"
                >
                  <option value="Semua">Semua Jenjang</option>
                  {jenjangOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      Jenjang {opt}
                    </option>
                  ))}
                  {jenjangOptions.length === 0 && (
                    <>
                      <option value="7">Kelas 7</option>
                      <option value="8">Kelas 8</option>
                      <option value="9">Kelas 9</option>
                      <option value="10">Kelas 10</option>
                      <option value="11">Kelas 11</option>
                      <option value="12">Kelas 12</option>
                    </>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="jumlahHari" className="block text-xs font-medium text-slate-700">
                Durasi Ujian (Hari)
              </label>
              <input
                type="number"
                id="jumlahHari"
                min="1"
                value={jumlahHari}
                onChange={(e) => setJumlahHari(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>
          </div>

          {/* Pengaturan Jadwal Hari & Piket Murid */}
          <div className="p-4 glass-card rounded-2xl border border-indigo-200/70 bg-gradient-to-br from-indigo-50/70 via-purple-50/30 to-white/60 space-y-3.5 shadow-xs backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-100/80 text-indigo-700">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-950">
                  Jadwal Ujian & Piket Ruang
                </label>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-200/60">
                {jumlahPiketPerHari} Murid / Hari / Ruang
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label htmlFor="hariMulai" className="block text-xs font-medium text-slate-700">
                  Ujian Dimulai Hari
                </label>
                <div className="relative">
                  <select
                    id="hariMulai"
                    value={hariMulai}
                    onChange={(e) => setHariMulai(e.target.value)}
                    className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none shadow-xs font-medium text-slate-800"
                  >
                    {HARI_DALAM_SEMINGGU.map((hari) => (
                      <option key={hari} value={hari}>
                        {hari}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="jumlahPiket" className="block text-xs font-medium text-slate-700">
                  Murid Piket per Ruang
                </label>
                <input
                  type="number"
                  id="jumlahPiket"
                  min="1"
                  max="30"
                  value={jumlahPiketPerHari}
                  onChange={(e) => setJumlahPiketPerHari(parseInt(e.target.value) || 6)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>
            </div>

            {/* Hari Libur Sekolah */}
            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                  Hari Libur Sekolah (Dilewati)
                </label>
                <span className="text-[10px] text-slate-400">Klik hari untuk libur</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {HARI_DALAM_SEMINGGU.map((hari) => {
                  const isLibur = hariLibur.includes(hari);
                  return (
                    <button
                      key={hari}
                      type="button"
                      onClick={() => toggleHariLibur(hari)}
                      className={cn(
                        "px-2.5 py-1 text-xs font-medium rounded-lg transition-all flex items-center gap-1 cursor-pointer",
                        isLibur
                          ? "bg-rose-500 text-white shadow-xs shadow-rose-500/30 ring-1 ring-rose-600"
                          : "bg-white/80 text-slate-600 border border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                      )}
                    >
                      {isLibur && <Check className="w-3 h-3" />}
                      <span>{hari}</span>
                      {isLibur && <span className="text-[9px] opacity-85">(Libur)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview Hari Ujian Terhitung */}
            <div className="p-2.5 bg-white/80 rounded-xl border border-indigo-100 text-xs text-slate-700 space-y-1 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-900 text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Urutan Hari Ujian ({activeExamDays.length} Hari Aktif):</span>
              </div>
              <div className="flex flex-wrap gap-1 text-[11px]">
                {activeExamDays.map((hari, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50/90 border border-indigo-200/70 text-indigo-800 font-semibold text-[10px]"
                  >
                    H-{idx + 1}: {hari}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 pt-0.5">
                Setiap murid di ruang dijadwalkan piket 1× selama pekan ujian (langsung mencantumkan nama hari).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startNomorPeserta" className="block text-xs font-medium text-slate-700">
                Nomor Peserta Awal
              </label>
              <input
                type="number"
                id="startNomorPeserta"
                min="1"
                value={startNomorPeserta}
                onChange={(e) => setStartNomorPeserta(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="Contoh: 73431"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incrementNomorPeserta" className="block text-xs font-medium text-slate-700">
                Selisih Nomor
              </label>
              <input
                type="number"
                id="incrementNomorPeserta"
                min="1"
                value={incrementNomorPeserta}
                onChange={(e) => setIncrementNomorPeserta(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                placeholder="Contoh: 1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="jumlahRuang" className="block text-xs font-medium text-slate-700">
                Jumlah Ruang
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Maksimal 50 ruang</span>
            </div>
            <input
              type="number"
              id="jumlahRuang"
              min="1"
              max="50"
              value={jumlahRuang}
              onChange={(e) => setJumlahRuang(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
            />
            
            {/* Room Name Editor */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                NAMA RUANG (Sesuai Kebutuhan)
              </label>
              <div className="grid grid-cols-2 gap-2 glass-card p-3 rounded-xl border border-white/80 shadow-xs">
                {namaRuang.map((nama, idx) => (
                  <div key={idx} className="flex items-center group">
                    <span className="text-[10px] text-slate-400 w-5 font-mono">{idx + 1}.</span>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => handleRoomNameChange(idx, e.target.value)}
                      className="w-full h-7 px-2 text-xs border border-slate-200/80 rounded-lg focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-white/80 transition-all shadow-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="block text-xs font-medium text-slate-700">
              Mode Pengaturan Gender
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-xl border transition-all", modeGender === "campur" ? "border-indigo-500/80 bg-indigo-50/70 backdrop-blur-sm shadow-xs ring-1 ring-indigo-500/30" : "glass-card border-white/80 bg-white/50 hover:bg-white/80 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="campur"
                  checked={modeGender === "campur"}
                  onChange={() => setModeGender("campur")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Campur Bebas</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Laki-laki dan perempuan dicampur secara acak.</span>
                </div>
              </label>

              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-xl border transition-all", modeGender === "pisah" ? "border-indigo-500/80 bg-indigo-50/70 backdrop-blur-sm shadow-xs ring-1 ring-indigo-500/30" : "glass-card border-white/80 bg-white/50 hover:bg-white/80 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="pisah"
                  checked={modeGender === "pisah"}
                  onChange={() => setModeGender("pisah")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Pisah Ruang (L/P)</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Ruang ujian dipisah antara laki-laki dan perempuan.</span>
                </div>
              </label>

              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-xl border transition-all", modeGender === "seling" ? "border-indigo-500/80 bg-indigo-50/70 backdrop-blur-sm shadow-xs ring-1 ring-indigo-500/30" : "glass-card border-white/80 bg-white/50 hover:bg-white/80 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="seling"
                  checked={modeGender === "seling"}
                  onChange={() => setModeGender("seling")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">Seling Tempat Duduk</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Jumlah L dan P seimbang di tiap ruang, duduk berselang-seling.</span>
                </div>
              </label>
            </div>

            {(modeGender === "pisah" || modeGender === "seling") && (
              <div className="ml-4 mt-2 p-3 bg-indigo-50/60 backdrop-blur-md rounded-xl border border-indigo-200/60 shadow-xs animate-in slide-in-from-top-2">
                <label className="block text-xs font-semibold text-indigo-900 mb-1.5">
                  {modeGender === "pisah" ? "Urutan Ruang" : "Urutan Duduk"}
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderOrder"
                      value="L-P"
                      checked={genderOrder === "L-P"}
                      onChange={() => setGenderOrder("L-P")}
                      className="text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      {modeGender === "pisah" ? "Laki-laki dulu (R.01 dst)" : "Laki-laki dulu (L, P, L, P...)"}
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="genderOrder"
                      value="P-L"
                      checked={genderOrder === "P-L"}
                      onChange={() => setGenderOrder("P-L")}
                      className="text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span className="text-xs text-slate-700 font-medium">
                      {modeGender === "pisah" ? "Perempuan dulu (R.01 dst)" : "Perempuan dulu (P, L, P, L...)"}
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || rawData.length === 0}
          className={cn(
            "w-full flex items-center justify-center h-12 rounded-xl text-white font-semibold transition-all shadow-lg relative overflow-hidden active:scale-[0.98]",
            isProcessing || rawData.length === 0
              ? "bg-slate-300 cursor-not-allowed shadow-none"
              : "bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 shadow-indigo-500/25"
          )}
        >
          {isProcessing ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Memproses...</span>
            </div>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Proses Acak Jadwal
            </>
          )}
        </button>
      </form>
    </div>
  );
}
