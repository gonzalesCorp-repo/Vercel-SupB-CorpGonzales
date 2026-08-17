'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserCheck, Crown, Sparkles, HeartHandshake, ShoppingBag, 
  Phone, MessageSquare, Filter, Sliders, Calendar, DollarSign, ArrowUpDown,
  FileText, ExternalLink, RefreshCw, Star, ShieldCheck, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ReglaEtiquetaCliente, obtenerReglasEtiquetas, calcularMetricasCliente, 
  evaluarEtiquetas, MetricasCliente 
} from '@/services/reglasClientes';
import { useAppStore } from '@/store/useAppStore';

const ICON_MAP: Record<string, any> = {
  Crown,
  Sparkles,
  HeartHandshake,
  ShoppingBag,
  UserCheck,
  Star
};

interface ClienteConMetricas {
  id: string;
  nombre: string;
  dni?: string;
  celular?: string;
  created_at?: string;
  sede_nombre?: string;
  agente_asignado?: string;
  metricas: MetricasCliente;
  insigniasGanadas: ReglaEtiquetaCliente[];
}

export default function DirectorioCRMPage() {
  const [clientes, setClientes] = useState<ClienteConMetricas[]>([]);
  const [reglas, setReglas] = useState<ReglaEtiquetaCliente[]>([]);
  const [staffList, setStaffList] = useState<{ id: string; nombre: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [staffFiltro, setStaffFiltro] = useState<string>('TODOS');
  const [etiquetaFiltro, setEtiquetaFiltro] = useState<string>('TODOS');
  const userRol = useAppStore((state) => state.userRol);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // 1. Cargar reglas activas
      const reglasActivas = await obtenerReglasEtiquetas(true);
      setReglas(reglasActivas);

      // 2. Cargar lista de staff
      const { data: staffData } = await supabase
        .from('agentes')
        .select('id, nombre')
        .eq('estado', 'ACTIVO')
        .order('nombre', { ascending: true });
      setStaffList(staffData || []);

      // 3. Cargar clientes
      const { data: clientesData, error } = await supabase
        .from('clientes')
        .select('*, sedes(nombre), agentes(nombre)')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error cargando clientes:', error);
      }

      if (clientesData) {
        // Calcular métricas e insignias para cada cliente
        const conMetricas = await Promise.all(
          clientesData.map(async (c: any) => {
            const metricas = await calcularMetricasCliente(c.id, c.nombre, c.dni);
            const insignias = evaluarEtiquetas(metricas, reglasActivas);
            return {
              id: c.id,
              nombre: c.nombre,
              dni: c.dni,
              celular: c.celular,
              created_at: c.created_at,
              sede_nombre: c.sedes?.nombre,
              agente_asignado: c.agentes?.nombre,
              metricas,
              insigniasGanadas: insignias
            };
          })
        );
        setClientes(conMetricas);
      }
    } catch (e) {
      console.error('Error en CRM:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Filtrado reactivo por texto, colaborador y etiqueta
  const clientesFiltrados = useMemo(() => {
    return clientes.filter(c => {
      // Filtro de texto
      const q = busqueda.toLowerCase().trim();
      const matchTexto = !q || 
        c.nombre.toLowerCase().includes(q) || 
        (c.dni && c.dni.includes(q)) || 
        (c.celular && c.celular.includes(q));

      // Filtro por Staff (colaborador asignado o staff favorito)
      const matchStaff = staffFiltro === 'TODOS' || 
        c.agente_asignado === staffFiltro || 
        c.metricas.staffFavorito?.agenteNombre === staffFiltro;

      // Filtro por Insignia / Etiqueta ganada
      const matchEtiqueta = etiquetaFiltro === 'TODOS' || 
        c.insigniasGanadas.some(i => i.codigo_slug === etiquetaFiltro || i.nombre === etiquetaFiltro);

      return matchTexto && matchStaff && matchEtiqueta;
    });
  }, [clientes, busqueda, staffFiltro, etiquetaFiltro]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Directorio Central CRM</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            Directorio de Clientes & Segmentación
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            Consulta el historial, insignias ganadas en tiempo real y segmenta la cartera por especialista del staff.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/admin/reglas-clientes"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-2xl transition flex items-center gap-2"
          >
            <Sliders className="w-4 h-4 text-indigo-500" />
            Configurar Reglas
          </Link>
          <button
            onClick={cargarDatos}
            disabled={loading}
            className="p-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 rounded-2xl hover:bg-gray-50 transition active:scale-95"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Barra de Filtros & Búsqueda */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
        
        {/* Buscador de Texto */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, DNI o teléfono..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Filtro por Cartera de Staff */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 shrink-0">Cartera de:</span>
          <select
            value={staffFiltro}
            onChange={(e) => setStaffFiltro(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="TODOS">Todos los Colaboradores</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.nombre}>{s.nombre}</option>
            ))}
          </select>
        </div>

        {/* Filtro por Insignia */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 shrink-0">Insignia:</span>
          <select
            value={etiquetaFiltro}
            onChange={(e) => setEtiquetaFiltro(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="TODOS">Todas las Categorías</option>
            {reglas.map((r) => (
              <option key={r.id} value={r.codigo_slug}>{r.nombre}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Tabla / Lista de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
            Mostrando {clientesFiltrados.length} de {clientes.length} clientes registrados
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium animate-pulse">
            Calculando métricas e insignias ganadas en tiempo real...
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <Users className="w-8 h-8 text-gray-300 dark:text-slate-700 mx-auto" />
            <p className="font-semibold text-sm">No se encontraron clientes con los filtros aplicados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-slate-950/60 text-gray-400 uppercase tracking-wider font-bold border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="p-4">Cliente & Contacto</th>
                  <th className="p-4">Insignias Ganadas</th>
                  <th className="p-4">Atenciones & Visitas</th>
                  <th className="p-4">Consumo Total</th>
                  <th className="p-4">Staff Favorito / Cartera</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 font-medium">
                {clientesFiltrados.map((c) => {
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/80 dark:hover:bg-slate-800/40 transition">
                      
                      {/* Cliente & Contacto */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-black flex items-center justify-center text-xs shadow-sm shrink-0">
                            {c.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-slate-100 text-sm">{c.nombre}</div>
                            <div className="text-[11px] text-gray-400 flex items-center gap-2">
                              {c.dni && <span>DNI: {c.dni}</span>}
                              {c.celular && <span>📱 {c.celular}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Insignias Ganadas */}
                      <td className="p-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {c.insigniasGanadas.length > 0 ? (
                            c.insigniasGanadas.map((ins) => {
                              const IconComp = ICON_MAP[ins.icono] || Sparkles;
                              return (
                                <span 
                                  key={ins.id}
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${ins.color_badge}`}
                                >
                                  <IconComp className="w-3 h-3" />
                                  {ins.nombre}
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">Consumidor Ocasional</span>
                          )}
                        </div>
                      </td>

                      {/* Atenciones & Visitas */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-800 dark:text-slate-200">
                            {c.metricas.atencionesHistoricas} atenciones
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {c.metricas.visitas30d} en los últimos 30 días
                          </div>
                        </div>
                      </td>

                      {/* Consumo Total */}
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <div className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
                            S/ {c.metricas.consumoTotalHistorico.toFixed(2)}
                          </div>
                          {c.metricas.consumoRetail30d > 0 && (
                            <div className="text-[10px] text-purple-500 font-bold">
                              🛍️ S/ {c.metricas.consumoRetail30d.toFixed(2)} retail (30d)
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Staff Favorito */}
                      <td className="p-4">
                        {c.metricas.staffFavorito ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-gray-700 dark:text-slate-200 font-bold">
                            <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                            <span>{c.metricas.staffFavorito.agenteNombre}</span>
                            <span className="text-[10px] text-gray-400 font-normal">({c.metricas.staffFavorito.atenciones})</span>
                          </div>
                        ) : c.agente_asignado ? (
                          <span className="text-gray-600 dark:text-slate-400 text-xs font-semibold">
                            {c.agente_asignado}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Rotativo</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.celular && (
                            <a
                              href={`https://wa.me/51${c.celular.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition"
                              title="Enviar WhatsApp"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </a>
                          )}
                          <Link
                            href={`/recepcion/historial?cliente=${encodeURIComponent(c.nombre)}`}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition"
                            title="Ver Historial OATC"
                          >
                            <FileText className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
