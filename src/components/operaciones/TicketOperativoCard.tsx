'use client';

import { PlayCircle, PlusCircle, Beaker, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { OATC } from '@/services/recepcion';
import { translateEstado } from '@/lib/utils';

export interface OATCExtended extends OATC {
  estado_ui?: 'Espera' | 'En Curso' | 'Finalizado';
  codigo_ticket?: string;
  cambios_pendientes?: any;
}

export interface TicketOperativoCardProps {
  oatc: OATCExtended;
  isPersonalMode: boolean;
  miAgenteId: string;
  handleActionClick: (oatc: OATCExtended, action: string) => void;
  openAddServiceModal: (oatc: OATCExtended) => void;
}

export default function TicketOperativoCard({
  oatc,
  isPersonalMode,
  miAgenteId,
  handleActionClick,
  openAddServiceModal
}: TicketOperativoCardProps) {
  const isEnCurso = oatc.estado_proceso === 'EN_CURSO' || oatc.estado_proceso === 'PRE_COBRADO';

  return (
    <div className={`bg-white rounded-2xl border ${isEnCurso ? 'border-indigo-200 shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden transition-all`}>
      {/* Info Header */}
      <div className={`p-4 border-b ${isEnCurso ? 'bg-indigo-50' : 'bg-gray-50'} flex justify-between items-start`}>
        <div>
          {oatc.codigo_ticket && (
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
              {oatc.codigo_ticket}
            </span>
          )}
          <h3 className="text-xl font-black text-gray-800 mt-0.5">{oatc.cliente_nombre}</h3>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-semibold text-gray-400">Atendido por:</span> {oatc.agente_nombre}
          </p>
        </div>
        <div>
          {oatc.estado_proceso === 'PENDIENTE_CONFIRMACION' ? (
            <span className="px-3 py-1 bg-orange-100 text-orange-700 font-bold text-xs rounded-full uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> Autorización Pndte
            </span>
          ) : isEnCurso ? (
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-xs rounded-full uppercase tracking-widest flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> {oatc.estado_proceso === 'PRE_COBRADO' ? 'Pagado y En Curso' : 'En Curso'}
            </span>
          ) : (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 font-bold text-xs rounded-full uppercase tracking-widest">
              {translateEstado(oatc.estado_proceso)}
            </span>
          )}
        </div>
      </div>

      {/* Servicios */}
      <div className="p-4 bg-white">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Servicios Solicitados</p>
        <ul className="space-y-1 mb-4">
          {oatc.punto_partida?.map((srv: any, i: number) => (
            <li key={i} className="flex justify-between items-center text-sm font-medium text-gray-700 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
              <span>{srv.nombre}</span>
              <span className="text-gray-400 font-bold">x{srv.cantidad || 1}</span>
            </li>
          ))}
        </ul>

        {/* Panel de Botones Táctiles */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          {!isEnCurso && oatc.estado_proceso !== 'PENDIENTE_INICIO' && (
            <button
              onClick={() => handleActionClick(oatc, 'START_ATTENTION')}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <PlayCircle className="w-5 h-5" /> Iniciar
            </button>
          )}

          {isEnCurso && oatc.estado_proceso !== 'PENDIENTE_TERMINO' && (
            <>
              <button
                onClick={() => openAddServiceModal(oatc)}
                className="flex-1 bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 text-gray-600 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <PlusCircle className="w-5 h-5" /> Extra / Editar
              </button>

              <button
                onClick={() => handleActionClick(oatc, 'LAB')}
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                title="Laboratorio"
              >
                <Beaker className="w-5 h-5" /> Lab
              </button>

              {oatc.estado_pago !== 'Pagado' && oatc.estado_pago !== 'COBRADO' && oatc.estado_proceso !== 'PENDIENTE_PRE_COBRO' && oatc.estado_proceso !== 'PRE_COBRADO' && (
                <button
                  onClick={() => handleActionClick(oatc, 'PRE_COBRO')}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CreditCard className="w-5 h-5" /> Pre-Cobrar
                </button>
              )}

              <button
                onClick={() => handleActionClick(oatc, 'END_ATTENTION')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle className="w-5 h-5" /> Terminar
              </button>
            </>
          )}

          {oatc.estado_proceso === 'PENDIENTE_INICIO' && (
            <div className="w-full text-center text-sm font-bold text-indigo-600 bg-indigo-50 py-3 rounded-xl border border-indigo-200 animate-pulse">
              ⏳ Esperando autorización para Iniciar...
            </div>
          )}
          {oatc.estado_proceso === 'PENDIENTE_PRE_COBRO' && (
            <div className="w-full text-center text-sm font-bold text-orange-600 bg-orange-50 py-3 rounded-xl border border-orange-200 animate-pulse">
              ⏳ Esperando autorización de Pre-Cobro...
            </div>
          )}
          {oatc.estado_proceso === 'PENDIENTE_TERMINO' && (
            <div className="w-full text-center text-sm font-bold text-emerald-600 bg-emerald-50 py-3 rounded-xl border border-emerald-200 animate-pulse">
              ⏳ Esperando autorización para Terminar...
            </div>
          )}

          {oatc.cambios_pendientes?.motivo_rechazo && (
            <div className="w-full mt-2 text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
              <p className="flex items-center gap-1"><XCircle className="w-4 h-4" /> Solicitud Rechazada</p>
              <p className="font-normal mt-1">{oatc.cambios_pendientes.motivo_rechazo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
