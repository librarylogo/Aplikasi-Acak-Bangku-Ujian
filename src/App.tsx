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
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src="https://lh3.googleusercontent.com/a/ACg8ocKIyOSmUCibkuiYO0w4wo1Pl54QsoKUQBc3jfSxADJZEfuybRTZ=s288-c-no" 
              alt="Logo Sekolah" 
              className="w-12 h-12 rounded-full object-cover border border-slate-100 shadow-sm"
              referrerPolicy="no-referrer"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                Aplikasi Acak Bangku Ujian
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Sistem Penjadwalan & Alokasi Ruang Otomatis
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-slate-700">Versi 2.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-4 space-y-6">
            <ConfigForm onProcess={handleProcess} isProcessing={isProcessing} />
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="mt-0.5 font-bold">⚠️</div>
                <div>
                  <p className="font-semibold">Gagal Memproses</p>
                  <p>{error}</p>
                </div>
              </div>
            )}

            {/* Instructions / Help */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 text-sm text-blue-800 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Panduan Singkat
              </h3>
              <ul className="list-disc list-inside space-y-1 ml-1 opacity-90">
                <li>Upload file Excel (.xlsx) atau CSV.</li>
                <li>Pastikan ada kolom: <strong>NISN, NAMA, KELAS, JENJANG, JK</strong>.</li>
                <li>Pilih opsi filter dan jumlah ruang.</li>
                <li>Sesuaikan nama ruang jika diperlukan.</li>
                <li>Klik "Proses" untuk melihat hasil.</li>
                <li>Download hasil dalam format Excel.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-8">
            {result ? (
              <div className="h-[calc(100vh-12rem)] min-h-[500px]">
                <ResultTable headers={result.headers} data={result.data} />
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-white rounded-xl border border-dashed border-slate-300 text-slate-400 p-8 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <LayoutGrid className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Belum ada data jadwal
                </h3>
                <p className="max-w-xs mx-auto">
                  Silakan upload data murid dan klik tombol proses untuk membuat jadwal ujian.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="bg-white border-t border-slate-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} Aplikasi Acak Bangku Ujian | Agung Susanto, S.P.d</p>
        </div>
      </footer>
    </div>
  );
}
