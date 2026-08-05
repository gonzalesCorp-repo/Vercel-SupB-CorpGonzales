'use client';

import React, { useState, useEffect } from 'react';
import { PlayCircle, PlusCircle, Beaker, CreditCard, CheckCircle, XCircle, AlertTriangle, Edit2 } from 'lucide-react';
import { OATC } from '@/services/recepcion';
import { translateEstado } from '@/lib/utils';
import { buscarClientes, Cliente } from '@/services/clientes';

export interface OATCExtended extends OATC {
  estado_ui?: 'Espera' | 'En Curso' | 'Finalizado';
  codigo_ticket?: string;
  cambios_pendientes?: any;
}

export interface TicketOperativoCardProps {
  oatc: OATCExtended;
  isPersonalMode: boolean;
  miAgenteId: string;
  handleActionClick: (oatc: OATCExtended, action: string, payload?: any) => void;
  openAddServiceModal: (oatc: OATCExtended) => void;
}

export default function TicketOperativoCard({
  oatc,
  isPersonalMode,
  miAgenteId,
  handleActionClick,
  openAddServiceModal
}: TicketOperativoCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);
  const [clientSuggestions, setClientSuggestions] = useState<Cliente[]>([]);

  useEffect(() => {
    if (oatc) {
      setNewName(oatc.cliente_nombre || '');
      setSelectedClienteId(oatc.cliente_id || null);
    }
  }, [oatc]);

  useEffect(() => {
    if (!isEditingName || !newName.trim() || newName.length < 2) {
      setClientSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      const results = await buscarClientes(newName.trim());
      setClientSuggestions(results);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [newName, isEditingName]);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    await handleActionClick(oatc, 'EDIT_CLIENT_NAME', {
      nuevoNombre: newName.trim(),
      nuevoClienteId: selectedClienteId
    });
    setIsEditingName(false);
    setClientSuggestions([]);
  };

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
          {isEditingName ? (
            <div className="relative mt-2 w-full max-w-[280px]">
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setSelectedClienteId(null);
                  }}
                  placeholder="Nombre del cliente..."
                  className="bg-white border border-indigo-300 rounded-xl px-3 py-1 text-sm text-gray-800 focus:outline-none focus:border-indigo-500 font-bold w-full"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setNewName(oatc.cliente_nombre || '');
                    setSelectedClienteId(oatc.cliente_id || null);
                    setIsEditingName(false);
                    setClientSuggestions([]);
                  }}
                  className="px-2.5 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer"
                >
                  X
                </button>
              </div>

              {clientSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-100">
                  {clientSuggestions.map((cli) => (
                    <div
                      key={cli.id}
                      onClick={() => {
                        setNewName(cli.nombre);
                        setSelectedClienteId(cli.id || null);
                        setClientSuggestions([]);
                      }}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-left transition-colors"
                    >
                      <p className="text-xs font-bold text-gray-800">{cli.nombre}</p>
                      <p className="text-[10px] text-gray-400">
                        {cli.dni ? `DNI: ${cli.dni}` : ''} {cli.celular ? `| Cel: ${cli.celular}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-0.5">
              <h3 className="text-xl font-black text-gray-800">{oatc.cliente_nombre}</h3>
              <button
                onClick={() => {
                  setNewName(oatc.cliente_nombre || '');
                  setSelectedClienteId(oatc.cliente_id || null);
                  setIsEditingName(true);
                }}
                className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Editar nombre de cliente"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
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

          {oatc.cambios_pendientes?.tipo === 'SOLICITUD_CANCELACION' && (
            <div className="w-full mt-2 text-sm font-bold text-red-600 bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
              <p className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" /> Solicitud de Cancelación Pendiente</p>
              {oatc.cambios_pendientes?.detalle && (
                <p className="font-normal mt-1 text-xs text-red-700">Motivo: {oatc.cambios_pendientes.detalle}</p>
              )}
              {!isPersonalMode && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleActionClick(oatc, 'APPROVE_CANCEL')}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    Aprobar
                  </button>
                  <button
                    onClick={() => handleActionClick(oatc, 'REJECT_CANCEL')}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    Rechazar
                  </button>
                </div>
              )}
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
