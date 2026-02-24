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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <TableIcon className="w-5 h-5 text-blue-600" />
          Hasil Penjadwalan
        </h3>
        <button
          onClick={handleExport}
          className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Excel
        </button>
      </div>
      
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-4 py-3 font-medium border-b border-slate-200 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
        Menampilkan {data.length} baris data
      </div>
    </div>
  );
}
