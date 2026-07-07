"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAppStore } from "@/store/useAppStore";

interface BulkUploaderProps {
  tableName: string;
  expectedColumns?: string[];
  title?: string;
  onSuccess?: () => void;
}

export function BulkUploader({ tableName, expectedColumns, title = "Importar Excel", onSuccess }: BulkUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { userRol } = useAppStore();
  
  // Solo ADMIN o SUPERADMIN pueden ver esto
  if (userRol !== 'ADMIN' && userRol !== 'SUPERADMIN') return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(null);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        const jsonData = XLSX.utils.sheet_to_json(ws, { defval: "" });
        if (jsonData.length > 0) {
          const cols = Object.keys(jsonData[0] as object);
          
          if (expectedColumns && expectedColumns.length > 0) {
            const missingCols = expectedColumns.filter(c => !cols.includes(c));
            if (missingCols.length > 0) {
              setError(`Faltan columnas requeridas: ${missingCols.join(", ")}`);
              setLoading(false);
              return;
            }
          }
          
          setHeaders(cols);
          setData(jsonData);
        } else {
          setError("El archivo está vacío.");
        }
      } catch (err: any) {
        setError("Error leyendo el archivo: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Error al leer el archivo.");
      setLoading(false);
    };
    
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImport = async () => {
    if (data.length === 0) return;
    
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    try {
      // Chunking if data is too large (e.g. 500 at a time)
      const chunkSize = 500;
      let inserted = 0;
      
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);
        const { error: insertError } = await supabase.from(tableName).insert(chunk);
        if (insertError) throw insertError;
        inserted += chunk.length;
      }
      
      setSuccess(`Se importaron ${inserted} registros correctamente.`);
      setData([]);
      if (onSuccess) onSuccess();
      
      // Auto close after 2 seconds
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || "Error desconocido al importar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm text-sm font-medium transition-colors"
      >
        <Upload className="w-4 h-4" />
        {title}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Carga Masiva: {tableName}</h3>
                <p className="text-sm text-slate-500 mt-1">Sube un archivo Excel (.xlsx) o CSV para importar datos rápidamente.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-auto flex flex-col gap-6">
              {!data.length ? (
                <div 
                  className="border-2 border-dashed border-slate-300 rounded-xl p-12 flex flex-col items-center justify-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {loading ? (
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8" />
                      </div>
                      <p className="text-lg font-medium text-slate-700">Haz click para seleccionar archivo</p>
                      <p className="text-sm text-slate-500 mt-1">Soporta .xlsx, .csv</p>
                      {expectedColumns && (
                        <div className="mt-4 text-xs text-slate-400 max-w-md text-center">
                          Columnas esperadas: {expectedColumns.join(", ")}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col h-full border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-medium text-slate-700">{data.length} registros detectados</span>
                    <button 
                      onClick={() => setData([])}
                      className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                    >
                      Cancelar archivo
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          {headers.map((h, i) => (
                            <th key={i} className="px-4 py-3 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 5).map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                            {headers.map((h, j) => (
                              <td key={j} className="px-4 py-3 whitespace-nowrap text-slate-600 truncate max-w-[200px]">
                                {String(row[h] || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.length > 5 && (
                    <div className="p-3 text-center text-sm text-slate-500 bg-slate-50 border-t border-slate-200">
                      Mostrando 5 de {data.length} registros...
                    </div>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-lg flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-medium">{success}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                disabled={loading}
              >
                Cerrar
              </button>
              <button
                onClick={handleImport}
                disabled={data.length === 0 || loading}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                Confirmar Importación
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
