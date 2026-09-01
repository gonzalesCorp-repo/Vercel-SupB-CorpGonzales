'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Scissors, Package, Sparkles, X, Check, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export interface BienCatalogo {
  id: string;
  nombre: string;
  tipo_bien: 'servicio' | 'producto' | 'insumo';
  categoria?: string;
  precio_venta: number;
  duracion_minutos?: number;
  es_servicio?: boolean;
  es_producto_venta?: boolean;
}

interface ModalCatalogoPickerProps {
  isOpen: boolean;
  tipoInicial?: 'servicio' | 'producto';
  titulo?: string;
  onClose: () => void;
  onSelectBien: (bien: {
    id?: string;
    nombre: string;
    tipo: 'servicio' | 'producto';
    precio: number;
    categoria?: string;
    atributos?: Record<string, any>;
  }) => void;
}

export function ModalCatalogoPicker({
  isOpen,
  tipoInicial = 'servicio',
  titulo = 'Seleccionar del Catálogo Oficial',
  onClose,
  onSelectBien
}: ModalCatalogoPickerProps) {
  const [tipoActivo, setTipoActivo] = useState<'servicio' | 'producto'>(tipoInicial);
  const [catalogo, setCatalogo] = useState<BienCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaChip, setCategoriaChip] = useState('TODOS');

  useEffect(() => {
    if (!isOpen) return;
    setTipoActivo(tipoInicial);
    setBusqueda('');
    setCategoriaChip('TODOS');

    const cargarCatalogo = async () => {
      setCargando(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('bienes')
          .select('id, nombre, tipo_bien, categoria, precio_venta, duracion_minutos, es_servicio, es_producto_venta, atributos_servicio')
          .order('nombre', { ascending: true });

        if (error) {
          console.error('Error al consultar bienes de Supabase:', error);
        }

        if (data) {
          const mapped: BienCatalogo[] = data.map((b: any) => ({
            id: b.id,
            nombre: b.nombre,
            tipo_bien: (b.es_servicio === true || String(b.tipo_bien).toLowerCase() === 'servicio') ? 'servicio' : 'producto',
            categoria: b.categoria || 'General',
            precio_venta: Number(b.precio_venta || 0),
            duracion_minutos: b.duracion_minutos || 30,
            atributos: b.atributos_servicio
          }));
          setCatalogo(mapped);
        }
      } catch (e) {
        console.error('Error cargando catálogo de bienes:', e);
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogo();
  }, [isOpen, tipoInicial]);

  // Filtrar catálogo por tipo (servicio vs producto)
  const catalogoPorTipo = useMemo(() => {
    return catalogo.filter(b => b.tipo_bien === tipoActivo);
  }, [catalogo, tipoActivo]);

  // Extraer chips de categorías disponibles para este tipo
  const categoriasChips = useMemo(() => {
    const cats = new Set<string>();
    catalogoPorTipo.forEach(b => {
      if (b.categoria && b.categoria.trim() !== '') {
        cats.add(b.categoria.trim());
      }
    });
    return ['TODOS', ...Array.from(cats).sort()];
  }, [catalogoPorTipo]);

  // Filtrar resultados por búsqueda y chip seleccionado
  const resultadosFiltrados = useMemo(() => {
    return catalogoPorTipo.filter(b => {
      const matchCategoria = categoriaChip === 'TODOS' || b.categoria?.toLowerCase() === categoriaChip.toLowerCase();
      const matchTexto = !busqueda.trim() || 
        b.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
        (b.categoria && b.categoria.toLowerCase().includes(busqueda.toLowerCase()));
      return matchCategoria && matchTexto;
    });
  }, [catalogoPorTipo, categoriaChip, busqueda]);

  if (!isOpen) return null;

  const handleSeleccionarItem = (b: BienCatalogo & { atributos?: any }) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
    onSelectBien({
      id: b.id,
      nombre: b.nombre,
      tipo: b.tipo_bien as any,
      precio: b.precio_venta,
      categoria: b.categoria,
      atributos: b.atributos
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-5 border border-slate-800 space-y-4 shadow-2xl max-h-[85vh] flex flex-col justify-between">
        
        {/* Cabecera del Modal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">{titulo}</h3>
                <span className="text-[10px] text-slate-400 font-medium">Catálogo Oficial Vaikuntha</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pestañas de Navegación: Exclusivamente Servicios y Retail Oficiales */}
          <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => { setTipoActivo('servicio'); setCategoriaChip('TODOS'); }}
              className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                tipoActivo === 'servicio' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>✂️ Servicios ({catalogo.filter(c => c.tipo_bien === 'servicio').length})</span>
            </button>

            <button
              type="button"
              onClick={() => { setTipoActivo('producto'); setCategoriaChip('TODOS'); }}
              className={`py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-2 ${
                tipoActivo === 'producto' 
                  ? 'bg-emerald-600 text-white shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>🛍️ Retail ({catalogo.filter(c => c.tipo_bien === 'producto').length})</span>
            </button>
          </div>
        </div>

        {/* Buscador & Lista de Resultados Oficiales */}
        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          
          {/* Input de Búsqueda */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Buscar en catálogo de ${tipoActivo === 'servicio' ? 'servicios' : 'productos retail'}...`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-colors rounded-xl text-xs text-white outline-none focus:border-indigo-500 font-medium"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Chips de Filtro Rápido por Línea / Especialidad */}
          {categoriasChips.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px]">
              {categoriasChips.map((cat, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCategoriaChip(cat)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-bold transition ${
                    categoriaChip === cat
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Lista de Resultados del Catálogo */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-60 sm:max-h-72">
            {cargando ? (
              <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span>Cargando catálogo oficial...</span>
              </div>
            ) : resultadosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto opacity-70" />
                <p className="font-semibold">
                  No se encontraron {tipoActivo === 'servicio' ? 'servicios' : 'productos'} en el catálogo oficial para "{busqueda}".
                </p>
                <p className="text-[10px] text-slate-500">
                  Solo se permiten bienes debidamente registrados y aprobados por la administración.
                </p>
              </div>
            ) : (
              resultadosFiltrados.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSeleccionarItem(item)}
                  className="p-3 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-2xl flex items-center justify-between text-xs transition cursor-pointer group active:scale-98"
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <p className="font-bold text-slate-100 group-hover:text-white truncate">
                      {item.nombre}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 font-semibold">
                        {item.categoria}
                      </span>
                      {item.duracion_minutos && item.tipo_bien === 'servicio' && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-500" /> {item.duracion_minutos} min
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-sm text-indigo-400 group-hover:text-indigo-300">
                      S/ {item.precio_venta.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
