'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Receipt, CreditCard, QrCode, CheckCircle2, 
  AlertCircle, Users, Split, ShieldCheck, Lock, Unlock, 
  Printer, ArrowRight, X, Plus, RefreshCw, Sparkles, Scale,
  Scissors, Package, FileText, Check
} from 'lucide-react';
import { 
  SesionCaja, ComprobantePago, PagoDetalle, 
  obtenerSesionCajaActiva, abrirSesionCaja, cerrarSesionCajaCiega, 
  obtenerOrdenesPorCobrar, procesarCobroFlexible 
} from '@/services/caja';
import { ItemTicket } from '@/services/tickets';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { imprimirTicketTermicoHtml } from '@/lib/hardware/thermalPrinter';

export function CajaPosFlexibleView() {
  const [sesionActiva, setSesionActiva] = useState<SesionCaja | null>(null);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [feedback, setFeedback] = useState('');

  // Selección de órdenes para cobro agrupado
  const [oatcSeleccionadasIds, setOatcSeleccionadasIds] = useState<string[]>([]);
  
  // Modales
  const [modalAperturaOpen, setModalAperturaOpen] = useState(false);
  const [modalCierreCiegoOpen, setModalCierreCiegoOpen] = useState(false);
  const [modalComprobanteEmitido, setModalComprobanteEmitido] = useState<ComprobantePago | null>(null);

  // Formulario de Apertura
  const [montoAperturaInput, setMontoAperturaInput] = useState<number>(150);
  const [cajeroNombre, setCajeroNombre] = useState('Sócrates (Caja)');

  // Formulario de Cierre Ciego (Conteo físico)
  const [conteoEfectivo, setConteoEfectivo] = useState<{ [key: string]: number }>({
    '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0, '0.5': 0
  });
  const [reporteCierre, setReporteCierre] = useState<any | null>(null);

  // Formulario de Cobro
  const [tipoComprobante, setTipoComprobante] = useState<'BOLETA' | 'FACTURA' | 'NOTA_VENTA'>('BOLETA');
  const [clienteNombreInput, setClienteNombreInput] = useState('');
  const [clienteDocInput, setClienteDocInput] = useState('');
  const [tipoDocInput, setTipoDocInput] = useState('DNI');
  
  // Medios de pago mixtos
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [montoTarjeta, setMontoTarjeta] = useState<number>(0);
  const [montoYape, setMontoYape] = useState<number>(0);
  const [montoTransf, setMontoTransf] = useState<number>(0);
  const [isProcessingCobro, setIsProcessingCobro] = useState(false);
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const [sesion, listaOrdenes] = await Promise.all([
        obtenerSesionCajaActiva(),
        obtenerOrdenesPorCobrar(sedeActiva?.id)
      ]);
      setSesionActiva(sesion);
      setOrdenes(listaOrdenes);

      // Auto-seleccionar primera orden si hay órdenes y no hay selección
      if (listaOrdenes.length > 0 && oatcSeleccionadasIds.length === 0) {
        setOatcSeleccionadasIds([listaOrdenes[0].id]);
        setClienteNombreInput(listaOrdenes[0].cliente_nombre);
        setClienteDocInput(listaOrdenes[0].cliente_doc || '72918234');
      } else if (listaOrdenes.length === 0) {
        setOatcSeleccionadasIds([]);
        setClienteNombreInput('');
        setClienteDocInput('');
      }
    } catch (e) {
      console.error('Error cargando datos de caja:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    const supabase = createClient();
    const sedeKey = sedeActiva?.id || 'default';
    const channel = supabase.channel(`realtime-caja-pos-${sedeKey}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc_tickets' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sesiones_caja' }, () => cargarDatos())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeActiva?.id]);

  // Calcular ítems consolidados de las órdenes seleccionadas
  const ordenesSeleccionadas = ordenes.filter(o => oatcSeleccionadasIds.includes(o.id));
  
  const itemsConsolidados: ItemTicket[] = ordenesSeleccionadas.flatMap(o => {
    if (o.tickets && o.tickets.length > 0) {
      return o.tickets.flatMap((t: any) => t.items || []);
    }
    return (o.punto_partida || []).map((p: any) => ({
      nombre: p.nombre,
      tipo: p.tipo_bien || 'servicio',
      precio_base: p.precio || 0,
      precio_final: p.precio || 0,
      cantidad: p.cantidad || 1,
      es_cortesia: false
    }));
  });

  const totalAPagar = itemsConsolidados.reduce((acc, i) => acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1)), 0);
  const totalCortesias = itemsConsolidados.filter(i => i.es_cortesia).reduce((acc, i) => acc + (Number(i.precio_base || 0) * Number(i.cantidad || 1)), 0);

  // Sincronizar monto en efectivo por defecto con el total
  useEffect(() => {
    setMontoEfectivo(totalAPagar);
    setEfectivoRecibido(totalAPagar);
    setMontoTarjeta(0);
    setMontoYape(0);
    setMontoTransf(0);
  }, [totalAPagar]);

  const totalMediosPago = Number(montoEfectivo || 0) + Number(montoTarjeta || 0) + Number(montoYape || 0) + Number(montoTransf || 0);
  const vueltoCalculado = Math.max(0, Number(efectivoRecibido || 0) - Number(montoEfectivo || 0));

  // Toggle de selección de orden para pago agrupado
  const handleToggleOatc = (id: string) => {
    setOatcSeleccionadasIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        if (prev.length === 1) return prev; // Mantener al menos 1
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  // Apertura de Caja
  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sesion = await abrirSesionCaja({
        cajeroNombre,
        montoApertura: montoAperturaInput
      });
      setSesionActiva(sesion);
      setModalAperturaOpen(false);
      setFeedback('¡Turno de caja abierto con éxito!');
      setTimeout(() => setFeedback(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // Cierre Ciego de Caja
  const handleCerrarCajaCiega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionActiva) return;

    // Calcular total contado
    const totalContado = Object.entries(conteoEfectivo).reduce((acc, [den, cant]) => {
      return acc + (Number(den) * Number(cant || 0));
    }, 0);

    try {
      const res = await cerrarSesionCajaCiega({
        sesionId: sesionActiva.id,
        montoCierreReal: totalContado
      });
      setReporteCierre(res);
      setSesionActiva(null);
      setFeedback('¡Arqueo ciego completado!');
    } catch (e) {
      console.error(e);
    }
  };

  // Procesar Cobro
  const handleEjecutarCobro = async () => {
    if (itemsConsolidados.length === 0 || !clienteNombreInput.trim()) return;
    if (Math.abs(totalMediosPago - totalAPagar) > 0.1) {
      alert(`La suma de los medios de pago (S/ ${totalMediosPago.toFixed(2)}) debe coincidir con el total a pagar (S/ ${totalAPagar.toFixed(2)}).`);
      return;
    }

    setIsProcessingCobro(true);
    try {
      const pagos: PagoDetalle[] = [];
      if (montoEfectivo > 0) pagos.push({ metodo: 'EFECTIVO', monto: montoEfectivo });
      if (montoTarjeta > 0) pagos.push({ metodo: 'TARJETA', monto: montoTarjeta });
      if (montoYape > 0) pagos.push({ metodo: 'YAPE', monto: montoYape });
      if (montoTransf > 0) pagos.push({ metodo: 'TRANSFERENCIA', monto: montoTransf });

      const comprobante = await procesarCobroFlexible({
        sesionCajaId: sesionActiva?.id,
        oatcIds: oatcSeleccionadasIds,
        tipoComprobante,
        clienteNombre: clienteNombreInput,
        clienteDoc: clienteDocInput,
        tipoDoc: tipoDocInput,
        items: itemsConsolidados,
        pagos,
        cajeroNombre: sesionActiva?.cajero_nombre || 'Cajero'
      });

      setModalComprobanteEmitido(comprobante);
      setFeedback(`¡Comprobante ${comprobante.serie}-${comprobante.numero} emitido con éxito!`);
      setOatcSeleccionadasIds([]);
      cargarDatos();
      setTimeout(() => setFeedback(''), 4000);
    } catch (e) {
      console.error('Error procesando cobro:', e);
    } finally {
      setIsProcessingCobro(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans p-4">
      
      {/* Header Caja POS & Estado de Sesión */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Punto de Venta & Finanzas POS
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-2 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-500" /> Caja POS Omnicanal (Split Billing & Agrupación)
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400">
            Cobranza consolidada de órdenes de atención, división de comprobantes y arqueo ciego.
          </p>
        </div>

        {/* Estado de Turno de Caja */}
        <div className="flex items-center gap-3">
          {sesionActiva ? (
            <div className="flex items-center gap-3 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  Caja Abierta: {sesionActiva.cajero_nombre}
                </p>
                <span className="text-[10px] text-gray-500 dark:text-slate-400">
                  Fondo Inicial: S/ {Number(sesionActiva.monto_apertura).toFixed(2)}
                </span>
              </div>
              <button
                onClick={() => setModalCierreCiegoOpen(true)}
                className="ml-2 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-sm"
              >
                Cerrar Turno (Arqueo)
              </button>
            </div>
          ) : (
            <button
              onClick={() => setModalAperturaOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95"
            >
              <Unlock className="w-4 h-4" /> Abrir Turno de Caja
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Grid Principal: Órdenes en Espera (Izquierda) + Panel de Facturación (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Columna Izquierda: Cola de Órdenes por Cobrar (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" /> Órdenes por Cobrar ({ordenes.length})
            </h3>
            <span className="text-[10px] text-gray-400 font-bold">
              {oatcSeleccionadasIds.length} seleccionada(s)
            </span>
          </div>

          <div className="space-y-3">
            {cargando ? (
              <div className="p-8 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800">
                Cargando cola de cobro...
              </div>
            ) : ordenes.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-800">
                No hay órdenes pendientes de cobro en este momento.
              </div>
            ) : (
              ordenes.map((oatc) => {
                const isSelected = oatcSeleccionadasIds.includes(oatc.id);

                return (
                  <div
                    key={oatc.id}
                    onClick={() => handleToggleOatc(oatc.id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                      isSelected
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // controlado por el click del div
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <p className="font-bold text-xs text-gray-900 dark:text-white">
                            {oatc.cliente_nombre}
                          </p>
                          <span className="text-[10px] text-gray-400">#OATC-{oatc.id.slice(0, 4)} • {oatc.agente_nombre || 'Staff'}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400">
                          S/ {Number(oatc.total_oatc || 0).toFixed(2)}
                        </span>
                        <span className="text-[9px] block text-gray-400 uppercase font-bold">
                          {oatc.estado_proceso}
                        </span>
                      </div>
                    </div>

                    {/* Desglose de Tickets Anidados */}
                    {oatc.tickets && oatc.tickets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                        {oatc.tickets.map((t: any, idx: number) => (
                          <div key={t.id} className="text-[11px] flex items-center justify-between text-gray-600 dark:text-slate-400">
                            <span>#{idx + 1} {t.agente_nombre} ({t.items?.length || 0} ítems)</span>
                            <span className="font-mono font-bold text-gray-900 dark:text-white">S/ {Number(t.monto_total || 0).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Panel de Liquidación, Split Billing & Medios de Pago (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-sm space-y-5">
          
          {/* Header del Cobro */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
                {ordenesSeleccionadas.length > 1 ? '👥 Liquidación Agrupada (Familiar / Multi-OATC)' : '🧾 Liquidación de Atención'}
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                {clienteNombreInput || 'Seleccione orden'}
              </h3>
            </div>

            {/* Selector de Comprobante */}
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-950 p-1 rounded-xl">
              {(['BOLETA', 'FACTURA', 'NOTA_VENTA'] as const).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoComprobante(tipo)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    tipoComprobante === tipo
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-600 dark:text-slate-400'
                  }`}
                >
                  {tipo === 'BOLETA' ? 'Boleta' : tipo === 'FACTURA' ? 'Factura' : 'Nota'}
                </button>
              ))}
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1 col-span-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase">Cliente Facturación:</label>
              <input
                type="text"
                value={clienteNombreInput}
                onChange={(e) => setClienteNombreInput(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">{tipoDocInput} / Doc:</label>
              <input
                type="text"
                value={clienteDocInput}
                onChange={(e) => setClienteDocInput(e.target.value)}
                className="w-full p-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono text-gray-900 dark:text-white outline-none"
              />
            </div>
          </div>

          {/* Ítems Consolidados a Facturar */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Ítems a Facturar ({itemsConsolidados.length})
            </span>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {itemsConsolidados.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {item.tipo === 'producto' ? <Package className="w-3.5 h-3.5 text-emerald-500" /> : <Scissors className="w-3.5 h-3.5 text-indigo-500" />}
                    <span className="font-bold text-gray-800 dark:text-slate-200">{item.nombre}</span>
                    {item.es_cortesia && (
                      <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.2 rounded border border-amber-500/20">
                        Cortesía S/ 0.00
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-black text-gray-900 dark:text-white">
                    S/ {(Number(item.precio_final || 0) * Number(item.cantidad || 1)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Totales y Split de Medios de Pago */}
          <div className="p-4 bg-gray-50 dark:bg-slate-950 rounded-2xl border border-gray-200 dark:border-slate-800 space-y-4">
            
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-850 pb-3">
              <div>
                <span className="text-xs text-gray-500 font-bold">Total a Pagar:</span>
                {totalCortesias > 0 && (
                  <span className="text-[10px] text-amber-500 block">
                    (Ahorro cortesías: S/ {totalCortesias.toFixed(2)})
                  </span>
                )}
              </div>
              <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                S/ {totalAPagar.toFixed(2)}
              </span>
            </div>

            {/* Split de Pagos */}
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider flex items-center gap-1">
                <Split className="w-3.5 h-3.5" /> Medios de Pago (Split Payment)
              </span>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-500">💵 Efectivo:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={montoEfectivo}
                    onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500">💳 Tarjeta POS:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={montoTarjeta}
                    onChange={(e) => setMontoTarjeta(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500">📱 Yape / Plin:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={montoYape}
                    onChange={(e) => setMontoYape(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-500">🏦 Transferencia:</label>
                  <input
                    type="number"
                    step="0.5"
                    value={montoTransf}
                    onChange={(e) => setMontoTransf(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {montoEfectivo > 0 && (
                <div className="pt-2 flex items-center justify-between bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">Efectivo Recibido:</span>
                    <input
                      type="number"
                      step="0.5"
                      value={efectivoRecibido}
                      onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                      className="w-24 p-1 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg text-xs font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-gray-500 mr-2">Vuelto a entregar:</span>
                    <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      S/ {vueltoCalculado.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Botón Emitir y Cobrar */}
          <button
            type="button"
            onClick={handleEjecutarCobro}
            disabled={isProcessingCobro || itemsConsolidados.length === 0}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
          >
            <Receipt className="w-5 h-5" />
            <span>
              {isProcessingCobro ? 'Procesando...' : `Cobrar & Emitir ${tipoComprobante} (S/ ${totalAPagar.toFixed(2)})`}
            </span>
          </button>

        </div>

      </div>

      {/* ========================================================================= */}
      {/* MODALES DE ARQUEO CIEGO Y COMPROBANTE EMITIDO */}
      {/* ========================================================================= */}

      {/* Modal 1: Apertura de Turno */}
      {modalAperturaOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-gray-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Unlock className="w-5 h-5 text-emerald-500" /> Apertura de Turno de Caja
            </h4>

            <form onSubmit={handleAbrirCaja} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Cajero Responsable:</label>
                <input
                  type="text"
                  required
                  value={cajeroNombre}
                  onChange={(e) => setCajeroNombre(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 dark:text-slate-400">Fondo Inicial en Efectivo (S/):</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-mono font-bold text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAperturaOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Abrir Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Cierre Ciego de Caja */}
      {modalCierreCiegoOpen && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-gray-200 dark:border-slate-800 space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-rose-500" /> Arqueo Ciego de Caja
            </h4>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Ingresa el conteo físico de billetes y monedas. El sistema calculará la varianza automáticamente.
            </p>

            <form onSubmit={handleCerrarCajaCiega} className="space-y-3">
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                {Object.keys(conteoEfectivo).map((den) => (
                  <div key={den} className="p-2 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-200 dark:border-slate-800 text-center">
                    <span className="text-[10px] font-bold text-gray-500 block">S/ {den}</span>
                    <input
                      type="number"
                      min="0"
                      value={conteoEfectivo[den]}
                      onChange={(e) => setConteoEfectivo({ ...conteoEfectivo, [den]: Number(e.target.value) })}
                      className="w-full p-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-lg text-center text-xs font-mono font-bold"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalCierreCiegoOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 text-xs font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30"
                >
                  Cerrar Caja y Ver Cuadre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Comprobante Emitido */}
      {modalComprobanteEmitido && (
        <div className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl p-6 border border-gray-200 dark:border-slate-800 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl">
              <Check className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-black text-gray-900 dark:text-white">
                ¡{modalComprobanteEmitido.tipo_comprobante} Emitida!
              </h4>
              <p className="text-xs text-gray-500 font-mono">
                {modalComprobanteEmitido.serie}-{modalComprobanteEmitido.numero}
              </p>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-slate-950 rounded-2xl text-xs space-y-1 text-left font-mono">
              <div className="flex justify-between">
                <span>Cliente:</span>
                <strong>{modalComprobanteEmitido.cliente_nombre}</strong>
              </div>
              <div className="flex justify-between">
                <span>Total Cobrado:</span>
                <strong className="text-emerald-500">S/ {Number(modalComprobanteEmitido.total).toFixed(2)}</strong>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  imprimirTicketTermicoHtml({
                    tipo: 'COMPROBANTE_SUNAT',
                    numeroDocumento: `${modalComprobanteEmitido.serie}-${modalComprobanteEmitido.numero}`,
                    clienteNombre: modalComprobanteEmitido.cliente_nombre,
                    clienteDniRuc: modalComprobanteEmitido.cliente_doc,
                    items: (modalComprobanteEmitido.items || []).map((it) => ({
                      nombre: it.nombre,
                      cantidad: it.cantidad || 1,
                      precioUnitario: it.precio_final ?? it.precio_base ?? 0,
                      subtotal: (it.precio_final ?? it.precio_base ?? 0) * (it.cantidad || 1)
                    })),
                    total: Number(modalComprobanteEmitido.total),
                    metodoPago: (modalComprobanteEmitido.pagos || []).map((p) => `${p.metodo} (S/ ${p.monto.toFixed(2)})`).join(', ')
                  }, 80);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-slate-700 shadow-md cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Imprimir Ticket Térmico (80mm)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalComprobanteEmitido(null)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg"
              >
                Listo / Continuar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
