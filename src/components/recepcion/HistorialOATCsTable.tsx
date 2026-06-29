'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, Clock, CheckCircle2, XCircle, UserCircle2, ArrowRight } from 'lucide-react';
import { obtenerHistorialOatcs, OATC } from '@/services/recepcion';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Modal } from '@/components/ui/Modal';

export default function HistorialOATCsTable() {
  const [oatcs, setOatcs] = useState<OATC[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  
  // Modal states
  const [selectedOatc, setSelectedOatc] = useState<OATC | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const cargarDatos = async () => {
    setIsLoading(true);
    
    // Si hay fecha fin, le agregamos 23:59:59 para que incluya todo el día
    let fechaFinAjustada = fechaFin;
    if (fechaFin) {
      fechaFinAjustada = `${fechaFin}T23:59:59.999Z`;
    }
    
    let fechaInicioAjustada = fechaInicio;
    if (fechaInicio) {
      fechaInicioAjustada = `${fechaInicio}T00:00:00.000Z`;
    }

    const data = await obtenerHistorialOatcs(fechaInicioAjustada, fechaFinAjustada);
    setOatcs(data);
    setIsLoading(false);
  };

  useEffect(() => {
    // Por defecto inicializamos con la fecha de hoy
    const hoy = new Date();
    const hoyStr = format(hoy, 'yyyy-MM-dd');
    setFechaInicio(hoyStr);
    setFechaFin(hoyStr);
  }, []);

  // Cargar datos cuando cambien las fechas
  useEffect(() => {
    if (fechaInicio !== '' && fechaFin !== '') {
      cargarDatos();
    }
  }, [fechaInicio, fechaFin]);

  const getServicios = (puntoPartida: any[]) => {
    if (!puntoPartida || !Array.isArray(puntoPartida)) return 'Sin servicios';
    return puntoPartida.map(p => p.nombre).join(', ');
  };

  const formatearFecha = (dateStr?: string) => {
    if (!dateStr) return '-';
    return format(new Date(dateStr), "dd MMM, HH:mm", { locale: es });
  };

  const renderBadgeEstado = (estado?: string) => {
    if (estado === 'FINALIZADO' || estado === 'PRE_COBRADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {estado}
        </span>
      );
    }
    if (estado === 'CANCELADO') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-red-50 text-red-700 border border-red-100">
          <XCircle className="w-3.5 h-3.5" />
          {estado}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
        <Clock className="w-3.5 h-3.5" />
        {estado}
      </span>
    );
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)]">
        {/* Header and Filters */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Historial de Órdenes de Atención</h3>
              <p className="text-slate-500 text-sm mt-1">Consulta el registro histórico de todas las atenciones.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                <Calendar className="w-4 h-4 text-slate-400 mr-2" />
                <input 
                  type="date" 
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-32"
                />
                <span className="text-slate-400 mx-2">-</span>
                <input 
                  type="date" 
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 outline-none w-32"
                />
              </div>
              <button 
                onClick={cargarDatos}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors border border-slate-200"
                title="Actualizar"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Table Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-indigo-600 font-medium">
                <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                Cargando historial...
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm relative">
              <thead className="bg-white text-slate-500 font-semibold text-xs uppercase tracking-wider sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4">Fecha/Hora</th>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Servicios</th>
                  <th className="px-6 py-4">Staff Asignado</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {oatcs.length > 0 ? oatcs.map((oatc) => (
                  <tr key={oatc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 font-medium">
                      {formatearFecha(oatc.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                          <UserCircle2 className="w-5 h-5" />
                        </div>
                        <span className="font-semibold text-slate-700">{oatc.cliente_nombre}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {getServicios(oatc.punto_partida)}
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">
                      {oatc.agente_nombre || <span className="text-slate-400 font-normal italic">Sin asignar</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderBadgeEstado(oatc.estado_proceso)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOatc(oatc);
                          setIsModalOpen(true);
                        }}
                        className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-colors border border-transparent hover:border-indigo-100 inline-flex"
                        title="Ver Detalles"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <Search className="w-10 h-10 text-slate-200 mb-3" />
                        <p className="text-base font-medium text-slate-600">No se encontraron atenciones</p>
                        <p className="text-sm mt-1">Intenta con otro rango de fechas.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Resumen de la Orden"
        maxWidth="max-w-md"
      >
        {selectedOatc && (
          <div className="space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-sm text-slate-500 font-medium">Cliente</h4>
                <p className="text-lg font-bold text-slate-800">{selectedOatc.cliente_nombre}</p>
              </div>
              <div className="text-right">
                <h4 className="text-sm text-slate-500 font-medium">Fecha y Hora</h4>
                <p className="text-md font-mono font-medium text-slate-700">
                  {formatearFecha(selectedOatc.created_at)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Estado Final</h4>
              <div>{renderBadgeEstado(selectedOatc.estado_proceso)}</div>
              
              {selectedOatc.estado_proceso === 'CANCELADO' && selectedOatc.motivos_cancelacion && (
                <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">Motivo de Cancelación:</span>
                  <span className="text-sm text-red-800">
                    {(selectedOatc.motivos_cancelacion as any).motivo}
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Servicios Solicitados</h4>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100">
                {selectedOatc.punto_partida?.map((srv: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-slate-700">{srv.nombre}</span>
                    <span className="text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded text-xs">x1</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-slate-500 font-medium mb-2">Staff Responsable</h4>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5" />
                </div>
                <p className="font-bold text-slate-700">{selectedOatc.agente_nombre || 'Sin asignar'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
