'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, 
  Lock, RefreshCw, Eye, Calendar, Scissors, Sparkles, ArrowRight 
} from 'lucide-react';
import { LiquidacionPersonal } from '@/types/liquidaciones';
import { LiquidacionesPreAuditorOpal } from '@/components/finanzas/LiquidacionesPreAuditorOpal';
import { AdminPinModal } from './AdminPinModal';
import { useUIStore } from '@/store/useUIStore';

export interface AdminFinanzasMobileTabProps {
  sedeId: string;
  agenteId: string;
  liquidaciones: LiquidacionPersonal[];
  onRefrescar: () => void;
  onPagarLiquidacion: (liq: LiquidacionPersonal) => Promise<void>;
}

export function AdminFinanzasMobileTab({
  sedeId,
  agenteId,
  liquidaciones,
  onRefrescar,
  onPagarLiquidacion
}: AdminFinanzasMobileTabProps) {
  const { showAlert } = useUIStore();
  const [liqSeleccionadaParaPin, setLiqSeleccionadaParaPin] = useState<LiquidacionPersonal | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const pendientes = liquidaciones.filter(l => l.estado !== 'PAGADO' && l.estado !== 'ANULADO');
  const pagadas = liquidaciones.filter(l => l.estado === 'PAGADO');
  const totalPendiente = pendientes.reduce((acc, l) => acc + Number(l.monto_total_neto || 0), 0);

  const handleIniciarPago = (liq: LiquidacionPersonal) => {
    setLiqSeleccionadaParaPin(liq);
    setPinModalOpen(true);
  };

  const handleConfirmarPagoPin = async () => {
    if (!liqSeleccionadaParaPin) return;
    setProcesando(true);
    try {
      await onPagarLiquidacion(liqSeleccionadaParaPin);
      showAlert(`¡Liquidación #${liqSeleccionadaParaPin.numero_correlativo} aprobada y pagada con éxito!`, 'success');
      onRefrescar();
    } catch (e: any) {
      showAlert('Error al procesar pago: ' + e.message, 'error');
    } finally {
      setProcesando(false);
      setLiqSeleccionadaParaPin(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      
      {/* 🔮 PRE-AUDITOR 360° OPAL AI */}
      {pendientes.length > 0 && (
        <LiquidacionesPreAuditorOpal
          liquidacionesPendientes={pendientes}
          onLoteAprobado={() => {
            showAlert('Lote pre-auditado conforme por Opal AI.', 'success');
          }}
        />
      )}

      {/* KPI de Monto Pendiente */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
            Desembolso Pendiente ({pendientes.length})
          </span>
          <p className="text-2xl font-black text-amber-500 font-mono mt-0.5">
            S/ {totalPendiente.toFixed(2)}
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
          <DollarSign className="w-6 h-6" />
        </div>
      </div>

      {/* Lista de Liquidaciones Pendientes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
            Solicitudes por Liberar ({pendientes.length})
          </span>
          <button
            type="button"
            onClick={onRefrescar}
            className="text-xs text-indigo-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Actualizar
          </button>
        </div>

        {pendientes.length === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
            <p className="font-bold">Todas las liquidaciones están al día.</p>
            <p className="text-[11px] text-slate-500 mt-1">No hay solicitudes pendientes de autorización.</p>
          </div>
        ) : (
          pendientes.map(l => (
            <div
              key={l.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center font-bold text-xs">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {l.agente_nombre}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      #{l.numero_correlativo} • {l.agente_rol || 'STAFF'}
                    </span>
                  </div>
                </div>

                <span className="text-sm font-black text-slate-900 dark:text-white font-mono">
                  S/ {Number(l.monto_total_neto || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Com. Serv.: <strong>S/ {Number(l.monto_comisiones_servicios || 0).toFixed(2)}</strong></span>
                <span>Com. Prod.: <strong>S/ {Number(l.monto_comisiones_productos || 0).toFixed(2)}</strong></span>
              </div>

              {/* Botón de Autorización por PIN */}
              <button
                type="button"
                disabled={procesando}
                onClick={() => handleIniciarPago(l)}
                className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Autorizar & Pagar con PIN</span>
              </button>
            </div>
          ))
        )}
      </div>

      {/* PIN Modal para Autorización */}
      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={() => {
          setPinModalOpen(false);
          setLiqSeleccionadaParaPin(null);
        }}
        onSuccess={handleConfirmarPagoPin}
        agenteId={agenteId}
        accion="PAGO_LIQUIDACION"
        titulo="Autorizar Desembolso"
        descripcion={`Ingresa tu PIN de 4 dígitos para autorizar el pago de S/ ${Number(liqSeleccionadaParaPin?.monto_total_neto || 0).toFixed(2)} a ${liqSeleccionadaParaPin?.agente_nombre}.`}
      />

    </div>
  );
}
