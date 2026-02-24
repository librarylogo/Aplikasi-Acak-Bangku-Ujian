import React from "react";
import { Download, Table as TableIcon } from "lucide-react";
import * as XLSX from "xlsx";

interface ResultTableProps {
  headers: string[];
  data: (string | number)[][];
}

export function ResultTable({ headers, data }: ResultTableProps) {
  if (!data || data.length === 0) return null;

  const handleExport = () => {
    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Jadwal Ujian");
    XLSX.writeFile(wb, "Rekap_Jadwal_Ujian.xlsx");
  };

  return (
    <div className="bg-white flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-gray-200/60 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <TableIcon className="w-4 h-4 text-indigo-600" />
          </div>
          Hasil Penjadwalan
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-all shadow-sm hover:shadow-emerald-100 active:scale-[0.98]"
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          Export Excel
        </button>
      </div>
      
      <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-6 py-4 font-semibold border-b border-gray-200 whitespace-nowrap tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                {row.map((cell, j) => (
                  <td key={j} className="px-6 py-3.5 whitespace-nowrap text-gray-600 group-hover:text-gray-900">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-gray-200 bg-gray-50/50 text-[10px] text-gray-400 text-center font-medium uppercase tracking-widest">
        Menampilkan {data.length} baris data
      </div>
    </div>
  );
}
