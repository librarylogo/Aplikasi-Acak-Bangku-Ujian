import React, { useState } from "react";
import { ConfigForm } from "@/components/ConfigForm";
import { ResultTable } from "@/components/ResultTable";
import { processRandomization, RandomizerResult } from "@/lib/randomizer";
import { LayoutGrid, GraduationCap, ArrowUp, Sparkles } from "lucide-react";

export default function App() {
  const [result, setResult] = useState<RandomizerResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-800 flex flex-col relative overflow-x-hidden">
      {/* Ambient Glassmorphism Luminous Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl animate-pulse duration-1000" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-purple-300/25 rounded-full blur-3xl" />
        <div className="absolute top-2/3 left-1/6 w-[30rem] h-[30rem] bg-sky-300/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-pink-200/25 rounded-full blur-3xl" />
      </div>

      {/* Header with Glassmorphism */}
      <header className="glass-panel sticky top-0 z-40 border-b border-white/60 bg-white/75 backdrop-blur-xl shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-40 group-hover:opacity-100 transition duration-500 blur-sm"></div>
              <img 
                src="https://lh3.googleusercontent.com/a/ACg8ocKIyOSmUCibkuiYO0w4wo1Pl54QsoKUQBc3jfSxADJZEfuybRTZ=s288-c-no" 
                alt="Logo Sekolah" 
                className="relative w-10 h-10 rounded-full object-cover border-2 border-white/90 shadow-md backdrop-blur-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
                  Aplikasi Acak Bangku Ujian
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50/80 px-2 py-0.5 rounded-full border border-indigo-200/60">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Glass UI
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                Sistem Penjadwalan Otomatis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/80 shadow-xs">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Versi 2.0</span>
          </div>
        </div>
      </header>

      <main className="max-w-[95%] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          {/* Left Column: Configuration */}
          <div className="lg:col-span-3 space-y-6 sticky top-24">
            <ConfigForm onProcess={handleProcess} isProcessing={isProcessing} />
            
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50/80 backdrop-blur-md border border-red-200/80 rounded-2xl text-red-600 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="mt-0.5 font-bold">⚠️</div>
                <div>
                  <p className="font-semibold">Gagal Memproses</p>
                  <p className="opacity-90 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* Instructions / Help */}
            <div className="glass-card rounded-2xl p-5 border border-indigo-200/50 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-white/40 shadow-xs space-y-3 backdrop-blur-xl">
              <h3 className="font-semibold flex items-center gap-2 text-indigo-900 text-sm">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                Panduan Singkat
              </h3>
              <ul className="space-y-2 ml-1 text-slate-600 text-xs leading-relaxed">
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Upload file Excel (.xlsx) atau CSV dengan kolom wajib: <strong>NISN, NAMA, KELAS, JENJANG, JK</strong>.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Pilih filter jenjang dan tentukan jumlah ruang ujian.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Sesuaikan nama ruang jika diperlukan.</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Atur hari mulai ujian, hari libur (dilewati), dan jumlah murid piket (6 murid/hari).</span>
                </li>
                <li className="flex gap-2 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>Klik &quot;Proses Acak Jadwal&quot; dan download hasil Excel (lengkap Sheet Ujian &amp; Sheet Jadwal Piket).</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-9 w-full min-w-0 h-full flex flex-col">
            {result ? (
              <div className="flex-1 min-h-[600px] rounded-2xl overflow-hidden glass-panel border border-white/70 shadow-xl shadow-indigo-950/5 flex flex-col">
                <ResultTable 
                  headers={result.headers} 
                  data={result.data} 
                  jenjang={result.jenjang} 
                  roomSummary={result.roomSummary}
                  jadwalPiket={result.jadwalPiket}
                  examDays={result.examDays}
                />
              </div>
            ) : (
              <div className="h-full min-h-[500px] flex flex-col items-center justify-center glass-card bg-white/50 backdrop-blur-xl rounded-2xl border-2 border-dashed border-indigo-200/70 text-slate-400 p-8 text-center shadow-xs">
                <div className="w-20 h-20 bg-white/80 backdrop-blur-md rounded-2xl border border-white/90 flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <LayoutGrid className="w-10 h-10 text-indigo-300" />
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  Belum ada data jadwal
                </h3>
                <p className="max-w-xs mx-auto text-sm text-slate-500 leading-relaxed">
                  Silakan upload data murid di panel kiri dan klik tombol proses untuk membuat jadwal ujian.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer with Glassmorphism */}
      <footer className="glass-card border-t border-white/60 py-8 mt-12 bg-white/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-slate-600 font-medium">
            &copy; {new Date().getFullYear()} Aplikasi Acak Bangku Ujian
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Agung Susanto, S.Pd.
          </p>
        </div>
      </footer>

      {/* Floating Back to Top Button (Warna Kontras & Kilauan Cahaya Mengitari) */}
      <div className="fixed bottom-6 right-6 z-50 group flex items-center justify-center">
        {/* Pulsing Light Aura Bloom */}
        <div 
          aria-hidden="true" 
          className="absolute -inset-2.5 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 animate-pulse-glow blur-md opacity-60 group-hover:opacity-85 pointer-events-none transition-opacity duration-300" 
        />

        {/* Orbiting Rotating Halo of Shimmering Light */}
        <div 
          aria-hidden="true" 
          className="absolute -inset-1.5 rounded-full bg-[conic-gradient(from_0deg,#ffffff,#fbbf24,#f97316,#ec4899,#8b5cf6,#06b6d4,#f59e0b,#ffffff)] animate-spin-glow blur-sm opacity-90 group-hover:opacity-100 group-hover:blur-md pointer-events-none transition-all duration-300" 
        />

        {/* High-Contrast Floating Action Button */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
          className="relative flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 hover:from-amber-400 hover:via-orange-500 hover:to-rose-500 text-white shadow-xl shadow-orange-500/40 hover:shadow-orange-500/60 border-2 border-white/70 hover:border-white transition-all duration-300 hover:-translate-y-1 hover:scale-105 active:scale-95 active:translate-y-0 cursor-pointer overflow-hidden"
        >
          {/* Subtle Top Specular Glass Reflection */}
          <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-transparent rounded-t-full pointer-events-none" />
          
          <ArrowUp className="w-5 h-5 stroke-[2.5] transition-transform duration-200 group-hover:-translate-y-0.5 drop-shadow-sm relative z-10" />
        </button>
      </div>
    </div>
  );
}

