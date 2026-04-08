import React, { useState, useEffect } from "react";
import { Upload, FileText, Play, RotateCcw, Download, Settings, Users } from "lucide-react";
import { SAMPLE_DATA } from "@/lib/randomizer";
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
  const [jenjang, setJenjang] = useState("Semua");
  const [jenjangOptions, setJenjangOptions] = useState<string[]>([]);
  const [jumlahRuang, setJumlahRuang] = useState(5);
  const [namaRuang, setNamaRuang] = useState<string[]>([]);
  const [startNomorPeserta, setStartNomorPeserta] = useState(1);
  const [incrementNomorPeserta, setIncrementNomorPeserta] = useState(1);
  const [rawData, setRawData] = useState<any[][]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

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
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <Settings className="w-4 h-4 text-indigo-600" />
          </div>
          Konfigurasi & Data
        </h2>
        <p className="text-xs text-gray-500 ml-9">
          Upload data murid dan atur parameter ujian.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Input Section */}
        <div className="p-5 bg-gray-50/50 rounded-xl border border-gray-200/60 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sumber Data
            </label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm flex items-center"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Template
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="relative w-full group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center w-full h-11 px-4 bg-white border border-gray-300 border-dashed rounded-lg text-sm text-gray-600 group-hover:bg-gray-50 group-hover:border-indigo-300 transition-all duration-200">
                <Upload className="w-4 h-4 mr-2 text-gray-400 group-hover:text-indigo-500" />
                {fileName ? <span className="text-gray-900 font-medium truncate">{fileName}</span> : "Upload Excel/CSV"}
              </div>
            </div>
            
            <button
              type="button"
              onClick={loadSampleData}
              className="flex items-center justify-center w-full h-9 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3 mr-1.5" />
              Gunakan Data Sample
            </button>
          </div>
          
          {rawData.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50/50 border border-green-100 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-green-700 font-medium">
                {rawData.length - 1} data murid siap diproses
              </span>
            </div>
          )}
        </div>

        {/* Parameters Section */}
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="jenjang" className="block text-xs font-medium text-gray-700">
                Jenjang / Kelas
              </label>
              <div className="relative">
                <select
                  id="jenjang"
                  value={jenjang}
                  onChange={(e) => setJenjang(e.target.value)}
                  className="w-full h-10 pl-3 pr-8 rounded-lg border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none"
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
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="jumlahHari" className="block text-xs font-medium text-gray-700">
                Durasi Ujian (Hari)
              </label>
              <input
                type="number"
                id="jumlahHari"
                min="1"
                value={jumlahHari}
                onChange={(e) => setJumlahHari(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="startNomorPeserta" className="block text-xs font-medium text-gray-700">
                Nomor Peserta Awal
              </label>
              <input
                type="number"
                id="startNomorPeserta"
                min="1"
                value={startNomorPeserta}
                onChange={(e) => setStartNomorPeserta(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Contoh: 73431"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="incrementNomorPeserta" className="block text-xs font-medium text-gray-700">
                Selisih Nomor Peserta
              </label>
              <input
                type="number"
                id="incrementNomorPeserta"
                min="1"
                value={incrementNomorPeserta}
                onChange={(e) => setIncrementNomorPeserta(parseInt(e.target.value) || 1)}
                className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                placeholder="Contoh: 1"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="jumlahRuang" className="block text-xs font-medium text-gray-700">
                Jumlah Ruang
              </label>
              <span className="text-[10px] text-gray-400">Maksimal 50 ruang</span>
            </div>
            <input
              type="number"
              id="jumlahRuang"
              min="1"
              max="50"
              value={jumlahRuang}
              onChange={(e) => setJumlahRuang(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            
            {/* Room Name Editor */}
            <div className="space-y-2">
              <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                NAMA RUANG (Isikan sesuai dengan nama ruang yang diinginkan)
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-3 rounded-lg border border-gray-200/60">
                {namaRuang.map((nama, idx) => (
                  <div key={idx} className="flex items-center group">
                    <span className="text-[10px] text-gray-400 w-5 font-mono">{idx + 1}.</span>
                    <input
                      type="text"
                      value={nama}
                      onChange={(e) => handleRoomNameChange(idx, e.target.value)}
                      className="w-full h-7 px-2 text-xs border border-gray-200 rounded focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-white transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            <label className="block text-xs font-medium text-gray-700">
              Mode Pengaturan Gender
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all", modeGender === "campur" ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="campur"
                  checked={modeGender === "campur"}
                  onChange={() => setModeGender("campur")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">Campur Bebas</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Laki-laki dan perempuan dicampur secara acak.</span>
                </div>
              </label>

              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all", modeGender === "pisah" ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="pisah"
                  checked={modeGender === "pisah"}
                  onChange={() => setModeGender("pisah")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">Pisah Ruang (L/P)</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Ruang ujian dipisah antara laki-laki dan perempuan.</span>
                </div>
              </label>

              <label className={cn("flex items-start space-x-3 cursor-pointer p-3 rounded-lg border transition-all", modeGender === "seling" ? "border-indigo-500 bg-indigo-50/30" : "border-gray-200 hover:border-indigo-200")}>
                <input
                  type="radio"
                  name="modeGender"
                  value="seling"
                  checked={modeGender === "seling"}
                  onChange={() => setModeGender("seling")}
                  className="mt-0.5 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <div className="flex-1">
                  <span className="block text-sm font-medium text-gray-900">Seling Tempat Duduk</span>
                  <span className="block text-xs text-gray-500 mt-0.5">Jumlah L dan P seimbang di tiap ruang, duduk berselang-seling.</span>
                </div>
              </label>
            </div>

            {(modeGender === "pisah" || modeGender === "seling") && (
              <div className="ml-8 mt-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 animate-in slide-in-from-top-2">
                <label className="block text-xs font-medium text-indigo-900 mb-1.5">
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
                      className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-700">
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
                      className="text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-xs text-gray-700">
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
            "w-full flex items-center justify-center h-12 rounded-xl text-white font-medium transition-all shadow-sm relative overflow-hidden",
            isProcessing || rawData.length === 0
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 hover:shadow-md hover:shadow-indigo-200 active:scale-[0.98]"
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
