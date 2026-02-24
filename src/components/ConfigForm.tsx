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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Konfigurasi & Data
        </h2>
        <p className="text-sm text-slate-500">
          Upload data murid (Excel/CSV) dan atur parameter ujian.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Data Input Section */}
        <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-slate-700">
              Sumber Data Murid
            </label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center font-medium"
            >
              <Download className="w-3 h-3 mr-1" />
              Download Template
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="flex items-center justify-center w-full h-10 px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                <Upload className="w-4 h-4 mr-2" />
                {fileName ? fileName : "Upload Excel/CSV"}
              </div>
            </div>
            
            <button
              type="button"
              onClick={loadSampleData}
              className="flex items-center justify-center px-4 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Gunakan Sample
            </button>
          </div>
          
          {rawData.length > 0 && (
            <div className="text-xs text-green-600 font-medium flex items-center">
              ✓ {rawData.length - 1} data murid terdeteksi
            </div>
          )}
        </div>

        {/* Parameters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="jenjang" className="block text-sm font-medium text-slate-700">
              Jenjang / Kelas
            </label>
            <select
              id="jenjang"
              value={jenjang}
              onChange={(e) => setJenjang(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          </div>

          <div className="space-y-2">
            <label htmlFor="jumlahHari" className="block text-sm font-medium text-slate-700">
              Jumlah Hari Ujian
            </label>
            <input
              type="number"
              id="jumlahHari"
              min="1"
              value={jumlahHari}
              onChange={(e) => setJumlahHari(parseInt(e.target.value) || 1)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label htmlFor="jumlahRuang" className="block text-sm font-medium text-slate-700">
              Jumlah Ruang
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                id="jumlahRuang"
                min="1"
                max="50"
                value={jumlahRuang}
                onChange={(e) => setJumlahRuang(parseInt(e.target.value) || 1)}
                className="w-32 h-10 px-3 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-500">
                Sesuaikan nama ruang di bawah ini:
              </span>
            </div>
            
            {/* Room Name Editor */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-md border border-slate-200 max-h-48 overflow-y-auto">
              {namaRuang.map((nama, idx) => (
                <div key={idx} className="flex items-center">
                  <span className="text-xs text-slate-400 w-6">{idx + 1}.</span>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => handleRoomNameChange(idx, e.target.value)}
                    className="w-full h-8 px-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-end pb-2 sm:col-span-2">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={pisahGender}
                  onChange={(e) => setPisahGender(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                Pisah Gender (L/P) - <span className="text-slate-500 font-normal">Ruang Laki-laki & Perempuan dipisah</span>
              </span>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing || rawData.length === 0}
          className={cn(
            "w-full flex items-center justify-center h-12 rounded-lg text-white font-medium transition-all shadow-sm",
            isProcessing || rawData.length === 0
              ? "bg-slate-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-[0.98]"
          )}
        >
          {isProcessing ? (
            "Memproses..."
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" />
              Proses Acak Jadwal
            </>
          )}
        </button>
      </form>
    </div>
  );
}
