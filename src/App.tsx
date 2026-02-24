import React, { useState } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { ResultTable } from "@/components/ResultTable";
import { processRandomization, RandomizerResult } from "@/lib/randomizer";
import { LayoutGrid, GraduationCap } from "lucide-react";

export default function App() {
  const [result, setResult] = useState<RandomizerResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = async (rawData: any[][], options: any) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    // Simulate async processing for better UX
    setTimeout(() => {
      try {
        const res = processRandomization(rawData, options);
        setResult(res);
      } catch (err: any) {
        setError(err.message || "Terjadi kesalahan saat memproses data.");
      } finally {
        setIsProcessing(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-700 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-50 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-30 group-hover:opacity-100 transition duration-500 blur-sm"></div>
              <img 
                src="https://lh3.googleusercontent.com/a/ACg8ocKIyOSmUCibkuiYO0w4wo1Pl54QsoKUQBc3jfSxADJZEfuybRTZ=s288-c-no" 
                alt="Logo Sekolah" 
                className="relative w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-tight">
                Aplikasi Acak Bangku Ujian
              </h1>
              <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                Sistem Penjadwalan Otomatis
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-600 bg-gray-100/50 px-3 py-1.5 rounded-full border border-gray-200/60">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Versi 2.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-3 space-y-6 sticky top-24">
            <ConfigForm onProcess={handleProcess} isProcessing={isProcessing} />
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="mt-0.5 font-bold">⚠️</div>
                <div>
                  <p className="font-semibold">Gagal Memproses</p>
                  <p className="opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Instructions / Help */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 text-sm text-indigo-900 space-y-3 shadow-sm">
              <h3 className="font-semibold flex items-center gap-2 text-indigo-700">
                <LayoutGrid className="w-4 h-4" />
                Panduan Singkat
              </h3>
              <ul className="space-y-2 ml-1 opacity-80 text-xs leading-relaxed">
                <li className="flex gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  Upload file Excel (.xlsx) atau CSV dengan kolom wajib: <strong>NISN, NAMA, KELAS, JENJANG, JK</strong>.
                </li>
                <li className="flex gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  Pilih filter jenjang dan tentukan jumlah ruang ujian.
                </li>
                <li className="flex gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  Sesuaikan nama ruang jika diperlukan.
                </li>
                <li className="flex gap-2">
                  <span className="w-1 h-1 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                  Klik "Proses" dan download hasil dalam format Excel.
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-9 w-full min-w-0 h-full flex flex-col">
            {result ? (
              <div className="flex-1 min-h-[600px] rounded-2xl overflow-hidden shadow-lg border border-gray-200/60 bg-white flex flex-col">
                <ResultTable headers={result.headers} data={result.data} jenjang={result.jenjang} />
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-300 text-gray-400 p-8 text-center shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <LayoutGrid className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Belum ada data jadwal
                </h3>
                <p className="max-w-xs mx-auto text-sm text-gray-500">
                  Silakan upload data murid dan klik tombol proses untuk membuat jadwal ujian.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 font-medium">
            &copy; {new Date().getFullYear()} Aplikasi Acak Bangku Ujian
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Agung Susanto, S.Pd.
          </p>
        </div>
      </footer>
    </div>
  );
}
