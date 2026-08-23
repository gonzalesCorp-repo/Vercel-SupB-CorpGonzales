'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, FileText, Plus, Save, Calendar, Building2, 
  DollarSign, Calculator, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { 
  CondicionPagoCompra, 
  TipoComprobanteCompra 
} from '@/types/facturasCompras';
import { CuentaFinanciera } from '@/types/finanzas';
import { 
  registrarFacturaCompra, 
  calcularFechaVencimiento 
} from '@/services/facturasCompras';
import { useUIStore } from '@/store/useUIStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  cuentas: CuentaFinanciera[];
  sedeId?: string;
  adminNombre?: string;
  onFacturaCreada?: () => void;
}

export function NuevaFacturaCompraModal({
  isOpen,
  onClose,
  cuentas,
  sedeId,
  adminNombre,
  onFacturaCreada
}: Props) {
  const hoy = new Date().toISOString().split('T')[0];

  const [proveedorRuc, setProveedorRuc] = useState('');
  const [proveedorRazonSocial, setProveedorRazonSocial] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteCompra>('FACTURA');
  const [serie, setSerie] = useState('F001');
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState(hoy);
  const [condicionPago, setCondicionPago] = useState<CondicionPagoCompra>('CREDITO_30D');
  const [fechaVencimiento, setFechaVencimiento] = useState(calcularFechaVencimiento(hoy, 'CREDITO_30D'));
  
  // Montos
  const [subtotal, setSubtotal] = useState<number>(0);
  const [igv, setIgv] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  
  // Cuenta para pago al contado
  const [cuentaPagoId, setCuentaPagoId] = useState<string>('');
  const [categoriaGasto, setCategoriaGasto] = useState('PAGO_PROVEEDOR');
  const [notas, setNotas] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (cuentas.length > 0 && !cuentaPagoId) {
      setCuentaPagoId(cuentas[0].id);
    }
  }, [cuentas]);

  // Recalcular vencimiento cuando cambie fecha o condición
  useEffect(() => {
    if (condicionPago !== 'CREDITO_CUOTAS') {
      setFechaVencimiento(calcularFechaVencimiento(fechaEmision, condicionPago));
    }
  }, [fechaEmision, condicionPago]);

  // Manejo de cálculo de IGV y Total
  const handleSubtotalChange = (val: number) => {
    setSubtotal(val);
    if (tipoComprobante === 'FACTURA') {
      const calcIgv = Number((val * 0.18).toFixed(2));
      setIgv(calcIgv);
      setTotal(Number((val + calcIgv).toFixed(2)));
    } else {
      setIgv(0);
      setTotal(val);
    }
  };

  const handleTotalChange = (val: number) => {
    setTotal(val);
    if (tipoComprobante === 'FACTURA') {
      const calcSub = Number((val / 1.18).toFixed(2));
      setSubtotal(calcSub);
      setIgv(Number((val - calcSub).toFixed(2)));
    } else {
      setSubtotal(val);
      setIgv(0);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorRuc.trim() || !proveedorRazonSocial.trim() || !numero.trim() || total <= 0) {
      showAlert('Por favor completa los datos del proveedor, número de factura y monto total.', 'error');
      return;
    }

    if (condicionPago === 'CONTADO' && !cuentaPagoId) {
      showAlert('Debes seleccionar una cuenta financiera para el pago al contado.', 'error');
      return;
    }

    setGuardando(true);
    try {
      await registrarFacturaCompra({
        sedeId: sedeId || 'general',
        proveedorRuc,
        proveedorRazonSocial,
        tipoComprobante,
        serie,
        numero,
        fechaEmision,
        condicionPago,
        fechaVencimiento,
        subtotal,
        igv,
        total,
        cuentaPagoId: condicionPago === 'CONTADO' ? cuentaPagoId : undefined,
        categoriaGasto,
        notas,
        registradoPor: adminNombre || 'Administrador'
      });

      showAlert(`¡Factura ${serie}-${numero} registrada con éxito!`, 'success');
      if (onFacturaCreada) onFacturaCreada();
      onClose();
    } catch (err: any) {
      showAlert('Error al registrar factura: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-white">
                Registrar Factura de Compra / Proveedor
              </h2>
              <p className="text-xs text-slate-500">
                Registra compras al contado o programa pagos a crédito (15, 30, 45, 60 días).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          
          {/* Datos del Proveedor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                RUC Proveedor
              </label>
              <input
                type="text"
                required
                maxLength={11}
                placeholder="20512345678"
                value={proveedorRuc}
                onChange={(e) => setProveedorRuc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-mono font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Razón Social / Proveedor
              </label>
              <input
                type="text"
                required
                placeholder="Ej. L'Oréal Perú S.A."
                value={proveedorRazonSocial}
                onChange={(e) => setProveedorRazonSocial(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Tipo de Comprobante, Serie y Número */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tipo Comprobante
              </label>
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value as TipoComprobanteCompra)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
              >
                <option value="FACTURA">Factura Electrónica</option>
                <option value="BOLETA">Boleta de Venta</option>
                <option value="RECIBO_HONORARIOS">Recibo por Honorarios</option>
                <option value="NOTA_CREDITO">Nota de Crédito</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Serie
              </label>
              <input
                type="text"
                required
                placeholder="F001"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white uppercase focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Número
              </label>
              <input
                type="text"
                required
                placeholder="004821"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Fechas y Condición de Pago */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Fecha Emisión
              </label>
              <input
                type="date"
                required
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Condición de Pago
              </label>
              <select
                value={condicionPago}
                onChange={(e) => setCondicionPago(e.target.value as CondicionPagoCompra)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                <option value="CONTADO">💵 Al Contado (Inmediato)</option>
                <option value="CREDITO_15D">⏳ Crédito a 15 Días</option>
                <option value="CREDITO_30D">⏳ Crédito a 30 Días</option>
                <option value="CREDITO_45D">⏳ Crédito a 45 Días</option>
                <option value="CREDITO_60D">⏳ Crédito a 60 Días</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                Fecha Vencimiento
              </label>
              <input
                type="date"
                required
                disabled={condicionPago === 'CONTADO'}
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 outline-none disabled:opacity-60"
              />
            </div>
          </div>

          {/* Desglose de Montos */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Subtotal (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={subtotal || ''}
                onChange={(e) => handleSubtotalChange(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                IGV 18% (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={igv || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setIgv(val);
                  setTotal(Number((subtotal + val).toFixed(2)));
                }}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                Total Factura (S/)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={total || ''}
                onChange={(e) => handleTotalChange(Number(e.target.value))}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-sm font-black text-emerald-600 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Si es al CONTADO, seleccionar cuenta de salida */}
          {condicionPago === 'CONTADO' && (
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                💵 Salida Inmediata de Dinero (Al Contado)
              </span>
              <select
                value={cuentaPagoId}
                onChange={(e) => setCuentaPagoId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none cursor-pointer"
              >
                {cuentas.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Saldo: S/ {Number(c.saldo_actual).toFixed(2)})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-emerald-700/80 block">
                Se debitará de inmediato el total y quedará reflejado en la Bandeja de Cuadre del Día.
              </span>
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Registrar Compra'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
