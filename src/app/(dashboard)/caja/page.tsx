'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Search, CheckCircle, Clock, Calendar } from 'lucide-react';
import { OATC } from '@/services/recepcion';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { OatcCaja, PagoMixto, Emisor, SerieComprobante } from '@/types/caja';
import { CajaResumenCards, CobroModal } from '@/components/caja';

const supabase = createClient();

export default function WorkspaceCajaPage() {
  const [tickets, setTickets] = useState<OatcCaja[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<OatcCaja | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagosMixtos, setPagosMixtos] = useState<PagoMixto[]>([]);
  const [activeSession, setActiveSession] = useState<any | null>(null);

  const [emisores, setEmisores] = useState<Emisor[]>([]);
  const [series, setSeries] = useState<SerieComprobante[]>([]);
  const [selectedEmisorId, setSelectedEmisorId] = useState<string>('');
  const [selectedTipo, setSelectedTipo] = useState<string>('BOLETA');
  const [selectedSerieId, setSelectedSerieId] = useState<string>('');

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const cargarTicketsCaja = async () => {
    if (!sedeActiva) return;
    setIsLoading(true);

    let query = supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeActiva.id)
      .in('estado_proceso', ['POR_COBRAR', 'PRE_COBRADO'])
      .or('estado_pago.neq.Pagado,estado_pago.is.null');

    if (fechaFiltro) {
      query = query
        .gte('created_at', `${fechaFiltro}T00:00:00.000Z`)
        .lte('created_at', `${fechaFiltro}T23:59:59.999Z`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error cargando caja:', error);
    } else {
      const mapped = (data as OATC[]).map((t) => {
        const total = (t.punto_partida || []).reduce((acc: number, item: any) => {
          return acc + (item.precio || 0) * (item.cantidad || 1);
        }, 0);
        return { ...t, total_calculado: total };
      });
      setTickets(mapped);
    }
    setIsLoading(false);
  };

  const cargarEmisoresYSeries = async () => {
    if (!sedeActiva) return;

    const { data: rels } = await supabase
      .from('emisores_sedes')
      .select('emisor_id')
      .eq('sede_id', sedeActiva.id)
      .eq('estado', 'ACTIVO');
    let emis: Emisor[] = [];

    if (rels && rels.length > 0) {
      const { data: emisData } = await supabase
        .from('emisores')
        .select('*')
        .in('id', rels.map((r: any) => r.emisor_id))
        .eq('estado', 'ACTIVO');
      if (emisData) emis = emisData;
    }

    if (emis.length === 0) {
      const { data: allEmis } = await supabase.from('emisores').select('*').eq('estado', 'ACTIVO');
      if (allEmis) emis = allEmis;
    }

    if (emis.length > 0) {
      setEmisores(emis);
      const { data: sers } = await supabase
        .from('emisores_series')
        .select('*')
        .in('emisor_id', emis.map((e: Emisor) => e.id))
        .eq('estado', 'ACTIVO');
      if (sers) setSeries(sers);
    } else {
      setEmisores([]);
      setSeries([]);
    }
  };

  const cargarSesionActiva = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: agente } = await supabase
        .from('agentes')
        .select('id')
        .eq('email', user.email)
        .single();
      if (agente) {
        const { data: openSession } = await supabase
          .from('caja_sesiones')
          .select('id, estado')
          .eq('cajero_id', agente.id)
          .eq('estado', 'ABIERTA')
          .maybeSingle();
        setActiveSession(openSession || null);
      }
    }
  };

  useEffect(() => {
    cargarTicketsCaja();
    cargarEmisoresYSeries();
    cargarSesionActiva();

    const channel = supabase
      .channel('realtime-caja')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'oatc' },
        (payload: any) => {
          if (['POR_COBRAR', 'PRE_COBRADO'].includes(payload.new.estado_proceso)) {
            cargarTicketsCaja();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeActiva, fechaFiltro]);

  const openCobroModal = (ticket: OatcCaja) => {
    setSelectedTicket(ticket);
    const m = ticket.total_calculado === 0 ? 'Obsequio' : 'Efectivo';
    setPagosMixtos([{ metodo: m, monto: ticket.total_calculado || 0 }]);

    if (emisores.length > 0) {
      const defaultEmisor = emisores[0].id;
      setSelectedEmisorId(defaultEmisor);
      setSelectedTipo('BOLETA');
      const defaultSerie = series.find(
        (s) => s.emisor_id === defaultEmisor && s.tipo_comprobante === 'BOLETA'
      );
      if (defaultSerie) setSelectedSerieId(defaultSerie.id);
      else setSelectedSerieId('');
    }

    setIsModalOpen(true);
  };

  const handleProcesarPago = async () => {
    if (!selectedTicket) return;
    setIsProcessing(true);

    const { data: { user } } = await supabase.auth.getUser();
    let cajero_id = null;
    if (user) {
      const { data: agente } = await supabase
        .from('agentes')
        .select('id')
        .eq('email', user.email)
        .single();
      if (agente) cajero_id = agente.id;
    }

    const serieObj = series.find((s) => s.id === selectedSerieId);
    if (!serieObj) {
      showAlert('Seleccione una serie válida', 'error');
      setIsProcessing(false);
      return;
    }

    const nextCorrelativo = serieObj.correlativo_actual + 1;
    const totalCalc = selectedTicket.total_calculado || 0;

    await supabase
      .from('emisores_series')
      .update({ correlativo_actual: nextCorrelativo })
      .eq('id', serieObj.id);

    const { data: comp, error: compErr } = await supabase
      .from('comprobantes')
      .insert({
        oatc_id: selectedTicket.id,
        sede_id: sedeActiva?.id,
        cajero_id: cajero_id,
        emisor_id: selectedEmisorId,
        tipo_comprobante: selectedTipo,
        serie: serieObj.serie,
        correlativo: nextCorrelativo,
        subtotal: totalCalc / 1.18,
        igv: totalCalc - totalCalc / 1.18,
        total: totalCalc,
      })
      .select()
      .single();

    if (comp && !compErr) {
      const pagosToInsert = pagosMixtos.map((p) => ({
        comprobante_id: comp.id,
        caja_sesion_id: activeSession?.id,
        oatc_id: selectedTicket.id,
        sede_id: sedeActiva?.id,
        metodo_pago: p.metodo,
        monto: p.monto,
      }));
      await supabase.from('pagos').insert(pagosToInsert);
    }

    const updatePayload: any = { estado_pago: 'Pagado' };
    if (selectedTicket.estado_proceso === 'POR_COBRAR') {
      updatePayload.estado_proceso = 'FINALIZADO';
      updatePayload.hora_fin_atencion = new Date().toISOString();
    }

    const { error } = await supabase
      .from('oatc')
      .update(updatePayload)
      .eq('id', selectedTicket.id);

    if (!error && selectedTicket.agente_id) {
      try {
        await supabase
          .from('agentes')
          .update({ estado: 'DISPONIBLE' })
          .eq('id', selectedTicket.agente_id);
      } catch (err) {
        console.warn('No se pudo liberar agente:', err);
      }
    }

    if (!error && !compErr) {
      const metodosDetalle = pagosMixtos
        .map((p) => `${p.metodo} ($${p.monto.toFixed(2)})`)
        .join(', ');
      showAlert(
        `Comprobante ${serieObj.serie}-${nextCorrelativo
          .toString()
          .padStart(6, '0')} emitido con éxito. Pagos: ${metodosDetalle}`,
        'success'
      );
    } else {
      showAlert('Error al procesar el pago o comprobante', 'error');
    }

    setIsProcessing(false);
    setIsModalOpen(false);
    setSelectedTicket(null);
    setPagosMixtos([]);
    cargarTicketsCaja();
  };

  const ticketsFiltrados = tickets.filter((t) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      t.cliente_nombre?.toLowerCase().includes(term) ||
      t.id?.toLowerCase().includes(term) ||
      t.agente_nombre?.toLowerCase().includes(term)
    );
  });

  const cantPorCobrar = tickets.length;
  const totalRecaudado = tickets.reduce((acc, t) => acc + (t.total_calculado || 0), 0);
  const promedioTicket = cantPorCobrar > 0 ? totalRecaudado / cantPorCobrar : 0;

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      {!activeSession && !isLoading ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">Caja Cerrada</h2>
            <p className="text-sm opacity-90 mt-1">
              Por seguridad, debes abrir tu caja registradora en el módulo de arqueo para poder procesar cobros.
            </p>
          </div>
          <a
            href="/caja/arqueo"
            className="bg-rose-600 text-white font-bold px-6 py-3 rounded-lg shadow-sm hover:bg-rose-700 transition-colors whitespace-nowrap text-sm"
          >
            Ir a Abrir Caja
          </a>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600 bg-emerald-100 rounded-lg p-1" />
            Workspace de Caja (POS)
          </h1>
          <p className="text-slate-500 mt-2">Liquidación y cobro de atenciones finalizadas.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 shadow-sm h-[42px]">
            <Calendar className="w-4 h-4 text-slate-400 mr-2" />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="px-1 text-sm outline-none border-none text-slate-600 font-medium bg-transparent"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar por cliente o ticket..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm h-[42px] focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>
      </div>

      <CajaResumenCards
        totalRecaudado={totalRecaudado}
        cantPorCobrar={cantPorCobrar}
        cantCobradas={0}
        promedioTicket={promedioTicket}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-medium text-slate-600">Buscando atenciones pendientes de cobro...</p>
            </div>
          ) : ticketsFiltrados.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <CheckCircle className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Caja al día</h3>
              <p className="text-slate-500 mt-1 max-w-sm mx-auto text-sm">
                No hay clientes esperando para pagar. Todas las atenciones finalizadas han sido procesadas.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Cliente / Ticket</th>
                  <th className="px-6 py-4">Agente Responsable</th>
                  <th className="px-6 py-4">Servicios (Incl. Upsell)</th>
                  <th className="px-6 py-4 text-right">Total a Cobrar</th>
                  <th className="px-6 py-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ticketsFiltrados.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-emerald-50/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ticket.cliente_nombre}</div>
                      <div className="text-xs text-slate-400 font-mono mt-1">
                        <Clock className="w-3 h-3 inline-block mr-1" />
                        {new Date(ticket.created_at || '').toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        {ticket.agente_nombre}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(ticket.punto_partida || []).map((item: any, i: number) => (
                          <span
                            key={i}
                            className="text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-md"
                          >
                            {item.servicio} (x{item.cantidad || 1})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-lg">
                      ${ticket.total_calculado?.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        disabled={!activeSession}
                        onClick={() => openCobroModal(ticket)}
                        className={`font-bold px-4 py-2 rounded-lg transition-colors shadow-sm text-xs uppercase tracking-wider ${
                          !activeSession
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        Cobrar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <CobroModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedTicket={selectedTicket}
        isProcessing={isProcessing}
        handleProcesarCobro={handleProcesarPago}
        pagosMixtos={pagosMixtos}
        setPagosMixtos={setPagosMixtos}
        emisores={emisores}
        series={series}
        selectedEmisorId={selectedEmisorId}
        setSelectedEmisorId={setSelectedEmisorId}
        selectedTipo={selectedTipo}
        setSelectedTipo={setSelectedTipo}
        selectedSerieId={selectedSerieId}
        setSelectedSerieId={setSelectedSerieId}
      />
    </div>
  );
}
