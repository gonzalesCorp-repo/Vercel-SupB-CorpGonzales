'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { LiquidacionPersonal } from '@/types/liquidaciones';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Scissors, Package, FileText, Printer, User } from 'lucide-react';
import { imprimirVoucherLiquidacionPersonal } from '@/services/impresionTermica';
import { useUIStore } from '@/store/useUIStore';

interface DetalleLiquidacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  liquidacion: LiquidacionPersonal;
}

export function DetalleLiquidacionModal({
  isOpen,
  onClose,
  liquidacion
}: DetalleLiquidacionModalProps) {
  const { showAlert } = useUIStore();

  const handleReimprimir = async () => {
    try {
      await imprimirVoucherLiquidacionPersonal({
        numeroCorrelativo: liquidacion.numero_correlativo,
        colaboradorNombre: liquidacion.agente_nombre,
        rol: liquidacion.agente_rol,
        periodoInicio: liquidacion.periodo_inicio,
        periodoFin: liquidacion.periodo_fin,
        tipoRemuneracion: liquidacion.tipo_remuneracion,
        sueldoBase: Number(liquidacion.monto_sueldo_base || 0),
        comisionServicios: Number(liquidacion.monto_comisiones_servicios || 0),
        comisionProductos: Number(liquidacion.monto_comisiones_productos || 0),
        propinas: Number(liquidacion.monto_propinas || 0),
        adelantosDeducidos: Number(liquidacion.monto_adelantos_deducidos || 0),
        totalNeto: Number(liquidacion.monto_total_neto),
        cuentaPagoNombre: liquidacion.cuenta_pago_nombre || 'Caja Chica',
        aprobadoPor: liquidacion.aprobado_por || 'Administración',
        itemsCount: liquidacion.items?.length
      });
      showAlert('¡Voucher enviado a la impresora térmica!', 'success');
    } catch (e: any) {
      showAlert('Error al reimprimir: ' + e.message, 'error');
    }
  };

  const items = liquidacion.items || [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📄 Desglose de Liquidación: ${liquidacion.numero_correlativo}`}>
      <div className="space-y-4 text-slate-800 dark:text-slate-100">
        
        {/* Header Colaborador & Estado */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-base">
              {liquidacion.agente_nombre}
            </h4>
            <span className="text-xs text-slate-400 font-bold block">
              {liquidacion.agente_rol} • Período: {liquidacion.periodo_inicio} al {liquidacion.periodo_fin}
            </span>
          </div>

          <div className="text-right">
            <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border ${
              liquidacion.estado === 'PAGADO'
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300'
                : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
            }`}>
              {liquidacion.estado}
            </span>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
              S/ {Number(liquidacion.monto_total_neto).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Tabla de Ítems Auditados */}
        <div>
          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Servicios & Ventas Incluidas en esta Liquidación ({items.length})
          </h5>

          <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            {items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Liquidación basada en Sueldo Base Fijo / Sin desglose de servicios individuales.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 font-bold uppercase sticky top-0">
                  <tr>
                    <th className="px-3 py-2">Fecha</th>
                    <th className="px-3 py-2">Ítem / Servicio</th>
                    <th className="px-3 py-2">Cliente</th>
                    <th className="px-3 py-2 text-right">Venta</th>
                    <th className="px-3 py-2 text-right">% Com</th>
                    <th className="px-3 py-2 text-right">Neto Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((it, idx) => (
                    <tr key={it.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">
                        {format(new Date(it.fecha_servicio), 'dd/MM HH:mm', { locale: es })}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                        {it.tipo_item === 'SERVICIO' ? (
                          <Scissors className="w-3 h-3 text-indigo-500 shrink-0" />
                        ) : (
                          <Package className="w-3 h-3 text-emerald-500 shrink-0" />
                        )}
                        <span>{it.descripcion}</span>
                      </td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">
                        {it.cliente_nombre || 'Cliente Final'}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-500">
                        S/ {Number(it.monto_venta).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-300">
                        {Number(it.porcentaje_aplicado)}%
                      </td>
                      <td className="px-3 py-2 text-right font-black text-emerald-600 dark:text-emerald-400">
                        S/ {Number(it.monto_comision).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleReimprimir}
            className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Reimprimir Voucher Térmico</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </Modal>
  );
}
