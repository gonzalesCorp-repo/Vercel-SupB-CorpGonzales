'use client';

import { useState, useEffect } from 'react';
import { Settings, Building, FileText, Plus, Save, Trash2, Link } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';

const supabase = createClient();

interface Emisor {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  estado: string;
}

interface Serie {
  id: string;
  emisor_id: string;
  tipo_comprobante: string;
  serie: string;
  correlativo_actual: number;
  estado: string;
}

interface Sede {
  id: string;
  nombre: string;
}

export default function CajaConfigPage() {
  const [activeTab, setActiveTab] = useState<'emisores' | 'series'>('emisores');
  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [series, setSeries] = useState<Serie[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [emisoresSedes, setEmisoresSedes] = useState<any[]>([]); // relations
  const { showAlert } = useUIStore();

  const loadData = async () => {
    const { data: eData } = await supabase.from('emisores').select('*').order('created_at', { ascending: false });
    if (eData) setEmisores(eData);

    const { data: sData } = await supabase.from('emisores_series').select('*').order('created_at', { ascending: false });
    if (sData) setSeries(sData);

    const { data: sedData } = await supabase.from('sedes').select('*');
    if (sedData) setSedes(sedData);

    const { data: esData } = await supabase.from('emisores_sedes').select('*');
    if (esData) setEmisoresSedes(esData);
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleEmisorSede = async (emisorId: string, sedeId: string, isLinked: boolean) => {
    if (isLinked) {
      // unlink
      await supabase.from('emisores_sedes').delete().match({ emisor_id: emisorId, sede_id: sedeId });
    } else {
      // link
      await supabase.from('emisores_sedes').insert({ emisor_id: emisorId, sede_id: sedeId });
    }
    loadData();
    showAlert('Actualizado', 'success');
  };

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Settings className="w-8 h-8 text-indigo-600 bg-indigo-100 rounded-lg p-1" />
          Configuración de Caja y Cobros
        </h1>
        <p className="text-slate-500 mt-2">Gestiona emisores de facturación, series y correlativos multisede.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('emisores')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'emisores' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Building className="w-4 h-4" /> Emisores y Sedes
          </button>
          <button
            onClick={() => setActiveTab('series')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'series' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <FileText className="w-4 h-4" /> Series de Comprobantes
          </button>
        </div>
      </div>

      {activeTab === 'emisores' && (
        <div className="space-y-6">
          {emisores.map(emisor => (
            <div key={emisor.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{emisor.razon_social}</h3>
                  <p className="text-sm text-slate-500">RUC: {emisor.ruc} • {emisor.nombre_comercial}</p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{emisor.estado}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Link className="w-3 h-3" /> Sedes Habilitadas
                </h4>
                <div className="flex flex-wrap gap-3">
                  {sedes.map(sede => {
                    const isLinked = emisoresSedes.some(es => es.emisor_id === emisor.id && es.sede_id === sede.id);
                    return (
                      <button
                        key={sede.id}
                        onClick={() => toggleEmisorSede(emisor.id, sede.id, isLinked)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${isLinked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                      >
                        {sede.nombre} {isLinked && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
          <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
            <Plus className="w-5 h-5" /> Añadir Nuevo Emisor
          </button>
        </div>
      )}

      {activeTab === 'series' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Emisor</th>
                <th className="p-4 font-bold">Tipo</th>
                <th className="p-4 font-bold">Serie</th>
                <th className="p-4 font-bold">Correlativo Actual</th>
                <th className="p-4 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {series.map(serie => {
                const emi = emisores.find(e => e.id === serie.emisor_id);
                return (
                  <tr key={serie.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-800">{emi?.razon_social || 'Desconocido'}</td>
                    <td className="p-4 text-slate-600">{serie.tipo_comprobante}</td>
                    <td className="p-4 font-bold text-indigo-600">{serie.serie}</td>
                    <td className="p-4 text-slate-600">{serie.correlativo_actual.toString().padStart(6, '0')}</td>
                    <td className="p-4">
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Save className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="p-4 border-t border-slate-200">
            <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
              <Plus className="w-4 h-4" /> Añadir Serie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
