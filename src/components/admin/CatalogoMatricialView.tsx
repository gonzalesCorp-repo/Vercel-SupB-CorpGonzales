'use client';

import React, { useState, useEffect } from 'react';
import { 
  Table, Search, Plus, Filter, Save, X, ChevronRight, Layers, 
  Scissors, Package, Sparkles, DollarSign, Clock, Users, CheckCircle2,
  TrendingUp, AlertCircle, Percent, Sliders, ShieldCheck
} from 'lucide-react';
import { 
  CategoriaBien, BienItem, obtenerCategoriasJerarquicas, 
  obtenerBienesCatalogo, guardarBienCatalogo, calcularRentabilidadBien 
} from '@/services/catalogo';
import { createClient } from '@/lib/supabase/client';

export function CatalogoMatricialView() {
  const [bienes, setBienes] = useState<BienItem[]>([]);
  const [categorias, setCategorias] = useState<CategoriaBien[]>([]);
  const [colaboradores, setColaboradores] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [query, setQuery] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroDivision, setFiltroDivision] = useState<string>('todas');
  
  // Panel Lateral (Drawer) para edición profunda
  const [selectedBien, setSelectedBien] = useState<BienItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Formulario del panel lateral
  const [formData, setFormData] = useState<Partial<BienItem>>({});
  const [staffHabilitadoIds, setStaffHabilitadoIds] = useState<string[]>([]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [cats, items] = await Promise.all([
        obtenerCategoriasJerarquicas(),
        obtenerBienesCatalogo()
      ]);
      setCategorias(cats);
      setBienes(items);

      // Cargar lista de colaboradores Staff
      const supabase = createClient();
      const { data: staffList } = await supabase
        .from('agentes')
        .select('id, nombre, rol, especialidad, habilidades_config')
        .order('nombre', { ascending: true });

      setColaboradores(staffList || []);
    } catch (e) {
      console.error('Error cargando datos del catálogo matricial:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirDrawerEdicion = (bien?: BienItem) => {
    if (bien) {
      setSelectedBien(bien);
      setFormData({ ...bien });

      // Calcular qué colaboradores están habilitados para este bien
      const habilitados = colaboradores.filter(colab => {
        const config = colab.habilidades_config || {};
        const lineas = config.lineas_habilitadas || [];
        const excluidos = config.servicios_excluidos || [];
        const incluidos = config.servicios_adicionales_incluidos || [];

        if (incluidos.includes(bien.id)) return true;
        if (excluidos.includes(bien.id)) return false;
        if (bien.linea_id && lineas.includes(bien.linea_id)) return true;
        return false;
      }).map(c => c.id);

      setStaffHabilitadoIds(habilitados);
    } else {
      setSelectedBien(null);
      setFormData({
        nombre: '',
        tipo_bien: 'servicio',
        precio_venta: 50,
        costo_base: 10,
        duracion_minutos: 45,
        comision_porcentaje: 35,
        es_servicio: true
      });
      setStaffHabilitadoIds(colaboradores.map(c => c.id));
    }
    setDrawerOpen(true);
  };

  const handleToggleStaffHabilitado = (staffId: string) => {
    setStaffHabilitadoIds(prev => 
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre?.trim()) return;

    setGuardando(true);
    try {
      const guardado = await guardarBienCatalogo(formData);
      
      // Actualizar la lista en memoria
      if (guardado) {
        setBienes(prev => {
          const index = prev.findIndex(b => b.id === guardado.id);
          if (index >= 0) {
            const copia = [...prev];
            copia[index] = guardado;
            return copia;
          }
          return [guardado, ...prev];
        });
      }

      setFeedback(`¡"${formData.nombre}" guardado y sincronizado con éxito!`);
      setDrawerOpen(false);
      setTimeout(() => setFeedback(''), 4000);
    } catch (e: any) {
      console.error('Error guardando bien:', e);
      setFeedback('Error al guardar. Verifica la conexión.');
    } finally {
      setGuardando(false);
    }
  };

  // Filtrado de la tabla matricial
  const filtrados = bienes.filter(b => {
    const matchQuery = b.nombre.toLowerCase().includes(query.toLowerCase()) || 
                       (b.categoria && b.categoria.toLowerCase().includes(query.toLowerCase()));
    const matchTipo = filtroTipo === 'todos' || b.tipo_bien === filtroTipo;
    return matchQuery && matchTipo;
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Cabecera & Métricas del Catálogo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
            Arquitectura de Bienes & Rentabilidad
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-2">
            Catálogo Matricial de Bienes (Servicios, Productos & Equipos)
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Control de 3 niveles: Divisiones Raíz ➔ Líneas / Subcategorías ➔ Atributos Dinámicos y Matriz de Habilidades.
          </p>
        </div>

        <button
          onClick={() => abrirDrawerEdicion()}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 self-start active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nuevo Bien / Servicio</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Barra de Filtros & Búsqueda */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o categoría..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {(['todos', 'servicio', 'producto', 'insumo', 'equipo'] as const).map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filtroTipo === tipo
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tipo === 'todos' ? 'Todos los Tipos' : tipo + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla Matricial / Spreadsheet View */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-slate-950/80 text-gray-400 dark:text-slate-500 font-black uppercase tracking-wider border-b border-gray-200 dark:border-slate-800 text-[10px]">
                <th className="py-3.5 px-4">Bien / Servicio</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4">Línea / División</th>
                <th className="py-3.5 px-4 text-right">Precio Venta</th>
                <th className="py-3.5 px-4 text-right">Costo Insumos</th>
                <th className="py-3.5 px-4 text-right">Comisión Staff</th>
                <th className="py-3.5 px-4 text-right">Margen Bruto</th>
                <th className="py-3.5 px-4 text-center">Duración</th>
                <th className="py-3.5 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
              {cargando ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    Cargando matriz del catálogo...
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-gray-400">
                    No se encontraron bienes en este filtro.
                  </td>
                </tr>
              ) : (
                filtrados.map((bien) => {
                  const rent = calcularRentabilidadBien(
                    bien.precio_venta || 0,
                    bien.costo_base || 0,
                    bien.comision_porcentaje || 0
                  );

                  return (
                    <tr 
                      key={bien.id} 
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-850/50 transition-colors group cursor-pointer"
                      onClick={() => abrirDrawerEdicion(bien)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                            bien.tipo_bien === 'servicio'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {bien.tipo_bien === 'servicio' ? <Scissors className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">
                              {bien.nombre}
                            </p>
                            <span className="text-[10px] text-gray-400">ID: {bien.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          bien.tipo_bien === 'servicio'
                            ? 'bg-indigo-500/10 text-indigo-500'
                            : 'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {bien.tipo_bien}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600 dark:text-slate-300">
                        {bien.categoria || 'Sin Categoría'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-gray-900 dark:text-white font-mono">
                        S/ {Number(bien.precio_venta || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right text-gray-500 dark:text-slate-400 font-mono">
                        S/ {Number(bien.costo_base || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-indigo-500 font-bold">
                        {bien.comision_porcentaje || 0}%
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          S/ {rent.margenBruto.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-400 block font-normal">
                          ({rent.porcentajeMargen}%)
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-gray-500 font-mono">
                        {bien.duracion_minutos || 30} min
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirDrawerEdicion(bien);
                          }}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[11px] font-bold transition"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Lateral Desplegable (Drawer) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg h-full shadow-2xl p-6 overflow-y-auto space-y-6 border-l border-gray-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
            
            {/* Header Drawer */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                  {selectedBien ? 'Editar Ítem del Catálogo' : 'Crear Nuevo Bien'}
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {formData.nombre || 'Nuevo Ítem'}
                </h3>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              
              {/* Nombre y Tipo */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Nombre del Bien / Servicio:</label>
                <input
                  type="text"
                  required
                  value={formData.nombre || ''}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="ej. Balayage Signature + Matiz"
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Tipo de Bien:</label>
                  <select
                    value={formData.tipo_bien || 'servicio'}
                    onChange={(e) => setFormData({ ...formData, tipo_bien: e.target.value as any })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  >
                    <option value="servicio">Servicio (Mano de obra)</option>
                    <option value="producto">Producto Retail (Venta)</option>
                    <option value="insumo">Insumo Taller (Gramos/U)</option>
                    <option value="equipo">Equipo / Mobiliario</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Categoría / Línea:</label>
                  <input
                    type="text"
                    value={formData.categoria || ''}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="ej. Colorimetría & Mechas"
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Precios, Costos y Comisiones */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Finanzas & Rentabilidad por Ítem
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Precio Venta (S/):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.precio_venta || 0}
                      onChange={(e) => setFormData({ ...formData, precio_venta: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Costo Insumos (S/):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.costo_base || 0}
                      onChange={(e) => setFormData({ ...formData, costo_base: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-500">Comisión (%):</label>
                    <input
                      type="number"
                      value={formData.comision_porcentaje || 0}
                      onChange={(e) => setFormData({ ...formData, comision_porcentaje: Number(e.target.value) })}
                      className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono text-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-200 dark:border-slate-850 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-500">Margen Bruto Estimado:</span>
                  <span className="text-emerald-500 font-mono">
                    S/ {calcularRentabilidadBien(formData.precio_venta || 0, formData.costo_base || 0, formData.comision_porcentaje || 0).margenBruto.toFixed(2)} ({calcularRentabilidadBien(formData.precio_venta || 0, formData.costo_base || 0, formData.comision_porcentaje || 0).porcentajeMargen}%)
                  </span>
                </div>
              </div>

              {/* Duración en minutos */}
              {formData.tipo_bien === 'servicio' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Tiempo Estimado de Ejecución (Minutos):
                  </label>
                  <input
                    type="number"
                    value={formData.duracion_minutos || 30}
                    onChange={(e) => setFormData({ ...formData, duracion_minutos: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {/* Matriz de Calificación del Staff (Quiénes pueden realizarlo) */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Staff Calificado (Matriz de Habilidades)
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold font-mono">
                    {staffHabilitadoIds.length} de {colaboradores.length}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Control granular: habilita qué colaboradores tienen la certificación o destreza para ejecutar este servicio.
                </p>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {colaboradores.map((colab) => {
                    const estaHabilitado = staffHabilitadoIds.includes(colab.id);
                    return (
                      <div
                        key={colab.id}
                        onClick={() => handleToggleStaffHabilitado(colab.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          estaHabilitado
                            ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                            : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-500'
                        }`}
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{colab.nombre}</p>
                          <span className="text-[10px] text-gray-400">{colab.especialidad || colab.rol}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                          estaHabilitado ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-slate-800 text-gray-400'
                        }`}>
                          {estaHabilitado ? 'Calificado' : 'No Habilitado'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Botón Guardar */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{guardando ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
