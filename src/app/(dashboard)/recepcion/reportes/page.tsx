'use client';

import React, { useState } from 'react';
import { 
  Calendar, 
  RefreshCcw, 
  ShieldCheck, 
  Users, 
  Activity,
  AlertCircle
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { obtenerDatosReporteRecepcion, ReporteRecepcion } from '@/services/reportesRecepcion';
import { createClient } from '@/lib/supabase/client';

export default function RecepcionReportesPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<ReporteRecepcion | null>(null);
  
  const { sedeActiva } = useAppStore();

  const loadData = async () => {
    if (!sedeActiva?.id) return;
    setIsLoading(true);
    try {
      const data = await obtenerDatosReporteRecepcion(sedeActiva.id, fecha);
      setReportData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();

    // 🌟 Innovate: Supabase Realtime Subscription para OATC
    const supabase = createClient();
    const channel = supabase.channel('realtime-oatc')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'oatc', filter: `sede_id=eq.${sedeActiva?.id}` },
        (payload) => {
          console.log('Cambio detectado en OATC (Realtime):', payload);
          if (isRealtimeConnected) {
            loadData(); // Recargar datos automáticamente en background
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, sedeActiva?.id, isRealtimeConnected]);
  
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      
      {/* Header & Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900 text-white p-2 rounded-lg">
            <span className="font-bold text-xl px-1">G</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">GestiOn-Pro Corporate Overview</h1>
            <p className="text-xs text-slate-500">Control de Operaciones Modular en Salones de Belleza</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Fecha Operación</label>
            <div className="relative">
              <input 
                type="date" 
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="pl-3 pr-8 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filtrar por Asesor</label>
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 bg-white min-w-[180px] focus:ring-2 focus:ring-blue-500 outline-none">
              <option>[ Todos los Asesores ]</option>
            </select>
          </div>
          
          <div className="flex flex-col">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Filtrar por Categoría</label>
            <select className="px-3 py-1.5 border border-slate-200 rounded-md text-sm text-slate-700 bg-white min-w-[180px] focus:ring-2 focus:ring-blue-500 outline-none">
              <option>[ Todas las Categorías ]</option>
            </select>
          </div>

          <div className="flex flex-col ml-2">
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1 opacity-0">Sync</label>
            <button 
              onClick={() => { setIsRealtimeConnected(!isRealtimeConnected); loadData(); }}
              className="relative p-1.5 border border-slate-200 text-slate-500 rounded-md hover:bg-slate-50 hover:text-blue-600 transition-colors"
              title={isRealtimeConnected ? "Sincronizado en tiempo real" : "Conexión perdida. Clic para recargar."}
            >
              <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white ${isRealtimeConnected ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`}></span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center gap-2 mt-8 mb-4">
        <div className="w-4 h-4 bg-blue-500 rounded-sm"></div>
        <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Área de Recepción y Control de Turnos</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ease-in-out">
        {/* Card 1 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default group">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 group-hover:text-emerald-500 transition-colors">1. Balance de Atenciones</h3>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-3xl font-black text-slate-800">{reportData?.atencionesOk ?? '-'}</span>
            <span className="text-sm font-semibold text-emerald-500">Ok</span>
            <span className="text-slate-300 mx-1">/</span>
            <span className="text-lg font-bold text-red-500">{reportData?.atencionesFallas ?? '-'}</span>
            <span className="text-sm font-semibold text-red-500">Fallas</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Efectividad de Resolución:</span>
            <span className="font-bold text-slate-800">{reportData?.efectividad ?? 0}%</span>
          </div>
          <div className="absolute top-5 right-5 text-emerald-100 bg-emerald-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-6 h-6 text-emerald-500" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default group">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-blue-500 transition-colors">2. Personal en Sala por Especialidad</h3>
          <p className="text-[10px] text-slate-400 mb-5">Especialidades validadas con la hoja Agentes</p>
          
          <div className="flex flex-wrap gap-2">
            {reportData?.personalPorEspecialidad.map((p, idx) => {
              const colorBase = idx === 0 ? 'blue' : idx === 1 ? 'indigo' : 'slate';
              return (
                <span key={p.especialidad} className={`px-3 py-1 bg-${colorBase}-50 text-${colorBase}-600 text-xs font-semibold rounded-full border border-${colorBase}-100 flex items-center gap-1`}>
                  <span className={`w-1.5 h-1.5 rounded-full bg-${colorBase}-500`}></span>
                  {p.especialidad}: {p.cantidad}
                </span>
              );
            })}
          </div>
          <div className="absolute top-5 right-5 text-blue-100 bg-blue-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-blue-500" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-default group">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 group-hover:text-orange-500 transition-colors">3. Flujo Global / Turnos</h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl font-black text-slate-800">{reportData?.flujoGlobal?.total ?? 0}</span>
            <span className="text-sm font-medium text-slate-500">movimientos</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Clientes: {reportData?.flujoGlobal?.clientes ?? 0}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Turnos: {reportData?.flujoGlobal?.turnos ?? 0}
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
              Asesorías: {reportData?.flujoGlobal?.asesorias ?? 0}
            </div>
          </div>
          <div className="absolute top-5 right-5 text-indigo-100 bg-indigo-50 p-2 rounded-lg group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Auditoria Table */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 transition-all duration-300 hover:shadow-md">
          <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            4. Distribución de Reclamos por Categoría (Detalle de Auditoría)
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                <tr>
                  <th className="pb-3 font-semibold">Categoría (Col I)</th>
                  <th className="pb-3 font-semibold">Tipo OATC (Col C)</th>
                  <th className="pb-3 font-semibold">Agente (Col G)</th>
                  <th className="pb-3 font-semibold">Naturaleza (Col F)</th>
                  <th className="pb-3 font-semibold text-center">Estatus</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {reportData?.reclamos && reportData.reclamos.length > 0 ? (
                  reportData.reclamos.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="py-3 pr-2">{r.detalle_cancelacion || '-'}</td>
                      <td className="py-3 pr-2">{r.motivos_cancelacion?.motivo || '-'}</td>
                      <td className="py-3 pr-2">{r.agente_nombre || 'Desconocido'}</td>
                      <td className="py-3 pr-2">
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">{r.tipo_demanda || 'Reclamo'}</span>
                      </td>
                      <td className="py-3 text-center">
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px]">1</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} className="py-8 text-center text-slate-400 italic">No hay reclamos o fallas hoy.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ranking */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-slate-100 transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-2 max-w-[50%] leading-tight">
              <span>🏆</span>
              5. Ranking de Atenciones por Estilista / Asesor
            </h3>
            
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] font-bold uppercase text-slate-500 max-w-[40%]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-emerald-500 rounded-sm"></span>Cliente</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-sm"></span>Turno</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded-sm"></span>Especial/Prod/SC</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-500 rounded-sm"></span>Asesoría/Cita</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-500 rounded-sm"></span>Error/Corrección</span>
            </div>
          </div>

          <div className="space-y-6">
            {reportData?.rankingAgentes && reportData.rankingAgentes.length > 0 ? (
              reportData.rankingAgentes.map((agente, idx) => {
                const total = agente.total || 1; // prevent divide by zero visually
                const pctClientes = Math.round((agente.clientes / total) * 100);
                const pctTurnos = 100 - pctClientes;
                return (
                  <div key={agente.agente_nombre}>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                        <span className="text-xs font-bold text-slate-700">{agente.agente_nombre}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-800">{agente.total} Atenciones</span>
                    </div>
                    <div className="w-full h-3 flex rounded-full overflow-hidden mb-1">
                      {agente.clientes > 0 && <div className="bg-emerald-500 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${pctClientes}%` }}>{agente.clientes}</div>}
                      {agente.turnos > 0 && <div className="bg-blue-600 h-full flex items-center justify-center text-[8px] text-white font-bold" style={{ width: `${pctTurnos}%` }}>{agente.turnos}</div>}
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 rounded border border-emerald-100">{agente.clientes} Cliente</span>
                      <span className="text-[9px] text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">{agente.turnos} Turno</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-400 italic">No hay atenciones registradas hoy para generar el ranking.</div>
            )}
          </div>
        </div>

      </div>

      {/* Section Footer */}
      <div className="flex items-center gap-2 mt-8 mb-4">
        <div className="w-4 h-4 bg-emerald-500 rounded-sm flex items-center justify-center text-[10px] font-bold text-white">$</div>
        <h2 className="text-sm font-bold text-slate-700 tracking-wide uppercase">Área de Ventas (Sala y Retail ERP)</h2>
      </div>

    </div>
  );
}
