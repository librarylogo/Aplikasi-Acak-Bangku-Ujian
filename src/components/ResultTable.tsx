import React from "react";
import { Download, Table as TableIcon, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { RoomSummary } from "@/lib/randomizer";

interface ResultTableProps {
  headers: string[];
  data: (string | number)[][];
  jenjang: string;
  roomSummary?: RoomSummary[];
}

export function ResultTable({ headers, data, jenjang, roomSummary }: ResultTableProps) {
  if (!data || data.length === 0) return null;

  const handleExport = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");
    XLSX.writeFile(wb, `Rekap_Acak_Bangku_Jenjang_${jenjang}.xlsx`);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-transparent">
      <div className="p-4 border-b border-white/70 flex items-center justify-between bg-white/70 backdrop-blur-xl">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50/80 border border-indigo-100 rounded-xl">
            <TableIcon className="w-4 h-4 text-indigo-600" />
          </div>
          Hasil Penjadwalan
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          Export Excel
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto scrollbar-thin">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-slate-500 uppercase bg-white/90 sticky top-0 z-10 backdrop-blur-md border-b border-slate-200/80">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="px-6 py-4 font-semibold whitespace-nowrap tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white/40 backdrop-blur-sm">
              {data.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/50 transition-colors group">
                  {row.map((cell, j) => (
                    <td key={j} className="px-6 py-3.5 whitespace-nowrap text-slate-600 group-hover:text-slate-900">
                      {cell}
                    </td>
                  ))}
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
              <div key={room.name} className="glass-card bg-white/80 hover:bg-white p-3.5 rounded-xl border border-white/90 shadow-xs hover:shadow-md transition-all duration-200">
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

      <div className="p-3 border-t border-white/70 bg-white/50 backdrop-blur-md text-[11px] text-slate-400 text-center font-medium uppercase tracking-widest">
        Menampilkan {data.length} baris data
      </div>
    </div>
  );
}
