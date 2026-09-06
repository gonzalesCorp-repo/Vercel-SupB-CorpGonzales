'use client';

import React, { useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { 
  Zap, Search, RefreshCw, Briefcase, Activity, Users, Calculator, 
  PackageSearch, Sliders, Check 
} from 'lucide-react';
import { CATALOGO_HERRAMIENTAS, HerramientaDefinicion } from '@/services/permisos';
import { AgenteAdmin } from './types';

export interface UsuarioPermisosModalProps {
  isOpen: boolean;
  onClose: () => void;
  agenteDelegando: AgenteAdmin | null;
  herramientasActivas: string[];
  toggleHerramienta: (key: string) => Promise<void>;
  aplicarPreset: (keys: string[]) => Promise<void>;
  loadingHerramientas: boolean;
  savingPreset: boolean;
  herramientaSearch: string;
  setHerramientaSearch: (s: string) => void;
}

export function UsuarioPermisosModal({
  isOpen,
  onClose,
  agenteDelegando,
  herramientasActivas,
  toggleHerramienta,
  aplicarPreset,
  loadingHerramientas,
  savingPreset,
  herramientaSearch,
  setHerramientaSearch
}: UsuarioPermisosModalProps) {
  const PRESETS = [
    {
      id: 'recepcion',
      nombre: '🛎️ Recepcionista',
      desc: 'Workspace Recepción, Agenda, CRM & OATCs',
      keys: ['ws_recepcion', 'crm_agenda', 'crm_clientes', 'crm_oatc_historial', 'ws_caja'],
      color: 'hover:border-indigo-400 bg-indigo-50/40 text-indigo-700'
    },
    {
      id: 'caja',
      nombre: '💵 Workspace Venta (Cajero)',
      desc: 'Punto de Venta, Arqueos & Facturación SUNAT',
      keys: ['ws_caja', 'caja_arqueo', 'caja_reportes', 'ws_recepcion'],
      color: 'hover:border-emerald-400 bg-emerald-50/40 text-emerald-700'
    },
    {
      id: 'lab',
      nombre: '🧪 Workspace Taller (ODI / WMS)',
      desc: 'Despacho de Insumos, Fórmulas & Kardex',
      keys: ['ws_despacho', 'lab_almacen', 'lab_kardex'],
      color: 'hover:border-purple-400 bg-purple-50/40 text-purple-700'
    },
    {
      id: 'jefe',
      nombre: '🎯 Supervisor Piso',
      desc: 'Panel Jefe, WFM Turnos & Comisiones',
      keys: ['jefe_piso_panel', 'wfm_turnos', 'wfm_comisiones', 'ws_recepcion'],
      color: 'hover:border-cyan-400 bg-cyan-50/40 text-cyan-700'
    },
    {
      id: 'full',
      nombre: '⚡ Full Soporte',
      desc: 'Todos los Workspaces y CRM',
      keys: CATALOGO_HERRAMIENTAS.map(h => h.key),
      color: 'hover:border-amber-400 bg-amber-50/40 text-amber-700'
    },
    {
      id: 'clear',
      nombre: '🧹 Limpiar Todo',
      desc: 'Sin herramientas delegadas',
      keys: [],
      color: 'hover:border-rose-400 bg-rose-50/40 text-rose-700'
    }
  ];

  // Herramientas agrupadas por categoría
  const categoriasHerramientas = useMemo(() => {
    const map: Record<string, HerramientaDefinicion[]> = {
      WORKSPACE: [],
      OPERACIONES: [],
      CRM: [],
      FINANZAS: [],
      LOGISTICA: [],
      SISTEMA: []
    };

    CATALOGO_HERRAMIENTAS.forEach(h => {
      const match = !herramientaSearch || 
        h.nombre.toLowerCase().includes(herramientaSearch.toLowerCase()) ||
        h.descripcion.toLowerCase().includes(herramientaSearch.toLowerCase());
      
      if (match && map[h.categoria]) {
        map[h.categoria].push(h);
      }
    });

    return map;
  }, [herramientaSearch]);

  const CATEGORIA_INFO: Record<string, { label: string; icon: any; color: string }> = {
    WORKSPACE: { label: 'Workspaces Principales', icon: Briefcase, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    OPERACIONES: { label: 'Operaciones & Piso', icon: Activity, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    CRM: { label: 'CRM & Front Desk', icon: Users, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    FINANZAS: { label: 'Finanzas & Caja', icon: Calculator, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    LOGISTICA: { label: 'Logística & Almacén', icon: PackageSearch, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    SISTEMA: { label: 'Configuración & Reglas', icon: Sliders, color: 'text-slate-600 bg-slate-100 border-slate-200' }
  };


  return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Delegación Quirúrgica: ${agenteDelegando?.nombre || ''}`}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5 mt-2">
          
          {/* Header del Agente */}
          <div className="p-4 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-lg">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded font-black uppercase">
                  {agenteDelegando?.rol || 'SOPORTE'}
                </span>
                <h4 className="text-base font-black">{agenteDelegando?.nombre}</h4>
              </div>
              <p className="text-xs text-slate-300">{agenteDelegando?.email || 'Sin correo'}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 fill-current text-amber-300" />
                {herramientasActivas.length} Herramientas Delegadas
              </span>
            </div>
          </div>

          {/* Barra de Presets Rápidos */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              ⚡ Presets Rápidos de 1 Clic
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  disabled={savingPreset}
                  onClick={() => aplicarPreset(preset.keys)}
                  className={`p-2.5 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between ${preset.color}`}
                >
                  <span className="text-xs font-black block">{preset.nombre}</span>
                  <span className="text-[9px] text-slate-500 font-medium block mt-0.5 leading-tight">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Buscador interno de herramientas */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              id="delegar-herramientas-search-input"
              name="herramientas_search"
              placeholder="Filtrar herramientas por nombre o módulo..." 
              value={herramientaSearch}
              onChange={(e) => setHerramientaSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Matriz Categorizada */}
          {loadingHerramientas ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs font-bold">Cargando permisos del colaborador...</p>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto custom-scrollbar space-y-5 pr-1">
              {Object.entries(categoriasHerramientas).map(([catKey, items]) => {
                if (items.length === 0) return null;
                const catMeta = CATEGORIA_INFO[catKey] || { label: catKey, icon: Briefcase, color: 'text-slate-600 bg-slate-50 border-slate-200' };
                const IconCat = catMeta.icon;

                return (
                  <div key={catKey} className="space-y-2.5">
                    {/* Header de Categoría */}
                    <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                      <div className={`p-1.5 rounded-lg border text-xs ${catMeta.color}`}>
                        <IconCat className="w-3.5 h-3.5" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        {catMeta.label}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold">
                        ({items.filter(h => herramientasActivas.includes(h.key)).length}/{items.length} activas)
                      </span>
                    </div>

                    {/* Cards de Herramientas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {items.map((h) => {
                        const isActivo = herramientasActivas.includes(h.key);
                        return (
                          <div 
                            key={h.key} 
                            onClick={() => toggleHerramienta(h.key)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group active:scale-[0.99] ${
                              isActivo 
                                ? 'bg-emerald-50/60 border-emerald-300 shadow-sm' 
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="space-y-0.5 pr-2">
                              <h5 className={`text-xs font-bold transition-colors ${
                                isActivo ? 'text-emerald-900' : 'text-slate-800 group-hover:text-indigo-600'
                              }`}>
                                {h.nombre}
                              </h5>
                              <p className="text-[11px] text-slate-400 leading-snug">{h.descripcion}</p>
                              <span className="text-[9px] font-mono text-slate-400 block pt-0.5">{h.ruta}</span>
                            </div>

                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                              isActivo 
                                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                                : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                            }`}>
                              <Check className="w-4 h-4" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Modal */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">
              Los cambios se guardan automáticamente en tiempo real.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              Cerrar & Guardar
            </button>
          </div>

        </div>
      </Modal>
  );
}
