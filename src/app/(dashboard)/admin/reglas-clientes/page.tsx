'use client';

import React, { useState, useEffect } from 'react';
import { 
  Crown, Sparkles, HeartHandshake, ShoppingBag, UserCheck, Star, Award, 
  Shield, Zap, Plus, Edit2, Trash2, CheckCircle2, AlertTriangle, ArrowLeft,
  DollarSign, Calendar, Sliders, ToggleLeft, ToggleRight, X, Info
} from 'lucide-react';
import Link from 'next/link';
import { 
  ReglaEtiquetaCliente, obtenerReglasEtiquetas, guardarReglaEtiqueta, eliminarReglaEtiqueta 
} from '@/services/reglasClientes';
import { useUIStore } from '@/store/useUIStore';

const ICON_COMPONENTS: Record<string, any> = {
  Crown,
  Sparkles,
  HeartHandshake,
  ShoppingBag,
  UserCheck,
  Star,
  Award,
  Shield,
  Zap
};

const COLOR_PRESETS = [
  { label: 'Oro VIP', value: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
  { label: 'Púrpura Místico', value: 'bg-purple-500/20 text-purple-300 border-purple-500/50' },
  { label: 'Esmeralda Retail', value: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { label: 'Rosa Fidelidad', value: 'bg-rose-500/20 text-rose-300 border-rose-500/40' },
  { label: 'Azul Índigo', value: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' },
  { label: 'Pizarra Base', value: 'bg-slate-700/50 text-slate-300 border-slate-600' },
  { label: 'Cian Fresco', value: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' }
];

export default function ReglasClientesAdminPage() {
  const [reglas, setReglas] = useState<ReglaEtiquetaCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editandoRegla, setEditandoRegla] = useState<ReglaEtiquetaCliente | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { showAlert } = useUIStore();

  // Form State
  const [nombre, setNombre] = useState('');
  const [codigoSlug, setCodigoSlug] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [icono, setIcono] = useState('Crown');
  const [colorBadge, setColorBadge] = useState(COLOR_PRESETS[0].value);
  const [prioridad, setPrioridad] = useState(5);
  const [activo, setActivo] = useState(true);

  // Criterios
  const [minVisitas30d, setMinVisitas30d] = useState<string>('');
  const [minConsumoTotal30d, setMinConsumoTotal30d] = useState<string>('');
  const [minAtencionesHistoricas, setMinAtencionesHistoricas] = useState<string>('');
  const [minComprasRetail30d, setMinComprasRetail30d] = useState<string>('');
  const [minConsumoRetail30d, setMinConsumoRetail30d] = useState<string>('');
  const [minAtencionesMismoStaff, setMinAtencionesMismoStaff] = useState<string>('');

  const cargarReglas = async () => {
    setLoading(true);
    try {
      const data = await obtenerReglasEtiquetas(false);
      setReglas(data);
    } catch (e) {
      console.error(e);
      showAlert('Error al cargar reglas de clientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReglas();
  }, []);

  const abrirModalNuevo = () => {
    setEditandoRegla(null);
    setNombre('');
    setCodigoSlug('');
    setDescripcion('');
    setIcono('Crown');
    setColorBadge(COLOR_PRESETS[0].value);
    setPrioridad(5);
    setActivo(true);
    setMinVisitas30d('');
    setMinConsumoTotal30d('');
    setMinAtencionesHistoricas('');
    setMinComprasRetail30d('');
    setMinConsumoRetail30d('');
    setMinAtencionesMismoStaff('');
    setModalOpen(true);
  };

  const abrirModalEditar = (r: ReglaEtiquetaCliente) => {
    setEditandoRegla(r);
    setNombre(r.nombre);
    setCodigoSlug(r.codigo_slug);
    setDescripcion(r.descripcion || '');
    setIcono(r.icono || 'Crown');
    setColorBadge(r.color_badge || COLOR_PRESETS[0].value);
    setPrioridad(r.prioridad || 1);
    setActivo(r.activo !== false);

    const c = r.criterios || {};
    setMinVisitas30d(c.min_visitas_30d !== undefined ? String(c.min_visitas_30d) : '');
    setMinConsumoTotal30d(c.min_consumo_total_30d !== undefined ? String(c.min_consumo_total_30d) : '');
    setMinAtencionesHistoricas(c.min_atenciones_historicas !== undefined ? String(c.min_atenciones_historicas) : '');
    setMinComprasRetail30d(c.min_compras_retail_30d !== undefined ? String(c.min_compras_retail_30d) : '');
    setMinConsumoRetail30d(c.min_consumo_retail_30d !== undefined ? String(c.min_consumo_retail_30d) : '');
    setMinAtencionesMismoStaff(c.min_atenciones_mismo_staff !== undefined ? String(c.min_atenciones_mismo_staff) : '');

    setModalOpen(true);
  };

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    setGuardando(true);
    try {
      const criterios: any = {};
      if (minVisitas30d.trim() !== '') criterios.min_visitas_30d = Number(minVisitas30d);
      if (minConsumoTotal30d.trim() !== '') criterios.min_consumo_total_30d = Number(minConsumoTotal30d);
      if (minAtencionesHistoricas.trim() !== '') criterios.min_atenciones_historicas = Number(minAtencionesHistoricas);
      if (minComprasRetail30d.trim() !== '') criterios.min_compras_retail_30d = Number(minComprasRetail30d);
      if (minConsumoRetail30d.trim() !== '') criterios.min_consumo_retail_30d = Number(minConsumoRetail30d);
      if (minAtencionesMismoStaff.trim() !== '') criterios.min_atenciones_mismo_staff = Number(minAtencionesMismoStaff);

      const res = await guardarReglaEtiqueta({
        id: editandoRegla?.id,
        nombre: nombre.trim(),
        codigo_slug: codigoSlug.trim() || nombre.trim().toLowerCase().replace(/\s+/g, '_'),
        descripcion: descripcion.trim() || undefined,
        icono,
        color_badge: colorBadge,
        prioridad: Number(prioridad) || 1,
        activo,
        criterios
      });

      if (res) {
        showAlert(editandoRegla ? 'Regla actualizada correctamente' : 'Nueva regla de cliente creada', 'success');
        setModalOpen(false);
        cargarReglas();
      } else {
        showAlert('Error al guardar la regla', 'error');
      }
    } catch (err: any) {
      showAlert(`Error: ${err.message}`, 'error');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string, nombreRegla: string) => {
    if (!confirm(`¿Estás seguro de eliminar la regla "${nombreRegla}"?`)) return;
    const ok = await eliminarReglaEtiqueta(id);
    if (ok) {
      showAlert('Regla eliminada', 'success');
      cargarReglas();
    } else {
      showAlert('Error al eliminar', 'error');
    }
  };

  const toggleEstadoRegla = async (r: ReglaEtiquetaCliente) => {
    const nuevoEstado = !r.activo;
    await guardarReglaEtiqueta({
      id: r.id,
      nombre: r.nombre,
      codigo_slug: r.codigo_slug,
      activo: nuevoEstado
    });
    setReglas(prev => prev.map(item => item.id === r.id ? { ...item, activo: nuevoEstado } : item));
    showAlert(`Regla "${r.nombre}" ${nuevoEstado ? 'activada' : 'pausada'}`, 'info');
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Sliders className="w-4 h-4" />
            <span>Sistema & Gobernanza CRM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Reglas de Categorías & Insignias de Clientes
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configura los requisitos y umbrales transaccionales que un consumidor debe cumplir para ganar insignias de cliente (*VIP, Fidelizado, Retail VIP*) en el CRM, Totem y Apps.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/recepcion/crm"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition flex items-center gap-2"
          >
            <UserCheck className="w-4 h-4 text-indigo-500" />
            Ver Directorio CRM
          </Link>
          <button
            onClick={abrirModalNuevo}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nueva Regla
          </button>
        </div>
      </div>

      {/* Grid de Reglas */}
      {loading ? (
        <div className="p-12 text-center text-gray-400 font-medium animate-pulse">
          Cargando reglas de clientes...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reglas.map((r) => {
            const IconComponent = ICON_COMPONENTS[r.icono] || Sparkles;
            const c = r.criterios || {};

            return (
              <div 
                key={r.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all duration-300 shadow-sm flex flex-col justify-between ${
                  r.activo 
                    ? 'border-gray-200/80 dark:border-slate-800 hover:border-indigo-500/40 hover:shadow-md' 
                    : 'border-gray-200 dark:border-slate-800 opacity-60 bg-gray-50 dark:bg-slate-950'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Top Bar de la Card */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-slate-100">{r.nombre}</h3>
                        <span className="text-[10px] font-mono text-gray-400 font-bold">{r.codigo_slug}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => toggleEstadoRegla(r)}
                      title={r.activo ? 'Pausar regla' : 'Activar regla'}
                      className="text-gray-400 hover:text-indigo-500 transition"
                    >
                      {r.activo ? (
                        <ToggleRight className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Badge Preview */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] text-gray-400 font-bold">Vista previa:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black border ${r.color_badge}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                      {r.nombre}
                    </span>
                  </div>

                  {/* Descripción */}
                  {r.descripcion && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">
                      {r.descripcion}
                    </p>
                  )}

                  {/* Criterios Transaccionales */}
                  <div className="p-3 bg-gray-50 dark:bg-slate-950/60 rounded-2xl border border-gray-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
                      Criterios de Activación
                    </div>

                    {c.min_visitas_30d !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Visitas mínimas al mes:</span>
                        <span className="font-black text-indigo-500">{c.min_visitas_30d} visita(s)</span>
                      </div>
                    )}

                    {c.min_consumo_total_30d !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Consumo mín. últimos 30d:</span>
                        <span className="font-black text-emerald-500 font-mono">S/ {c.min_consumo_total_30d.toFixed(2)}</span>
                      </div>
                    )}

                    {c.min_atenciones_historicas !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Atenciones históricas:</span>
                        <span className="font-black text-indigo-500">{c.min_atenciones_historicas}</span>
                      </div>
                    )}

                    {c.min_compras_retail_30d !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Compras retail al mes:</span>
                        <span className="font-black text-purple-500">{c.min_compras_retail_30d} compra(s)</span>
                      </div>
                    )}

                    {c.min_consumo_retail_30d !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Gasto retail mín. al mes:</span>
                        <span className="font-black text-purple-500 font-mono">S/ {c.min_consumo_retail_30d.toFixed(2)}</span>
                      </div>
                    )}

                    {c.min_atenciones_mismo_staff !== undefined && (
                      <div className="flex items-center justify-between text-gray-600 dark:text-slate-300">
                        <span>Fidelidad con un staff:</span>
                        <span className="font-black text-rose-500">{c.min_atenciones_mismo_staff} visitas</span>
                      </div>
                    )}

                    {Object.keys(c).length === 0 && (
                      <div className="text-gray-400 italic text-[11px]">
                        Sin criterios automáticos configurados.
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Acciones */}
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400">
                    Prioridad: <strong className="text-indigo-600 dark:text-indigo-400">{r.prioridad || 1}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => abrirModalEditar(r)}
                      className="p-2 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                      title="Editar regla"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEliminar(r.id, r.nombre)}
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                      title="Eliminar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Regla */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-gray-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-slate-100">
                  {editandoRegla ? 'Editar Regla de Cliente' : 'Nueva Regla de Insignia'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Define el nombre, apariencia y condiciones transaccionales.
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4">
              
              {/* Nombre & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                    Nombre de la Etiqueta *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Cliente VIP"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                    Código Slug
                  </label>
                  <input
                    type="text"
                    value={codigoSlug}
                    onChange={(e) => setCodigoSlug(e.target.value)}
                    placeholder="ej. cliente_vip"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-mono text-gray-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                  Descripción Operativa
                </label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej. 1 visita al mes y consumo acumulado mayor a S/ 700.00"
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs text-gray-700 dark:text-slate-300 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Icono & Color Selector */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                    Icono
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(ICON_COMPONENTS).map((iconName) => {
                      const IconComp = ICON_COMPONENTS[iconName];
                      const isSel = icono === iconName;
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setIcono(iconName)}
                          className={`p-2 rounded-xl border transition ${
                            isSel 
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md' 
                              : 'bg-gray-50 dark:bg-slate-950 text-gray-500 border-gray-200 dark:border-slate-800 hover:border-gray-400'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300 block mb-1">
                    Estilo de Color
                  </label>
                  <div className="space-y-1.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isSel = colorBadge === preset.value;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setColorBadge(preset.value)}
                          className={`w-full px-3 py-1.5 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition ${
                            isSel ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent'
                          }`}
                        >
                          <span className={`px-2 py-0.5 rounded-full border text-[11px] font-black ${preset.value}`}>
                            {preset.label}
                          </span>
                          {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sección Criterios Transaccionales */}
              <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white uppercase tracking-wide">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span>Umbrales y Condiciones Transaccionales</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-slate-400">
                  Deja en blanco cualquier criterio que no aplique para esta categoría.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Visitas (Últimos 30 días)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minVisitas30d}
                      onChange={(e) => setMinVisitas30d(e.target.value)}
                      placeholder="Ej. 1"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Consumo Total S/ (Últimos 30 días)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minConsumoTotal30d}
                      onChange={(e) => setMinConsumoTotal30d(e.target.value)}
                      placeholder="Ej. 700.00"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Atenciones Históricas Totales
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minAtencionesHistoricas}
                      onChange={(e) => setMinAtencionesHistoricas(e.target.value)}
                      placeholder="Ej. 1 (Identificado) o 4 (Fidelizado)"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Compras Retail (Últimos 30 días)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minComprasRetail30d}
                      onChange={(e) => setMinComprasRetail30d(e.target.value)}
                      placeholder="Ej. 1"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Consumo Retail S/ (Últimos 30 días)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={minConsumoRetail30d}
                      onChange={(e) => setMinConsumoRetail30d(e.target.value)}
                      placeholder="Ej. 700.00"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-600 dark:text-slate-300 block mb-1">
                      Mín. Atenciones con el Mismo Staff
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={minAtencionesMismoStaff}
                      onChange={(e) => setMinAtencionesMismoStaff(e.target.value)}
                      placeholder="Ej. 3"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400"
                    />
                  </div>
                </div>
              </div>

              {/* Prioridad y Estado */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-slate-300">Prioridad:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={prioridad}
                    onChange={(e) => setPrioridad(Number(e.target.value))}
                    className="w-16 px-2.5 py-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-bold text-center text-gray-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Regla Activa</span>
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-600/30 transition active:scale-95 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : editandoRegla ? 'Actualizar Regla' : 'Crear Regla'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
