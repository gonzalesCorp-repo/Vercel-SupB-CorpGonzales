'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { CreditCard, History, Calculator, CheckCircle2, ShieldCheck, Sparkles, Receipt, Banknote, QrCode, RefreshCw } from 'lucide-react';
import { useUIStore } from '@/store/useUIStore';
import { EcosystemBridge } from '@/lib/bridge/EcosystemBridge';

export default function CajaMobileView({ agente, sedeId }: { agente: any; sedeId: string }) {
  const [tab, setTab] = useState<'cobros' | 'arqueo' | 'historial'>('cobros');
  const [oatcs, setOatcs] = useState<any[]>([]);
  const [historialComprobantes, setHistorialComprobantes] = useState<any[]>([]);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [metricasArqueo, setMetricasArqueo] = useState({
    total: 0,
    efectivo: 0,
    tarjeta: 0,
    yape: 0,
    transacciones: 0
  });

  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (tab === 'cobros') fetchCobros();
    if (tab === 'arqueo') fetchArqueo();
    if (tab === 'historial') fetchHistorial();
  }, [tab, sedeId]);

  const calcularTotalOatc = (o: any): number => {
    if (o.total && Number(o.total) > 0) return Number(o.total);
    if (o.monto_total && Number(o.monto_total) > 0) return Number(o.monto_total);
    
    // Calcular desde punto_partida
    if (o.punto_partida) {
      if (Array.isArray(o.punto_partida)) {
        return o.punto_partida.reduce((acc: number, item: any) => acc + (Number(item.precio || item.precio_venta || 0)), 0);
      }
      if (o.punto_partida.servicios && Array.isArray(o.punto_partida.servicios)) {
        return o.punto_partida.servicios.reduce((acc: number, s: any) => acc + (Number(s.precio || s.precio_venta || 0)), 0);
      }
    }
    return 0;
  };

  const fetchCobros = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeId)
      .in('estado_proceso', ['PRE_COBRADO', 'POR_COBRAR', 'EN_CURSO'])
      .order('created_at', { ascending: false });

    if (data) {
      setOatcs(data);
    }
    setLoading(false);
  };

  const fetchArqueo = async () => {
    setLoading(true);
    const hoy = new Date().toISOString().split('T')[0];
    const { data: comprobantes } = await supabase
      .from('comprobantes_pago')
      .select('*')
      .eq('sede_id', sedeId)
      .gte('created_at', `${hoy}T00:00:00`)
      .lte('created_at', `${hoy}T23:59:59`);

    if (comprobantes && comprobantes.length > 0) {
      let total = 0;
      let efectivo = 0;
      let tarjeta = 0;
      let yape = 0;

      comprobantes.forEach((c: any) => {
        const monto = Number(c.monto_total || c.total || 0);
        total += monto;
        const metodo = (c.metodo_pago || c.tipo_pago || '').toUpperCase();
        if (metodo.includes('EFECTIVO')) efectivo += monto;
        else if (metodo.includes('TARJETA') || metodo.includes('POS')) tarjeta += monto;
        else if (metodo.includes('YAPE') || metodo.includes('PLIN')) yape += monto;
        else efectivo += monto;
      });

      setMetricasArqueo({
        total,
        efectivo,
        tarjeta,
        yape,
        transacciones: comprobantes.length
      });
    } else {
      setMetricasArqueo({ total: 0, efectivo: 0, tarjeta: 0, yape: 0, transacciones: 0 });
    }
    setLoading(false);
  };

  const fetchHistorial = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('comprobantes_pago')
      .select('*')
      .eq('sede_id', sedeId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setHistorialComprobantes(data);
    setLoading(false);
  };

  const handleCobrar = async (oatc: any) => {
    const total = calcularTotalOatc(oatc);
    const metodo = metodoPagoSeleccionado[oatc.id] || 'YAPE';

    try {
      // 1. Crear comprobante de pago en Supabase
      const { data: comp, error: compErr } = await supabase
        .from('comprobantes_pago')
        .insert([{
          sede_id: sedeId,
          oatc_id: oatc.id,
          cliente_id: oatc.cliente_id,
          cliente_nombre: oatc.cliente_nombre || 'Cliente General',
          monto_total: total,
          metodo_pago: metodo,
          tipo_comprobante: 'BOLETA_ELECTRONICA',
          serie: 'B001',
          correlativo: Math.floor(100000 + Math.random() * 900000),
          estado: 'PAGADO',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      // 2. Actualizar estado de OATC
      await supabase
        .from('oatc')
        .update({
          estado_proceso: 'FINALIZADO',
          estado_pago: 'Pagado',
          hora_fin_atencion: new Date().toISOString()
        })
        .eq('id', oatc.id);

      // 3. Liberar estación en piso
      await supabase
        .from('estaciones_piso')
        .update({
          estado_ocupacion: 'LIBRE',
          oatc_id_actual: null,
          cliente_nombre_actual: null
        })
        .eq('oatc_id_actual', oatc.id);

      // 4. Disparar EcosystemBridge
      EcosystemBridge.emit('TICKET_COBRADO', {
        oatc_id: oatc.id,
        monto: total,
        cliente_nombre: oatc.cliente_nombre,
        agente_nombre: oatc.agente_nombre
      }, 'VAIKUNTHA_ERP');

      showAlert(`¡Cobro de S/ ${total.toFixed(2)} registrado con éxito!`, 'success');
      fetchCobros();
    } catch (e: any) {
      showAlert(`Error procesando cobro: ${e?.message || 'Error desconocido'}`, 'error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 shadow-lg text-white mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-emerald-200" />
            <div>
              <p className="text-[10px] font-black tracking-widest uppercase text-emerald-200">Caja POS Volante</p>
              <p className="text-sm font-bold">Cobranza móvil, arqueo ciego y facturación</p>
            </div>
          </div>
          <span className="text-xs bg-white/20 px-2 py-1 rounded-full font-bold">
            {oatcs.length} Por Cobrar
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shadow-md">
        <button onClick={() => setTab('cobros')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'cobros' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>
          <CreditCard className="w-4 h-4" /> Cobros ({oatcs.length})
        </button>
        <button onClick={() => setTab('arqueo')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'arqueo' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>
          <Calculator className="w-4 h-4" /> Arqueo
        </button>
        <button onClick={() => setTab('historial')} className={`py-2 text-xs font-bold rounded-xl flex justify-center items-center gap-2 transition ${tab === 'historial' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400'}`}>
          <History className="w-4 h-4" /> Historial
        </button>
      </div>

      {/* Content */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        
        {/* TAB 1: COBROS PENDIENTES */}
        {tab === 'cobros' && (
          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando órdenes por cobrar...</div>
            ) : oatcs.length === 0 ? (
              <div className="text-center text-slate-400 py-10 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                ✨ No hay tickets pendientes de cobro en este momento
              </div>
            ) : (
              oatcs.map((o) => {
                const total = calcularTotalOatc(o);
                const metodoActual = metodoPagoSeleccionado[o.id] || 'YAPE';
                return (
                  <div key={o.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {o.id.slice(0, 8)}</p>
                        <p className="font-bold text-sm text-white">{o.cliente_nombre || 'Cliente General'}</p>
                        <p className="text-[10px] text-indigo-300">Atendido por: {o.agente_nombre || 'Especialista'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-400">Total</span>
                        <p className="text-emerald-400 font-black text-xl">S/ {total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Selector de Método de Pago */}
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {['YAPE', 'TARJETA', 'EFECTIVO'].map((met) => (
                        <button
                          key={met}
                          onClick={() => setMetodoPagoSeleccionado({ ...metodoPagoSeleccionado, [o.id]: met })}
                          className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border transition ${
                            metodoActual === met
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {met === 'YAPE' && '📱 Yape/Plin'}
                          {met === 'TARJETA' && '💳 Tarjeta/POS'}
                          {met === 'EFECTIVO' && '💵 Efectivo'}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCobrar(o)}
                      className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 text-xs transition"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Cobrar S/ {total.toFixed(2)} ({metodoActual})
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: ARQUEO DE CAJA EN VIVO */}
        {tab === 'arqueo' && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
            <div className="text-center pb-3 border-b border-slate-800">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Recaudación Real de Hoy</p>
              <p className="text-3xl font-black text-white mt-1">S/ {metricasArqueo.total.toFixed(2)}</p>
              <p className="text-xs text-emerald-400 font-bold mt-1">
                {metricasArqueo.transacciones} comprobantes emitidos
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-300 flex items-center gap-2"><Banknote className="w-4 h-4 text-emerald-400" /> Efectivo</span>
                <span className="font-bold text-xs text-white">S/ {metricasArqueo.efectivo.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-300 flex items-center gap-2"><CreditCard className="w-4 h-4 text-blue-400" /> Tarjetas / POS</span>
                <span className="font-bold text-xs text-white">S/ {metricasArqueo.tarjeta.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <span className="text-xs text-slate-300 flex items-center gap-2"><QrCode className="w-4 h-4 text-purple-400" /> Yape / Plin</span>
                <span className="font-bold text-xs text-white">S/ {metricasArqueo.yape.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HISTORIAL DE COMPROBANTES */}
        {tab === 'historial' && (
          <div className="space-y-2.5">
            {loading ? (
              <div className="text-center text-slate-500 py-8 text-xs font-bold">Cargando comprobantes emitidos...</div>
            ) : historialComprobantes.length === 0 ? (
              <div className="text-center text-slate-400 py-8 bg-slate-900/60 rounded-2xl border border-slate-800 text-xs">
                No hay pagos registrados hoy en esta sede
              </div>
            ) : (
              historialComprobantes.map((comp) => (
                <div key={comp.id} className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <p className="font-bold text-xs text-white">{comp.cliente_nombre || 'Cliente General'}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {comp.serie}-{comp.correlativo} • {comp.metodo_pago || 'PAGO'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-emerald-400">S/ {Number(comp.monto_total || 0).toFixed(2)}</p>
                    <p className="text-[9px] text-slate-500">
                      {comp.created_at ? new Date(comp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </motion.div>
    </div>
  );
}
