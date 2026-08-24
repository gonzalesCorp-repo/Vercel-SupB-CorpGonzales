'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Receipt, CreditCard, QrCode, CheckCircle2, 
  AlertCircle, Users, Split, ShieldCheck, Lock, Unlock, 
  Printer, ArrowRight, X, Plus, RefreshCw, Sparkles, Scale,
  Scissors, Package, FileText, Check, Percent, Heart, Search,
  ExternalLink, ShoppingBag, Eye, UserPlus, SlidersHorizontal,
  Wallet, Calendar 
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { 
  SesionCaja, ComprobantePago, PagoDetalle, 
  obtenerSesionCajaActiva, abrirSesionCaja, cerrarSesionCajaCiega, 
  obtenerOrdenesPorCobrar 
} from '@/services/caja';
import { emitirComprobanteSunatPSE, RespuestaSunatPSE, TipoComprobanteFiscal } from '@/services/sunatPSE';
import { registrarConsumoCredito } from '@/services/cuentasCorrientes';
import { ItemTicket } from '@/services/tickets';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { imprimirTicketTermicoHtml, DatosTicketTermico } from '@/lib/hardware/thermalPrinter';
import { OperacionesCajaDrawer } from './operaciones/OperacionesCajaDrawer';

const supabase = createClient();

export function CajaPosUnifiedView() {
  const [sesionActiva, setSesionActiva] = useState<SesionCaja | null>(null);
  const [ordenes, setOrdenes] = useState<any[]>([]);
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCola, setFiltroCola] = useState('');

  // Selección de órdenes para cobro / split billing
  const [oatcSeleccionadasIds, setOatcSeleccionadasIds] = useState<string[]>([]);
  const [itemsManualesRetail, setItemsManualesRetail] = useState<ItemTicket[]>([]);

  // Modales
  const [modalAperturaOpen, setModalAperturaOpen] = useState(false);
  const [modalCierreCiegoOpen, setModalCierreCiegoOpen] = useState(false);
  const [modalRetailOpen, setModalRetailOpen] = useState(false);
  const [modalDrawerCpesOpen, setModalDrawerCpesOpen] = useState(false);
  const [modalOperacionesCajaOpen, setModalOperacionesCajaOpen] = useState(false);
  
  // Modal de Previsualización Térmica
  const [comprobantePreview, setComprobantePreview] = useState<any | null>(null);
  const [anchoTermicoPreview, setAnchoTermicoPreview] = useState<58 | 80>(58);

  // Formulario de Apertura
  const [montoAperturaInput, setMontoAperturaInput] = useState<number>(150);
  const [cajeroNombre, setCajeroNombre] = useState('Sócrates (Cajero)');

  // Formulario de Cierre Ciego
  const [conteoEfectivo, setConteoEfectivo] = useState<{ [key: string]: number }>({
    '200': 0, '100': 0, '50': 0, '20': 0, '10': 0, '5': 0, '2': 0, '1': 0, '0.5': 0
  });

  // Datos Fiscales de Facturación SUNAT
  const [tipoComprobante, setTipoComprobante] = useState<TipoComprobanteFiscal>('BOLETA');
  const [tipoDocCliente, setTipoDocCliente] = useState<'DNI' | 'RUC' | 'CE' | 'SIN_DOC'>('DNI');
  const [clienteNombreInput, setClienteNombreInput] = useState('');
  const [clienteDocInput, setClienteDocInput] = useState('');
  const [clienteDireccionInput, setClienteDireccionInput] = useState('');

  // Descuentos y Propinas
  const [descuentoMonto, setDescuentoMonto] = useState<number>(0);
  const [descuentoPorc, setDescuentoPorc] = useState<number>(0);
  const [motivoDescuento, setMotivoDescuento] = useState<string>('Descuento Cliente Frecuente');
  const [propinaMonto, setPropinaMonto] = useState<number>(0);
  const [propinaStaffNombre, setPropinaStaffNombre] = useState<string>('Staff General');

  // Medios de Pago Mixtos
  const [montoEfectivo, setMontoEfectivo] = useState<number>(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number>(0);
  const [montoTarjeta, setMontoTarjeta] = useState<number>(0);
  const [montoYape, setMontoYape] = useState<number>(0);
  const [montoTransf, setMontoTransf] = useState<number>(0);
  const [montoCredito, setMontoCredito] = useState<number>(0);
  const [isProcessingCobro, setIsProcessingCobro] = useState(false);

  // Historial de comprobantes emitidos
  const hoyStr = format(new Date(), 'yyyy-MM-dd');
  const ayerStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const [comprobantesRecientes, setComprobantesRecientes] = useState<any[]>([]);
  const [filtroCpeDrawer, setFiltroCpeDrawer] = useState('');
  const [filtroModoFechaCpe, setFiltroModoFechaCpe] = useState<'HOY' | 'AYER' | 'TODOS' | 'CUSTOM'>('HOY');
  const [filtroFechaCpe, setFiltroFechaCpe] = useState<string>(hoyStr);

  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  const cargarDatos = async () => {
    if (!sedeActiva) return;
    setCargando(true);
    try {
      const [sesion, listaOrdenes, resBienes, resComps] = await Promise.all([
        obtenerSesionCajaActiva(),
        obtenerOrdenesPorCobrar(sedeActiva.id),
        supabase.from('bienes').select('*').eq('tipo_bien', 'producto').limit(40),
        supabase.from('comprobantes').select('*').eq('sede_id', sedeActiva.id).order('fecha_emision', { ascending: false }).limit(25)
      ]);

      setSesionActiva(sesion);
      setOrdenes(listaOrdenes || []);
      setCatalogoProductos(resBienes.data || []);
      setComprobantesRecientes(resComps.data || []);

      if (listaOrdenes && listaOrdenes.length > 0 && oatcSeleccionadasIds.length === 0) {
        setOatcSeleccionadasIds([listaOrdenes[0].id]);
        setClienteNombreInput(listaOrdenes[0].cliente_nombre);
        setClienteDocInput(listaOrdenes[0].cliente_doc || '72918234');
      }
    } catch (e) {
      console.error('Error cargando POS:', e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    const channel = supabase.channel('realtime-caja-pos-unified')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatos())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comprobantes' }, () => cargarDatos())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sedeActiva]);

  // Consolidar ítems
  const ordenesSeleccionadas = ordenes.filter(o => oatcSeleccionadasIds.includes(o.id));
  
  const itemsDeOrdenes: ItemTicket[] = ordenesSeleccionadas.flatMap(o => {
    if (o.tickets && o.tickets.length > 0) {
      return o.tickets.flatMap((t: any) => t.items || []);
    }
    return (o.punto_partida || []).map((p: any) => ({
      nombre: p.nombre,
      tipo: p.tipo_bien || 'servicio',
      precio_base: Number(p.precio || 0),
      precio_final: Number(p.precio || 0),
      cantidad: Number(p.cantidad || 1),
      es_cortesia: false
    }));
  });

  const todosLosItems: ItemTicket[] = [...itemsDeOrdenes, ...itemsManualesRetail];

  // Cálculos de Totales
  const totalBruto = todosLosItems.reduce((acc, i) => {
    if (i.es_cortesia) return acc;
    return acc + (Number(i.precio_final || 0) * Number(i.cantidad || 1));
  }, 0);

  const totalDescuentoCalculado = descuentoPorc > 0 
    ? Number((totalBruto * (descuentoPorc / 100)).toFixed(2)) 
    : descuentoMonto;

  const totalBaseConDescuento = Math.max(0, totalBruto - totalDescuentoCalculado);
  const totalAPagar = Number((totalBaseConDescuento + Number(propinaMonto || 0)).toFixed(2));

  useEffect(() => {
    setMontoEfectivo(totalAPagar);
    setEfectivoRecibido(totalAPagar);
    setMontoTarjeta(0);
    setMontoYape(0);
    setMontoTransf(0);
    setMontoCredito(0);
  }, [totalAPagar]);

  const totalMediosPago = Number(montoEfectivo || 0) + Number(montoTarjeta || 0) + Number(montoYape || 0) + Number(montoTransf || 0) + Number(montoCredito || 0);
  const vueltoCalculado = Math.max(0, Number(efectivoRecibido || 0) - Number(montoEfectivo || 0));

  const handleToggleOatc = (id: string) => {
    setOatcSeleccionadasIds(prev => {
      const exists = prev.includes(id);
      if (exists) {
        if (prev.length === 1 && itemsManualesRetail.length === 0) return prev;
        return prev.filter(x => x !== id);
      }
      return [...prev, id];
    });
  };

  const handleAgregarProductoRetail = (prod: any) => {
    const nuevo: ItemTicket = {
      nombre: prod.nombre,
      tipo: 'producto',
      precio_base: Number(prod.precio_venta || prod.precio || 35),
      precio_final: Number(prod.precio_venta || prod.precio || 35),
      cantidad: 1,
      es_cortesia: false
    };
    setItemsManualesRetail(prev => [...prev, nuevo]);
    showAlert(`Producto agregado: ${prod.nombre}`, 'success');
  };

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sesion = await abrirSesionCaja({
        cajeroNombre,
        montoApertura: montoAperturaInput
      });
      setSesionActiva(sesion);
      setModalAperturaOpen(false);
      showAlert('¡Turno de caja abierto con éxito!', 'success');
    } catch (e: any) {
      showAlert(`Error: ${e.message}`, 'error');
    }
  };

  const handleCerrarCajaCiega = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sesionActiva) return;

    const totalContado = Object.entries(conteoEfectivo).reduce((acc, [den, cant]) => {
      return acc + (Number(den) * Number(cant || 0));
    }, 0);

    try {
      await cerrarSesionCajaCiega({
        sesionId: sesionActiva.id,
        montoCierreReal: totalContado
      });
      setSesionActiva(null);
      setModalCierreCiegoOpen(false);
      showAlert('¡Arqueo ciego completado exitosamente!', 'success');
    } catch (e: any) {
      showAlert(`Error en arqueo: ${e.message}`, 'error');
    }
  };

  // Ejecutar Cobro y Emisión SUNAT
  const handleEjecutarCobro = async () => {
    if (todosLosItems.length === 0) {
      showAlert('No hay ítems en la cuenta para cobrar.', 'error');
      return;
    }
    if (!clienteNombreInput.trim()) {
      showAlert('Ingresa el nombre o razón social del cliente.', 'error');
      return;
    }
    if (Math.abs(totalMediosPago - totalAPagar) > 0.1) {
      showAlert(`La suma de los medios de pago (S/ ${totalMediosPago.toFixed(2)}) debe coincidir con el total a pagar (S/ ${totalAPagar.toFixed(2)}).`, 'error');
      return;
    }

    setIsProcessingCobro(true);
    try {
      const pagosDetalle: Array<{ metodo: string; monto: number }> = [];
      if (montoEfectivo > 0) pagosDetalle.push({ metodo: 'EFECTIVO', monto: montoEfectivo });
      if (montoTarjeta > 0) pagosDetalle.push({ metodo: 'TARJETA', monto: montoTarjeta });
      if (montoYape > 0) pagosDetalle.push({ metodo: 'YAPE', monto: montoYape });
      if (montoTransf > 0) pagosDetalle.push({ metodo: 'TRANSFERENCIA', monto: montoTransf });
      if (montoCredito > 0) pagosDetalle.push({ metodo: 'CREDITO_CLIENTE', monto: montoCredito });

      if (montoCredito > 0) {
        await registrarConsumoCredito({
          clienteId: ordenesSeleccionadas[0]?.cliente_id || 'cli_gen',
          clienteNombre: clienteNombreInput,
          monto: montoCredito,
          descripcion: `Consumo a crédito POS - ${todosLosItems.map(i => i.nombre).join(', ')}`,
          oatcId: oatcSeleccionadasIds[0]
        });
      }

      const respSunat = await emitirComprobanteSunatPSE({
        tipoComprobante,
        clienteTipoDoc: tipoComprobante === 'FACTURA' ? 'RUC' : tipoDocCliente,
        clienteNumDoc: clienteDocInput || '00000000',
        clienteRazonSocial: clienteNombreInput,
        clienteDireccion: clienteDireccionInput,
        items: todosLosItems.map((i) => ({
          descripcion: i.nombre,
          cantidad: i.cantidad || 1,
          precio_unitario: Number(i.precio_final || i.precio_base || 0),
          es_cortesia: i.es_cortesia,
          unidad_de_medida: i.tipo === 'producto' ? 'NIU' : 'ZZ'
        })),
        descuentoGlobal: totalDescuentoCalculado,
        motivoDescuento,
        propinaMonto,
        propinaAgenteNombre: propinaStaffNombre,
        pagosDetalle,
        oatcIds: oatcSeleccionadasIds,
        cajeroNombre: sesionActiva?.cajero_nombre || 'Sócrates'
      });

      // Imprimir por defecto en formato 58mm
      imprimirTicketTermicoHtml({
        tipo: 'COMPROBANTE_SUNAT',
        numeroDocumento: respSunat.comprobanteCompleto,
        clienteNombre: clienteNombreInput,
        clienteDniRuc: `${tipoDocCliente}: ${clienteDocInput || '00000000'}`,
        colaboradorNombre: sesionActiva?.cajero_nombre || 'Cajero POS',
        items: todosLosItems.map((it) => ({
          nombre: it.nombre,
          cantidad: it.cantidad || 1,
          precioUnitario: it.precio_final || it.precio_base || 0,
          subtotal: (it.precio_final || it.precio_base || 0) * (it.cantidad || 1)
        })),
        subtotal: respSunat.subtotal,
        igv: respSunat.igv,
        descuento: totalDescuentoCalculado,
        total: respSunat.total,
        metodoPago: pagosDetalle.map(p => `${p.metodo}: S/ ${p.monto.toFixed(2)}`).join(' | '),
        cadenaQrLegal: respSunat.cadenaQrLegal,
        mensajePie: `SUNAT CPE: ${respSunat.descripcionSunat}`
      }, 58);

      // Abrir Previsualización interactiva
      setComprobantePreview({
        ...respSunat,
        metadata_fiscal: {
          cliente_nombre: clienteNombreInput,
          cliente_tipo_doc: tipoDocCliente,
          cliente_num_doc: clienteDocInput,
          items: todosLosItems,
          pagos_detalle: pagosDetalle
        }
      });

      setOatcSeleccionadasIds([]);
      setItemsManualesRetail([]);
      setDescuentoMonto(0);
      setDescuentoPorc(0);
      setPropinaMonto(0);
      showAlert(`¡Comprobante ${respSunat.comprobanteCompleto} emitido e impreso!`, 'success');
      cargarDatos();
    } catch (err: any) {
      showAlert(`Error en cobranza: ${err.message}`, 'error');
    } finally {
      setIsProcessingCobro(false);
    }
  };

  const handleAbrirPreviewDesdeLista = (comp: any) => {
    setComprobantePreview(comp);
  };

  const handleLanzarImpresionDesdePreview = (ancho: 58 | 80) => {
    if (!comprobantePreview) return;
    const meta = comprobantePreview.metadata_fiscal || {};
    const items = meta.items || [{
      nombre: `Consumo Registrado (${comprobantePreview.tipo_comprobante || 'CPE'})`,
      cantidad: 1,
      precioUnitario: Number(comprobantePreview.total || 0),
      subtotal: Number(comprobantePreview.total || 0)
    }];

    imprimirTicketTermicoHtml({
      tipo: 'COMPROBANTE_SUNAT',
      numeroDocumento: comprobantePreview.comprobanteCompleto || `${comprobantePreview.serie}-${String(comprobantePreview.correlativo).padStart(8, '0')}`,
      clienteNombre: meta.cliente_nombre || 'Cliente General',
      clienteDniRuc: `${meta.cliente_tipo_doc || 'DOC'}: ${meta.cliente_num_doc || '00000000'}`,
      colaboradorNombre: comprobantePreview.cajero_nombre || 'Cajero POS',
      items: items.map((it: any) => ({
        nombre: it.nombre || it.descripcion,
        cantidad: it.cantidad || 1,
        precioUnitario: it.precio_final || it.precioUnitario || it.precio_unitario || 0,
        subtotal: (it.precio_final || it.precioUnitario || it.precio_unitario || 0) * (it.cantidad || 1)
      })),
      subtotal: Number(comprobantePreview.subtotal || 0),
      igv: Number(comprobantePreview.igv || 0),
      descuento: Number(meta.descuento || 0),
      total: Number(comprobantePreview.total || 0),
      cadenaQrLegal: meta.qr_legal || comprobantePreview.cadenaQrLegal,
      mensajePie: 'Comprobante Electrónico Homologado SUNAT'
    }, ancho);

    showAlert(`Ticket enviado a impresión en ${ancho}mm`, 'success');
  };

  const ordenesFiltradas = ordenes.filter(o =>
    !filtroCola ||
    o.cliente_nombre?.toLowerCase().includes(filtroCola.toLowerCase()) ||
    o.agente_nombre?.toLowerCase().includes(filtroCola.toLowerCase()) ||
    o.secuencia?.toString().includes(filtroCola)
  );

  const cpesFiltrados = comprobantesRecientes.filter(c => {
    // 1. Filtro por fecha (fecha_emision o created_at)
    if (filtroModoFechaCpe !== 'TODOS') {
      const targetFecha = filtroModoFechaCpe === 'HOY'
        ? hoyStr
        : filtroModoFechaCpe === 'AYER'
        ? ayerStr
        : filtroFechaCpe;

      const compFecha = (c.fecha_emision || c.created_at || '').split('T')[0];
      if (compFecha && compFecha !== targetFecha) {
        return false;
      }
    }

    // 2. Filtro por texto
    if (!filtroCpeDrawer) return true;
    const q = filtroCpeDrawer.toLowerCase();
    return (
      c.serie?.toLowerCase().includes(q) ||
      c.correlativo?.toString().includes(q) ||
      (c.metadata_fiscal?.cliente_nombre && c.metadata_fiscal.cliente_nombre.toLowerCase().includes(q))
    );
  });

  const totalCpesFiltrados = cpesFiltrados.reduce((acc, c) => acc + Number(c.total || 0), 0);

  return (
    <div className="space-y-4 max-w-7xl mx-auto font-sans p-2 md:p-4 animate-in fade-in">
      
      {/* Header Bar Omnicanal */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            Workspace Venta
          </span>
          <h1 className="text-lg font-black text-slate-800 dark:text-white mt-1 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" /> Workspace Venta & Facturación SUNAT PSE
          </h1>
        </div>

        {/* Botonera de Control de Caja & Herramientas */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Botón Estado de Turno */}
          {sesionActiva ? (
            <div className="flex items-center gap-2 p-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ml-1" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {sesionActiva.cajero_nombre}
              </span>
              <button
                type="button"
                onClick={() => setModalCierreCiegoOpen(true)}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] rounded-xl transition shadow-sm cursor-pointer"
              >
                Arqueo Ciego
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setModalAperturaOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <Unlock className="w-3.5 h-3.5" /> Abrir Turno
            </button>
          )}

          {/* Botón Venta de Vitrina / Retail */}
          <button
            type="button"
            onClick={() => setModalRetailOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-2xl text-xs font-bold transition border border-indigo-200 dark:border-indigo-800 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-indigo-500" />
            <span>➕ Venta Vitrina</span>
          </button>

          {/* Botón CPEs Emitidos Hoy (Abre Drawer Lateral) */}
          <button
            type="button"
            onClick={() => setModalDrawerCpesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-300 rounded-2xl text-xs font-bold transition border border-emerald-200 dark:border-emerald-800 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-emerald-500" />
            <span>📄 CPEs Emitidos</span>
            <span className="bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full ml-0.5">
              {comprobantesRecientes.length}
            </span>
          </button>

          {/* Botón Operaciones Diarias de Caja (Abre Drawer Lateral) */}
          <button
            type="button"
            onClick={() => setModalOperacionesCajaOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-2xl text-xs font-bold transition border border-amber-200 dark:border-amber-800 cursor-pointer"
            title="Registrar gastos menores de caja chica, compras urgentes e ingresos del turno"
          >
            <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>💼 Operaciones de Caja</span>
          </button>

          <button
            type="button"
            onClick={cargarDatos}
            className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-2xl transition cursor-pointer"
            title="Recargar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grid Principal de 2 Columnas Amplias */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* COL 1: Cola de Tickets & Split Billing (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Tickets por Cobrar
              </h2>
              <p className="text-[10px] text-slate-400">Selecciona para cobro o división de cuenta</p>
            </div>
            <span className="text-[10px] font-black bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {ordenes.length} en cola
            </span>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filtroCola}
              onChange={(e) => setFiltroCola(e.target.value)}
              placeholder="Buscar cliente, ticket, staff..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[580px]">
            {cargando ? (
              <div className="py-10 text-center text-xs text-slate-400 animate-pulse">
                Cargando cola de cobro...
              </div>
            ) : ordenesFiltradas.length === 0 && itemsManualesRetail.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/30" />
                <span className="font-bold text-slate-500">No hay tickets pendientes de cobro.</span>
                <p className="text-[10px] text-slate-400">Usa "➕ Venta Vitrina" para vender productos.</p>
              </div>
            ) : (
              ordenesFiltradas.map((ord) => {
                const isSelected = oatcSeleccionadasIds.includes(ord.id);
                const totalOrd = (ord.punto_partida || []).reduce((acc: number, p: any) => acc + (p.precio || 0) * (p.cantidad || 1), 0);

                return (
                  <div
                    key={ord.id}
                    onClick={() => handleToggleOatc(ord.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-xs text-indigo-600 dark:text-indigo-400">
                        OATC #{ord.secuencia || ord.id.slice(0, 5)}
                      </span>
                      <span className="font-mono font-black text-xs text-slate-800 dark:text-white">
                        S/ {totalOrd.toFixed(2)}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      {ord.cliente_nombre || 'Cliente General'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800">
                      <span>Staff: {ord.agente_nombre || 'Especialista'}</span>
                      <span className={`font-bold ${isSelected ? 'text-indigo-500' : 'text-slate-400'}`}>
                        {isSelected ? '✓ Seleccionado' : '+ Agregar a Cuenta'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* COL 2: Mesa de Cobro & Facturación SUNAT (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 flex flex-col shadow-sm space-y-4">
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">
                Mesa de Cobro Activa
              </span>
              <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-500" />
                {tipoComprobante} Electrónica SUNAT
              </h2>
            </div>

            {/* Selector de Tipo Comprobante */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['BOLETA', 'FACTURA', 'NOTA_VENTA'] as TipoComprobanteFiscal[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTipoComprobante(t);
                    if (t === 'FACTURA') setTipoDocCliente('RUC');
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    tipoComprobante === t
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                  }`}
                >
                  {t === 'BOLETA' ? 'Boleta' : t === 'FACTURA' ? 'Factura' : 'Nota de Venta'}
                </button>
              ))}
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Tipo Doc:</label>
              <select
                value={tipoDocCliente}
                onChange={(e) => setTipoDocCliente(e.target.value as any)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-slate-800 dark:text-white"
              >
                <option value="DNI">DNI</option>
                <option value="RUC">RUC</option>
                <option value="CE">C. Extranjería</option>
                <option value="SIN_DOC">Sin Doc</option>
              </select>
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Nº Documento:</label>
              <input
                type="text"
                value={clienteDocInput}
                onChange={(e) => setClienteDocInput(e.target.value)}
                placeholder="72918234"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Cliente / Razón Social:</label>
              <input
                type="text"
                value={clienteNombreInput}
                onChange={(e) => setClienteNombreInput(e.target.value)}
                placeholder="Nombre del cliente..."
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 text-xs font-semibold text-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Resumen de Ítems */}
          <div className="flex-1 overflow-y-auto max-h-[140px] space-y-1.5 pr-1 border-b border-slate-100 dark:border-slate-800 pb-2">
            {todosLosItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Selecciona tickets en la cola izquierda o agrega productos de vitrina.
              </div>
            ) : (
              todosLosItems.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{item.nombre}</span>
                    <span className="text-[10px] text-slate-400 ml-1">x{item.cantidad || 1}</span>
                  </div>
                  <span className="font-mono font-black text-slate-800 dark:text-white">
                    S/ {((item.precio_final || item.precio_base || 0) * (item.cantidad || 1)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Descuentos & Propinas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900 space-y-1">
              <label className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                <Percent className="w-3 h-3" /> Descuento (S/):
              </label>
              <input
                type="number"
                value={descuentoMonto}
                onChange={(e) => {
                  setDescuentoMonto(Math.max(0, Number(e.target.value)));
                  setDescuentoPorc(0);
                }}
                min={0}
                className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-xl p-1.5 font-mono font-bold text-indigo-600 dark:text-indigo-400"
              />
            </div>

            <div className="p-2.5 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900 space-y-1">
              <label className="text-[9px] font-bold text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1">
                <Heart className="w-3 h-3" /> Propina Staff (S/):
              </label>
              <input
                type="number"
                value={propinaMonto}
                onChange={(e) => setPropinaMonto(Math.max(0, Number(e.target.value)))}
                min={0}
                className="w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-xl p-1.5 font-mono font-bold text-rose-600 dark:text-rose-400"
              />
            </div>
          </div>

          {/* Medios de Pago Mixtos */}
          <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">Medios de Pago Mixtos:</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="text-[9px] text-slate-500 font-bold">💵 Efectivo:</label>
                <input
                  type="number"
                  value={montoEfectivo}
                  onChange={(e) => setMontoEfectivo(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-bold">💳 Tarjeta POS:</label>
                <input
                  type="number"
                  value={montoTarjeta}
                  onChange={(e) => setMontoTarjeta(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-bold">📱 Yape/Plin:</label>
                <input
                  type="number"
                  value={montoYape}
                  onChange={(e) => setMontoYape(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono font-bold text-purple-500"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 font-bold">🏛️ Crédito:</label>
                <input
                  type="number"
                  value={montoCredito}
                  onChange={(e) => setMontoCredito(Number(e.target.value))}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 font-mono font-bold text-amber-500"
                />
              </div>
            </div>

            {/* Efectivo Recibido & Vuelto */}
            {montoEfectivo > 0 && (
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500">Paga con:</span>
                  <input
                    type="number"
                    value={efectivoRecibido}
                    onChange={(e) => setEfectivoRecibido(Number(e.target.value))}
                    className="w-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs font-mono font-bold"
                  />
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500">Vuelto: </span>
                  <strong className="font-mono text-emerald-500 text-sm">S/ {vueltoCalculado.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Botón Principal de Cobro & Emisión Fiscal */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Total a Cobrar:</span>
              <strong className="text-2xl font-black font-mono text-emerald-500">
                S/ {totalAPagar.toFixed(2)}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleEjecutarCobro}
              disabled={isProcessingCobro || todosLosItems.length === 0}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-600/30 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Printer className={`w-4 h-4 ${isProcessingCobro ? 'animate-spin' : ''}`} />
              <span>{isProcessingCobro ? 'Emitiendo SUNAT...' : 'Emitir & Imprimir (58mm)'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* DRAWER / MODAL: CPEs Emitidos con Filtro de Fecha */}
      {modalDrawerCpesOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-end p-0 animate-in fade-in">
          <div className="bg-slate-900 border-l border-slate-800 w-full max-w-md h-full p-5 space-y-3.5 shadow-2xl flex flex-col text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-black text-white">CPEs Emitidos</h3>
                  <p className="text-[10px] text-slate-400">Comprobantes fiscales electrónicos SUNAT</p>
                </div>
              </div>
              <button onClick={() => setModalDrawerCpesOpen(false)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Rango de Fecha */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['HOY', 'AYER', 'TODOS', 'CUSTOM'] as const).map(modo => (
                  <button
                    key={modo}
                    type="button"
                    onClick={() => {
                      setFiltroModoFechaCpe(modo);
                      if (modo === 'HOY') setFiltroFechaCpe(hoyStr);
                      if (modo === 'AYER') setFiltroFechaCpe(ayerStr);
                    }}
                    className={`px-3 py-1 text-xs font-bold rounded-xl transition cursor-pointer ${
                      filtroModoFechaCpe === modo
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {modo === 'HOY' ? '📅 Hoy' : modo === 'AYER' ? '📅 Ayer' : modo === 'TODOS' ? '🌐 Todos' : '📆 Fecha'}
                  </button>
                ))}
              </div>

              {filtroModoFechaCpe === 'CUSTOM' && (
                <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800 animate-in fade-in">
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <input
                    type="date"
                    value={filtroFechaCpe}
                    onChange={(e) => setFiltroFechaCpe(e.target.value)}
                    className="bg-transparent text-xs font-bold text-white outline-none w-full cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Resumen de Total Facturado */}
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  {filtroModoFechaCpe === 'HOY' ? 'Facturado Hoy' : filtroModoFechaCpe === 'AYER' ? 'Facturado Ayer' : filtroModoFechaCpe === 'TODOS' ? 'Total Histórico' : `Facturado (${filtroFechaCpe})`}
                </span>
                <span className="text-xs text-slate-400">
                  {cpesFiltrados.length} comprobante(s) emitidos
                </span>
              </div>
              <strong className="text-sm font-black text-emerald-400">
                S/ {totalCpesFiltrados.toFixed(2)}
              </strong>
            </div>

            {/* Buscador de Texto */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={filtroCpeDrawer}
                onChange={(e) => setFiltroCpeDrawer(e.target.value)}
                placeholder="Buscar por serie, número o cliente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {cpesFiltrados.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No hay comprobantes emitidos con ese criterio.
                </div>
              ) : (
                cpesFiltrados.map((comp) => {
                  const meta = comp.metadata_fiscal || {};
                  return (
                    <div
                      key={comp.id}
                      onClick={() => handleAbrirPreviewDesdeLista(comp)}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-emerald-500/60 rounded-2xl transition cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-emerald-400 text-xs">
                          {comp.serie}-{String(comp.correlativo).padStart(8, '0')}
                        </span>
                        <span className="font-mono font-bold text-white text-xs">
                          S/ {Number(comp.total).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-200 truncate">
                        {meta.cliente_nombre || 'Cliente General'}
                      </p>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-900">
                        <span>{comp.fecha_emision ? new Date(comp.fecha_emision).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}</span>
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Ver Ticket Térmico
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalDrawerCpesOpen(false)}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
              >
                Cerrar Bandeja
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Previsualización de Ticket Térmico (58mm / 80mm) */}
      {comprobantePreview && (
        <div className="fixed inset-0 z-[130] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 w-full max-w-lg space-y-4 shadow-2xl text-slate-100">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black text-white">Previsualización de Ticket Térmico</h3>
              </div>
              <button onClick={() => setComprobantePreview(null)} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector de Ancho Térmico */}
            <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <span className="text-xs font-bold text-slate-400">Formato de Impresora:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setAnchoTermicoPreview(58)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    anchoTermicoPreview === 58
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧾 58mm (Mini POS)
                </button>
                <button
                  type="button"
                  onClick={() => setAnchoTermicoPreview(80)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                    anchoTermicoPreview === 80
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📄 80mm (Estándar)
                </button>
              </div>
            </div>

            {/* Mockup Visual del Ticket Térmico */}
            <div className="flex justify-center p-3 bg-slate-950 rounded-2xl border border-slate-800 max-h-72 overflow-y-auto">
              <div className={`bg-white text-black p-3 font-mono shadow-md ${anchoTermicoPreview === 58 ? 'w-[200px] text-[10px]' : 'w-[280px] text-xs'}`}>
                <div className="text-center font-black">VAIKUNTHA SALON & SPA</div>
                <div className="text-center text-[9px]">RUC: 20608945123</div>
                <div className="border-b border-black my-1 border-dashed"></div>
                <div className="text-center font-bold">{comprobantePreview.tipo_comprobante || 'BOLETA ELECTRÓNICA'}</div>
                <div className="text-center font-bold">{comprobantePreview.comprobanteCompleto || `${comprobantePreview.serie}-${String(comprobantePreview.correlativo).padStart(8, '0')}`}</div>
                <div className="border-b border-black my-1 border-dashed"></div>
                <div className="flex justify-between"><span>CLIENTE:</span><span className="font-bold">{comprobantePreview.metadata_fiscal?.cliente_nombre || 'Cliente General'}</span></div>
                <div className="flex justify-between"><span>TOTAL:</span><span className="font-black">S/ {Number(comprobantePreview.total).toFixed(2)}</span></div>
                <div className="border-b border-black my-1 border-dashed"></div>
                <div className="text-center text-[8px]">Representación Impresa del CPE SUNAT ({anchoTermicoPreview}mm)</div>
              </div>
            </div>

            {/* Acciones de Impresión */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {comprobantePreview.metadata_fiscal?.enlace_pdf && (
                <a
                  href={comprobantePreview.metadata_fiscal.enlace_pdf}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> PDF SUNAT
                </a>
              )}
              
              <button
                type="button"
                onClick={() => handleLanzarImpresionDesdePreview(anchoTermicoPreview)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 ml-auto"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir en {anchoTermicoPreview}mm</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Retail / Vitrina */}
      {modalRetailOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-2xl space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black text-white">Venta Rápida de Vitrina / Retail</h3>
              </div>
              <button onClick={() => setModalRetailOpen(false)} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {catalogoProductos.map((prod) => (
                <button
                  key={prod.id}
                  type="button"
                  onClick={() => handleAgregarProductoRetail(prod)}
                  className="p-3 bg-slate-950/80 hover:bg-indigo-950/40 border border-slate-800 hover:border-indigo-500 rounded-2xl text-left transition active:scale-95"
                >
                  <p className="text-xs font-bold text-white truncate">{prod.nombre}</p>
                  <p className="text-[10px] font-mono text-indigo-400 mt-1">S/ {Number(prod.precio_venta || prod.precio || 35).toFixed(2)}</p>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button onClick={() => setModalRetailOpen(false)} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl">
                Listo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Apertura de Caja */}
      {modalAperturaOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleAbrirCaja} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Unlock className="w-4 h-4 text-emerald-400" /> Apertura de Turno de Caja
            </h3>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nombre del Cajero:</label>
              <input
                type="text"
                value={cajeroNombre}
                onChange={(e) => setCajeroNombre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-bold text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Monto Inicial (Fondo de Sencillo S/):</label>
              <input
                type="number"
                value={montoAperturaInput}
                onChange={(e) => setMontoAperturaInput(Number(e.target.value))}
                min={0}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs font-mono font-black text-emerald-400"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setModalAperturaOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl">Abrir Turno</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal Cierre Ciego */}
      {modalCierreCiegoOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCerrarCajaCiega} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-4 text-slate-100">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-rose-400" /> Arqueo Ciego de Cierre de Caja
            </h3>
            <p className="text-[10px] text-slate-400">Ingresa la cantidad física de billetes y monedas contados sin ver el sistema.</p>
            
            <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {['200', '100', '50', '20', '10', '5', '2', '1', '0.5'].map((den) => (
                <div key={den} className="p-2 bg-slate-950 border border-slate-800 rounded-xl">
                  <label className="text-[9px] text-slate-400 font-bold">S/ {den}:</label>
                  <input
                    type="number"
                    value={conteoEfectivo[den] || ''}
                    onChange={(e) => setConteoEfectivo({ ...conteoEfectivo, [den]: Number(e.target.value) })}
                    min={0}
                    placeholder="0"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs font-mono font-bold text-white mt-0.5"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setModalCierreCiegoOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl">Cancelar</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl">Finalizar Arqueo Ciego</button>
            </div>
          </form>
        </div>
      )}

      {/* Drawer Lateral de Operaciones Diarias & Gastos Menores */}
      <OperacionesCajaDrawer
        isOpen={modalOperacionesCajaOpen}
        onClose={() => setModalOperacionesCajaOpen(false)}
        sedeId={sedeActiva?.id}
        cajeroNombre={sesionActiva?.cajero_nombre || 'Cajero POS'}
        onOperacionCompletada={cargarDatos}
      />

    </div>
  );
}
