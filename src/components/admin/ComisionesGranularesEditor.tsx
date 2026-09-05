'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Sparkles, X, ChevronDown, ChevronUp, Percent } from 'lucide-react';
import { BienItem, obtenerBienesCatalogo } from '@/services/catalogo';

interface ComisionesGranularesEditorProps {
  overrides: Record<string, number>;
  onChange: (overrides: Record<string, number>) => void;
  comisionGeneral?: number | string;
  disabled?: boolean;
}

export function ComisionesGranularesEditor({
  overrides,
  onChange,
  comisionGeneral = 40,
  disabled = false
}: ComisionesGranularesEditorProps) {
  const [servicios, setServicios] = useState<BienItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function loadServicios() {
      setLoading(true);
      try {
        const items = await obtenerBienesCatalogo();
        const soloServicios = (items || []).filter(
          it => it.tipo_bien === 'servicio' || it.es_servicio === true
        );
        setServicios(soloServicios);
      } catch (err) {
        console.error('Error cargando servicios para comisiones granulares:', err);
      } finally {
        setLoading(false);
      }
    }
    loadServicios();
  }, []);

  const totalExcepciones = useMemo(() => {
    return Object.keys(overrides || {}).filter(k => overrides[k] !== undefined && overrides[k] !== null).length;
  }, [overrides]);

  const serviciosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return servicios;
    const term = searchTerm.toLowerCase();
    return servicios.filter(s => 
      s.nombre.toLowerCase().includes(term) ||
      (s.categoria || '').toLowerCase().includes(term)
    );
  }, [servicios, searchTerm]);

  const handleUpdateOverride = (servicioId: string, valStr: string) => {
    if (valStr.trim() === '') {
      // Eliminar override, heredar general
      const nuevo = { ...overrides };
      delete nuevo[servicioId];
      onChange(nuevo);
    } else {
      const num = Number(valStr);
      if (!isNaN(num)) {
        onChange({
          ...overrides,
          [servicioId]: num
        });
      }
    }
  };

  const handleClearAll = () => {
    onChange({});
  };

  return (
    <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 transition-all">
      {/* Header / Botón Acordeón */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Percent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Excepciones de Comisión por Servicio
              </span>
              {totalExcepciones > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-xs">
                  {totalExcepciones} {totalExcepciones === 1 ? 'excepción' : 'excepciones'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Personaliza el % de ganancia en servicios específicos (por defecto: {comisionGeneral}%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? 'Ocultar matriz' : 'Configurar granular'}
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Contenido Desplegable */}
      {isOpen && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700/80 space-y-3 bg-slate-50/50 dark:bg-slate-900/20">
          
          {/* Barra de Búsqueda y Filtros */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar servicio por nombre o categoría..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {totalExcepciones > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={disabled}
                className="px-2.5 py-1.5 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors shrink-0 cursor-pointer"
                title="Restablecer todas las excepciones a la comisión general"
              >
                Limpiar excepciones
              </button>
            )}
          </div>

          {/* Lista de Servicios */}
          {loading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Cargando catálogo de servicios...
            </div>
          ) : serviciosFiltrados.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No se encontraron servicios que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
              {serviciosFiltrados.map(s => {
                const tieneOverride = overrides[s.id] !== undefined && overrides[s.id] !== null;
                const valorActual = tieneOverride ? overrides[s.id] : '';

                return (
                  <div
                    key={s.id}
                    className={`p-2 rounded-xl border flex items-center justify-between gap-3 transition-colors ${
                      tieneOverride
                        ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {s.nombre}
                        </span>
                        {tieneOverride && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500 text-white shrink-0">
                            Especial
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <span>{s.categoria || 'Servicio'}</span>
                        <span>•</span>
                        <span>Precio: S/ {Number(s.precio_venta || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="relative w-24">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          disabled={disabled}
                          value={valorActual}
                          onChange={e => handleUpdateOverride(s.id, e.target.value)}
                          placeholder={`${comisionGeneral}%`}
                          className={`w-full py-1 pl-2 pr-6 rounded-lg text-xs font-mono font-bold outline-none border text-right ${
                            tieneOverride
                              ? 'bg-amber-100/70 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 placeholder:text-slate-400'
                          }`}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                          %
                        </span>
                      </div>

                      {tieneOverride && (
                        <button
                          type="button"
                          onClick={() => handleUpdateOverride(s.id, '')}
                          disabled={disabled}
                          className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                          title="Volver a comisión general"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="p-2.5 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-2 text-[11px] text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-indigo-500" />
            <span>
              Los servicios que dejes vacíos heredarán automáticamente el contrato general del colaborador ({comisionGeneral}%). Los servicios con porcentaje especial tendrán prioridad absoluta en los cierres y liquidaciones.
            </span>
          </div>

        </div>
      )}
    </div>
  );
}
