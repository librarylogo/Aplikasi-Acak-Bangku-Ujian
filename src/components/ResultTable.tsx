import React, { useState } from "react";
import { Download, Table as TableIcon, Users, CalendarDays, Printer, Search, Sparkles, CheckCircle2 } from "lucide-react";
import * as XLSX from "xlsx";
import { RoomSummary, JadwalPiketPerRuang } from "@/lib/randomizer";
import { cn } from "@/lib/utils";

interface ResultTableProps {
  headers: string[];
  data: (string | number)[][];
  jenjang: string;
  roomSummary?: RoomSummary[];
  jadwalPiket?: JadwalPiketPerRuang[];
  examDays?: string[];
}

export function ResultTable({
  headers,
  data,
  jenjang,
  roomSummary,
  jadwalPiket = [],
  examDays = [],
}: ResultTableProps) {
  const [activeTab, setActiveTab] = useState<"siswa" | "piket">("siswa");
  const [selectedRuangFilter, setSelectedRuangFilter] = useState<string>("semua");
  const [searchQuery, setSearchQuery] = useState("");

  if (!data || data.length === 0) return null;

  // Filter student data
  const filteredData = data.filter((row) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return row.some((cell) => String(cell).toLowerCase().includes(q));
  });

  // Export Excel with 2 sheets: Jadwal Ujian & Jadwal Piket
  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Jadwal Ujian
    const wsUjian = XLSX.utils.aoa_to_sheet([headers, ...data]);
    XLSX.utils.book_append_sheet(wb, wsUjian, "Jadwal Ujian");

    // Sheet 2: Jadwal Piket
    if (jadwalPiket && jadwalPiket.length > 0) {
      const piketRows: (string | number)[][] = [
        ["RUANG", "HARI PIKET", "HARI KE", "NO URUT", "NO. PESERTA", "NAMA MURID", "KELAS", "JK"],
      ];

      jadwalPiket.forEach((ruang) => {
        ruang.jadwalHari.forEach((hariObj) => {
          hariObj.murid.forEach((m, idx) => {
            piketRows.push([
              ruang.namaRuang,
              hariObj.hari,
              hariObj.urutanHariKe,
              idx + 1,
              m.nomorPeserta || "-",
              m.nama,
              m.kelas,
              m.jk,
            ]);
          });
        });
      });

      const wsPiket = XLSX.utils.aoa_to_sheet(piketRows);
      XLSX.utils.book_append_sheet(wb, wsPiket, "Jadwal Piket");
    }

    XLSX.writeFile(wb, `Rekap_Jadwal_Ujian_dan_Piket_Jenjang_${jenjang}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  // Find column indices
  const idxHariPiket = headers.indexOf("HARI PIKET");
  const idxRuangPiket = headers.indexOf("RUANG PIKET");
  const idxJK = headers.indexOf("JK");

  // Filtered Piket Ruang
  const displayedJadwalPiket =
    selectedRuangFilter === "semua"
      ? jadwalPiket
      : jadwalPiket.filter((r) => r.namaRuang === selectedRuangFilter);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      {/* Top Header & Navigation Tabs */}
      <div className="p-4 border-b border-white/70 flex flex-wrap gap-3 items-center justify-between bg-white/75 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setActiveTab("siswa")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                activeTab === "siswa"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Daftar Siswa & Bangku</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("piket")}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative",
                activeTab === "piket"
                  ? "bg-white text-indigo-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
              <span>Jadwal Piket Ruang</span>
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "siswa" && (
            <div className="relative">
              <input
                type="text"
                placeholder="Cari siswa/kelas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 h-9 pl-8 pr-3 text-xs rounded-xl border border-slate-200/80 bg-white/80 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          )}

          {activeTab === "piket" && (
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center px-3.5 py-2 bg-white/80 hover:bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 transition-all shadow-xs hover:border-slate-300"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Cetak Piket
            </button>
          )}

          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
            title="Download Excel dengan 2 Sheet (Jadwal Ujian & Jadwal Piket)"
          >
            <Download className="w-3.5 h-3.5 mr-2" />
            Export Excel (Lengkap)
          </button>
        </div>
      </div>

      {/* TAB 1: Daftar Siswa & Bangku */}
      {activeTab === "siswa" && (
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto scrollbar-thin">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="text-xs text-slate-500 uppercase bg-white/95 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
                <tr>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                        "px-5 py-3.5 font-semibold whitespace-nowrap tracking-wider",
                        h === "HARI PIKET" || h === "RUANG PIKET"
                          ? "bg-indigo-50/80 text-indigo-900 border-x border-indigo-100"
                          : ""
                      )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80 bg-white/40 backdrop-blur-sm">
                {filteredData.map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                    {row.map((cell, j) => {
                      // Hari Piket Badge
                      if (j === idxHariPiket) {
                        return (
                          <td key={j} className="px-5 py-3 whitespace-nowrap bg-indigo-50/30 font-medium">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200/80">
                              <CalendarDays className="w-3 h-3 text-indigo-600" />
                              {cell}
                            </span>
                          </td>
                        );
                      }
                      // Ruang Piket Badge
                      if (j === idxRuangPiket) {
                        return (
                          <td key={j} className="px-5 py-3 whitespace-nowrap bg-indigo-50/30 font-medium">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-white border border-indigo-200 text-indigo-700 shadow-2xs">
                              {cell}
                            </span>
                          </td>
                        );
                      }
                      // JK Badge
                      if (j === idxJK) {
                        const isL = String(cell).toUpperCase() === "L";
                        return (
                          <td key={j} className="px-5 py-3 whitespace-nowrap font-semibold">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-md text-xs",
                                isL
                                  ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                                  : "bg-pink-50 text-pink-700 border border-pink-200/60"
                              )}
                            >
                              {cell}
                            </span>
                          </td>
                        );
                      }
                      return (
                        <td
                          key={j}
                          className="px-5 py-3 whitespace-nowrap text-slate-600 group-hover:text-slate-900"
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {roomSummary && (
            <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-white/70 bg-white/40 backdrop-blur-xl overflow-y-auto p-4 space-y-4 scrollbar-thin shrink-0">
              <div className="flex items-center gap-2 mb-2 text-slate-700">
                <Users className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider">
                  Rekapitulasi Ruang
                </h4>
              </div>
              {roomSummary.map((room) => (
                <div
                  key={room.name}
                  className="glass-card bg-white/80 hover:bg-white p-3.5 rounded-xl border border-white/90 shadow-xs hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm text-slate-800">{room.name}</span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-full border border-indigo-100">
                      {room.count} Murid
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1.5 rounded-lg border border-blue-100/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <span className="text-blue-700 font-medium">L: {room.genderCounts.L}</span>
                    </div>
                    <div className="flex items-center gap-1.5 bg-pink-50/80 px-2.5 py-1.5 rounded-lg border border-pink-100/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                      <span className="text-pink-700 font-medium">P: {room.genderCounts.P}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Jadwal Piket Ruangan */}
      {activeTab === "piket" && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin bg-slate-50/40">
          {/* Room Filter Chips */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 mr-1">Filter Ruang:</span>
            <button
              type="button"
              onClick={() => setSelectedRuangFilter("semua")}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                selectedRuangFilter === "semua"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white"
              )}
            >
              Semua Ruang ({jadwalPiket.length})
            </button>
            {jadwalPiket.map((r) => (
              <button
                key={r.namaRuang}
                type="button"
                onClick={() => setSelectedRuangFilter(r.namaRuang)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer",
                  selectedRuangFilter === r.namaRuang
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white/80 text-slate-700 border border-slate-200/80 hover:bg-white"
                )}
              >
                {r.namaRuang}
              </button>
            ))}
          </div>

          {/* Cards for each room */}
          <div className="space-y-6">
            {displayedJadwalPiket.map((ruang) => (
              <div
                key={ruang.namaRuang}
                className="glass-panel bg-white/85 rounded-2xl border border-white/90 shadow-md p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-200/70 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                      {ruang.namaRuang.replace("R.", "")}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Jadwal Piket Ruang {ruang.namaRuang}
                      </h4>
                      <p className="text-xs text-slate-500">
                        1 Murid piket 1× selama pekan ujian (6 Murid per Hari)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Siap Ditempel / Cetak
                  </span>
                </div>

                {/* Grid of Days */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {ruang.jadwalHari.map((hariObj) => (
                    <div
                      key={hariObj.hari}
                      className="bg-white/90 rounded-xl border border-slate-200/80 p-3.5 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-sm font-bold text-slate-800">
                            Hari {hariObj.hari}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            (H-{hariObj.urutanHariKe})
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {hariObj.murid.length} Murid
                        </span>
                      </div>

                      {hariObj.murid.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2 text-center">
                          Tidak ada murid piket
                        </p>
                      ) : (
                        <ul className="space-y-1.5">
                          {hariObj.murid.map((m, mIdx) => (
                            <li
                              key={mIdx}
                              className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50/70 hover:bg-indigo-50/40 text-xs transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 text-center font-mono font-bold text-slate-400 text-[10px]">
                                  {mIdx + 1}.
                                </span>
                                <span className="font-semibold text-slate-800 truncate" title={m.nama}>
                                  {m.nama}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-medium text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                  {m.kelas}
                                </span>
                                <span
                                  className={cn(
                                    "text-[9px] font-bold px-1.5 py-0.2 rounded",
                                    m.jk.toUpperCase() === "L"
                                      ? "text-blue-700 bg-blue-50"
                                      : "text-pink-700 bg-pink-50"
                                  )}
                                >
                                  {m.jk}
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer count indicator */}
      <div className="p-3 border-t border-white/70 bg-white/60 backdrop-blur-md text-[11px] text-slate-500 text-center font-medium flex items-center justify-between px-6">
        <span>
          Menampilkan {filteredData.length} baris data siswa {searchQuery && `(Filter "${searchQuery}")`}
        </span>
        <span className="text-indigo-600 font-semibold">
          Jadwal Piket: {jadwalPiket.length} Ruang • 6 Murid/Hari
        </span>
      </div>
    </div>
  );
}

