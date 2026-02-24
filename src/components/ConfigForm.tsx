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
  const [pisahGender, setPisahGender] = useState(false);
  const [jumlahHari, setJumlahHari] = useState(6);
  const [jenjang, setJenjang] = useState("Semua");
  const [jenjangOptions, setJenjangOptions] = useState<string[]>([]);
  const [jumlahRuang, setJumlahRuang] = useState(5);
  const [namaRuang, setNamaRuang] = useState<string[]>([]);
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
      pisahGender,
      jumlahHari,
      jenjang,
      jumlahRuang,
      namaRuang,
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
              className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center font-medium transition-colors"
            >
              <Download className="w-3 h-3 mr-1" />
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
                Nama Ruang
              </label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50/50 p-3 rounded-lg border border-gray-200/60 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
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

          <div className="pt-2">
            <label className="flex items-start space-x-3 cursor-pointer group p-3 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
              <div className="relative mt-0.5">
                <input
                  type="checkbox"
                  checked={pisahGender}
                  onChange={(e) => setPisahGender(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-indigo-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </div>
              <div className="flex-1">
                <span className="block text-sm font-medium text-gray-700 group-hover:text-indigo-900">
                  Pisah Gender (L/P)
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  Ruang ujian akan dipisahkan antara laki-laki dan perempuan.
                </span>
              </div>
            </label>
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
