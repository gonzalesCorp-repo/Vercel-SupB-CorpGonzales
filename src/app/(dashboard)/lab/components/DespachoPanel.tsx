'use client';

import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { 
  obtenerPedidosPendientesLab, 
  despacharInsumoConBalanzaIoT, 
  obtenerStockUbicacion 
} from '@/services/lab';
import { 
  PackageSearch, Clock, CheckCircle, Scale, Bluetooth, Wifi, Usb, RefreshCw, 
  Sparkles, Printer, Plus, Search, ShieldCheck, Settings2, ArrowLeft, 
  Send, UserCircle, Scissors, Layers, CheckCircle2, AlertCircle, Inbox 
} from 'lucide-react';
import { 
  simularPesajeBalanza, 
  LecturaBalanza, 
  obtenerConfiguracionBalanza 
} from '@/lib/hardware/iotScale';
import { imprimirTicketTermicoHtml } from '@/lib/hardware/thermalPrinter';
import { obtenerConfiguracionSede } from '@/services/sedesConfig';
import { ModalConfiguracionBalanza } from './ModalConfiguracionBalanza';
import { FormularioDespachoGeneral } from './FormularioDespachoGeneral';

const supabase = createClient();

export default function DespachoPanel() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [bienesInsumos, setBienesInsumos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historialHoy, setHistorialHoy] = useState<any[]>([]);
  const [habilitarBalanzasIot, setHabilitarBalanzasIot] = useState<boolean>(true);
  
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  // Balanza Digital IoT Tri-Modo
  const [modalConfigBalanzaOpen, setModalConfigBalanzaOpen] = useState(false);
  const [pesoBalanza, setPesoBalanza] = useState<number>(0);
  const [balanzaEstable, setBalanzaEstable] = useState<boolean>(true);
  const [protocoloActivo, setProtocoloActivo] = useState<string>('SIMULACION');
  const [nombreDispositivo, setNombreDispositivo] = useState<string>('Balanza IoT Precisión');

  // Estado de Atención: null si está en cola/mando, string si está despachando
  const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState<string | null>(null);
  const [filtroHistorial, setFiltroHistorial] = useState('');

  const loadData = async () => {
    if (!sedeActiva) return;
    setLoading(true);
    
    const [dataPedidos, dataStock, dataToggles] = await Promise.all([
      obtenerPedidosPendientesLab(),
      obtenerStockUbicacion(),
      obtenerConfiguracionSede(sedeActiva.id)
    ]);

    setPedidos(dataPedidos || []);
    setBienesInsumos(dataStock || []);
    setHabilitarBalanzasIot(dataToggles.habilitarBalanzasIot ?? true);

    // Cargar historial de despachos de hoy
    const hoy = new Date().toISOString().split('T')[0];
    const { data: historial } = await supabase
      .from('inventario_movimientos')
      .select('*, bienes(nombre, sku)')
      .eq('sede_id', sedeActiva.id)
      .gte('fecha_hora', `${hoy}T00:00:00`)
      .order('fecha_hora', { ascending: false })
      .limit(20);

    setHistorialHoy(historial || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const config = obtenerConfiguracionBalanza();
    setProtocoloActivo(config.protocolo);
    setNombreDispositivo(config.dispositivoNombre || 'Balanza IoT');

    // Suscripción Realtime a eventos de solicitudes y órdenes
    const channel = supabase.channel('realtime-despacho-lab')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lab_pedidos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos_insumos' }, () => loadData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeActiva]);

  const handleLecturaBalanza = (lectura: LecturaBalanza) => {
    setPesoBalanza(lectura.pesoGramos);
    setBalanzaEstable(lectura.estable);
    if (lectura.protocolo) setProtocoloActivo(lectura.protocolo);
    if (lectura.dispositivoNombre) setNombreDispositivo(lectura.dispositivoNombre);
  };

  const handleSimularPesaje = (index: number) => {
    setBalanzaEstable(false);
    simularPesajeBalanza(60, (lectura: LecturaBalanza) => {
      setPesoBalanza(lectura.pesoGramos);
      setBalanzaEstable(lectura.estable);
    }, 2.0);
  };

  const handleCapturarBalanza = (index: number) => {
    showAlert(`Peso capturado de la balanza: ${pesoBalanza}g`, 'success');
  };

  const handleDespacharFilas = async (filas: any[]) => {
    const pedido = pedidos.find(p => p.id === pedidoSeleccionadoId);

    try {
      for (const fila of filas) {
        const pesoFinal = fila.pesoNetoG > 0 ? fila.pesoNetoG : fila.pesoTeoricoG;

        if (fila.bienId && !fila.bienId.startsWith('auto_') && !fila.bienId.startsWith('preset_')) {
          await despacharInsumoConBalanzaIoT({
            bienId: fila.bienId,
            pesoBrutoMedidoGramos: fila.pesoBrutoG > 0 ? fila.pesoBrutoG : (pesoFinal + fila.taraEnvaseG),
            pesoTeoricoRecetaGramos: fila.pesoTeoricoG,
            oatcId: pedido?.oatc_id || pedido?.id,
            agenteId: pedido?.oatc?.agente_id,
            agenteNombre: pedido?.oatc?.agente_nombre
          });
        }
      }

      const totalGramos = filas.reduce((acc, f) => acc + (f.pesoNetoG > 0 ? f.pesoNetoG : f.pesoTeoricoG), 0);

      // Si fue una solicitud de piso o pedido, actualizar su estado
      if (pedido?.tipo === 'SOLICITUD_PISO' && pedido.solicitud_id) {
        await supabase.from('pedidos_insumos').update({ estado: 'DESPACHADO' }).eq('id', pedido.solicitud_id);
      } else if (pedido?.tipo === 'LAB_PEDIDO' && pedido.id) {
        await supabase.from('lab_pedidos').update({ estado: 'DESPACHADO', peso_real_gramos: totalGramos }).eq('id', pedido.id);
      }

      const toggles = await obtenerConfiguracionSede(sedeActiva?.id);
      if (toggles.autoImpresionTermicaTickets ?? true) {
        imprimirTicketTermicoHtml({
          tipo: 'COMANDA_TALLER',
          numeroDocumento: `ODI-${pedido?.oatc?.secuencia || (pedidoSeleccionadoId ? pedidoSeleccionadoId.slice(0, 5) : 'LIBRE')}`,
          clienteNombre: pedido?.oatc?.cliente_nombre || 'Servicio en Piso',
          colaboradorNombre: pedido?.oatc?.agente_nombre || 'Especialista / BOH',
          items: filas.map((f) => ({
            nombre: `${f.nombre} (${f.sku})`,
            cantidad: 1,
            precioUnitario: 0,
            subtotal: 0,
            especificaciones: `Teórico: ${f.pesoTeoricoG}g | Real: ${f.pesoNetoG > 0 ? f.pesoNetoG : f.pesoTeoricoG}g`
          })),
          total: 0,
          mensajePie: `Despacho ODI | Total: ${totalGramos.toFixed(1)}g | Vaikuntha Lab`
        }, 80);
      }

      showAlert(`¡Despacho completado con éxito! (${totalGramos.toFixed(1)}g)`, 'success');
      setPedidoSeleccionadoId(null);
      loadData();
    } catch (e: any) {
      showAlert(`Error en despacho: ${e.message}`, 'error');
    }
  };

  const pedidoActivo = pedidos.find(p => p.id === pedidoSeleccionadoId);

  // Separar Solicitudes Explícitas de Staff vs Órdenes en Piso con Potencial Despacho
  const solicitudesStaff = pedidos.filter(p => p.tipo === 'SOLICITUD_PISO' || p.tipo === 'LAB_PEDIDO');
  const ordenesPotencialesPiso = pedidos.filter(p => p.tipo === 'OATC_POTENCIAL');

  const historialFiltrado = historialHoy.filter(h =>
    !filtroHistorial ||
    (h.bienes?.nombre && h.bienes.nombre.toLowerCase().includes(filtroHistorial.toLowerCase())) ||
    (h.descripcion && h.descripcion.toLowerCase().includes(filtroHistorial.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-200">
      
      {/* Header Bar */}
      <div className="flex flex-wrap justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <PackageSearch className="w-6 h-6 text-indigo-500" />
            Workspace Taller & Despacho de Insumos
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Atención de solicitudes de staff, órdenes activas en piso y pesaje de fórmulas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Display Balanza: Solo si habilitarBalanzasIot está activo */}
          {habilitarBalanzasIot && (
            <>
              <div 
                onClick={() => setModalConfigBalanzaOpen(true)}
                className="flex items-center gap-2.5 bg-slate-950 text-emerald-400 font-mono text-sm px-4 py-2 rounded-2xl border border-slate-800 shadow-inner cursor-pointer hover:border-emerald-500/50 transition"
                title="Clic para configurar balanza IoT"
              >
                <Scale className={`w-4 h-4 ${balanzaEstable ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
                <span className="font-black text-base">{pesoBalanza.toFixed(1)} g</span>
                <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full ${
                  balanzaEstable ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' : 'bg-amber-950/80 text-amber-300 border border-amber-800'
                }`}>
                  {balanzaEstable ? 'ESTABLE' : 'PESANDO...'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setModalConfigBalanzaOpen(true)}
                className="flex items-center gap-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 font-bold px-3.5 py-2.5 rounded-2xl border border-indigo-200 dark:border-indigo-800 transition shadow-sm active:scale-95 cursor-pointer"
              >
                {protocoloActivo === 'BLUETOOTH_BLE' ? <Bluetooth className="w-4 h-4 text-indigo-500" /> :
                 protocoloActivo === 'WIFI_LOCAL' ? <Wifi className="w-4 h-4 text-sky-400" /> :
                 protocoloActivo === 'SERIAL_USB' ? <Usb className="w-4 h-4 text-emerald-400" /> :
                 <Settings2 className="w-4 h-4 text-purple-400" />}
                <span className="truncate max-w-[140px]">{nombreDispositivo}</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setPedidoSeleccionadoId('despacho_libre')}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Despacho Libre</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
            title="Recargar Pedidos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Área Operativa Central (8 cols) + Historial (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        
        {/* Columna Operativa Central (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5 min-h-0">
          
          {/* MODO DESPACHO ACTIVO */}
          {pedidoSeleccionadoId ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Barra de Retorno y Contexto de la Orden */}
              <div className="flex items-center justify-between p-4 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-3xl shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPedidoSeleccionadoId(null)}
                    className="p-2 bg-white dark:bg-slate-900 hover:bg-slate-100 text-slate-700 dark:text-slate-200 rounded-2xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shadow-sm active:scale-95"
                    title="Volver al panel general"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block">
                      Orden Seleccionada para Despacho:
                    </span>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                      {pedidoActivo?.oatc?.cliente_nombre || 'Despacho Libre / Espontáneo'} 
                      {pedidoActivo?.oatc?.secuencia ? (
                        <span className="text-xs font-mono font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                          OATC #{pedidoActivo.oatc.secuencia}
                        </span>
                      ) : ''}
                    </h3>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 block">Colaborador / Estación:</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {pedidoActivo?.agente_nombre || pedidoActivo?.oatc?.agente_nombre || 'Especialista General'}
                  </span>
                </div>
              </div>

              {/* Formulario General Dinámico */}
              <FormularioDespachoGeneral
                bienesInsumos={bienesInsumos}
                habilitarBalanzasIot={habilitarBalanzasIot}
                pesoBalanzaActual={pesoBalanza}
                balanzaEstable={balanzaEstable}
                onSimularPesaje={handleSimularPesaje}
                onCapturarBalanza={handleCapturarBalanza}
                onDespachar={handleDespacharFilas}
                pedidoOatc={pedidoActivo}
              />
            </div>
          ) : (
            /* MODO PANEL DE CONTROL DE ESPERA: 2 Secciones (Arriba Staff Urgente, Abajo OATCs Piso) */
            <div className="space-y-5 overflow-y-auto pr-1">
              
              {/* SECCIÓN 1: Solicitudes Directas de Staff (Alta Prioridad) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/10 text-amber-500 rounded-2xl">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                        Solicitudes Directas de Staff (App Móvil)
                      </h2>
                      <p className="text-[10px] text-slate-400">Peticiones de insumos enviadas en tiempo real desde la estación de trabajo</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    solicitudesStaff.length > 0 
                      ? 'bg-amber-500/20 text-amber-500 border-amber-500/30 animate-pulse' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {solicitudesStaff.length} activas
                  </span>
                </div>

                {solicitudesStaff.length === 0 ? (
                  <div className="py-6 px-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Mesa de Despacho al Día
                        </p>
                        <p className="text-[11px] text-slate-400">
                          No hay solicitudes de staff pendientes. Se activará automáticamente cuando un colaborador solicite insumos.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPedidoSeleccionadoId('despacho_libre')}
                      className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition whitespace-nowrap cursor-pointer"
                    >
                      + Despacho Libre
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {solicitudesStaff.map((ped) => (
                      <div
                        key={ped.id}
                        onClick={() => setPedidoSeleccionadoId(ped.id)}
                        className="p-4 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 rounded-2xl transition-all cursor-pointer shadow-sm space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> Petición de Piso
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            {ped.created_at ? new Date(ped.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ahora'}
                          </span>
                        </div>

                        <div>
                          <p className="text-xs font-black text-slate-800 dark:text-white">
                            {ped.insumo_solicitado || 'Fórmula Solicitada'}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Staff: <strong className="text-slate-700 dark:text-slate-200">{ped.agente_nombre || 'Especialista'}</strong>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-amber-500/20 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                          <span>Atender Solicitud</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECCIÓN 2: Órdenes en Piso con Potencial Despacho (OATCs Activas) */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-sky-500/10 text-sky-500 rounded-2xl">
                      <Scissors className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                        Órdenes en Piso con Potencial Despacho (OATCs Activas)
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        Clientes en atención técnica (color, tratamientos o preparados) disponibles para formular voluntariamente
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold bg-sky-500/10 text-sky-500 dark:text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                    {ordenesPotencialesPiso.length} en piso
                  </span>
                </div>

                {ordenesPotencialesPiso.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    <span>No hay órdenes técnicas activas en piso en este momento.</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {ordenesPotencialesPiso.map((ped) => {
                      const oatc = ped.oatc;
                      return (
                        <div
                          key={ped.id}
                          onClick={() => setPedidoSeleccionadoId(ped.id)}
                          className="p-4 bg-slate-50 dark:bg-slate-950/60 hover:bg-sky-50/50 dark:hover:bg-sky-950/20 border border-slate-200 dark:border-slate-800 hover:border-sky-400/50 rounded-2xl transition-all cursor-pointer shadow-sm space-y-2 group"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-sky-600 dark:text-sky-400">
                              OATC #{oatc?.secuencia || ped.oatc_id?.slice(0, 5)}
                            </span>
                            <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md">
                              {oatc?.estado || 'EN_PROCESO'}
                            </span>
                          </div>

                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                              {oatc?.cliente_nombre || 'Cliente General'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Especialista: {oatc?.agente_nombre || 'Staff de Piso'}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                            <span>Formular Insumos</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Columna Derecha: Historial y Auditoría de Despachos de Hoy (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Despachos Realizados Hoy
            </h2>
            <span className="text-[10px] font-mono text-slate-400">
              {historialHoy.length} regs
            </span>
          </div>

          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={filtroHistorial}
              onChange={(e) => setFiltroHistorial(e.target.value)}
              placeholder="Buscar en historial..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-8 pr-3 py-2 text-xs text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {historialFiltrado.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No hay movimientos registrados hoy.
              </div>
            ) : (
              historialFiltrado.map((h) => (
                <div key={h.id} className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{h.bienes?.nombre || 'Insumo'}</span>
                    <span className="font-mono font-bold text-emerald-500">-{h.cantidad}g</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{h.descripcion}</p>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    {h.fecha_hora ? new Date(h.fecha_hora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Modal de Configuración Tri-Modo de Balanza */}
      {habilitarBalanzasIot && (
        <ModalConfiguracionBalanza
          isOpen={modalConfigBalanzaOpen}
          onClose={() => setModalConfigBalanzaOpen(false)}
          onLecturaBalanza={handleLecturaBalanza}
        />
      )}

    </div>
  );
}
