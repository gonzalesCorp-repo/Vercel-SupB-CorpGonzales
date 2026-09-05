'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';
import { createClient } from '@/lib/supabase/client';
import { registrarIngresoCentral } from '@/services/lab';
import { obtenerFacturasCompras } from '@/services/facturasCompras';
import { FacturaCompra } from '@/types/facturasCompras';
import { TablePagination } from '@/components/ui/TablePagination';
import { 
  Download, Search, Plus, Trash2, FileText, CheckCircle2, 
  PackageSearch, Building2, Calendar, DollarSign, Layers,
  ShoppingBag, FlaskConical, Wrench, Scissors, HardHat, Armchair,
  Check, Edit3, ArrowRight, ShieldCheck, Tag
} from 'lucide-react';

const supabase = createClient();

type CategoriaBienFiltro = 'TODOS' | 'PRODUCTO' | 'INSUMO' | 'REPUESTO' | 'EQUIPO' | 'MATERIAL' | 'ACTIVO';

// Catálogo demo de fábrica para cuando no hay conexión con Supabase
const CATALOGO_DEMO_SEED = [
  { id: 'b_001', nombre: 'Shampoo Serie Expert Absolut Repair 300ml', tipo_bien: 'producto', sku: 'LOR-SH-ABS-300', precio_venta: 85.00, costo_base: 45.00, categoria: 'PRODUCTO' },
  { id: 'b_002', nombre: 'Mascarilla Capilar Nutritiva Metal Detox 250ml', tipo_bien: 'producto', sku: 'LOR-MK-MTD-250', precio_venta: 120.00, costo_base: 65.00, categoria: 'PRODUCTO' },
  { id: 'b_003', nombre: 'Aceite de Argán Tratamiento Sublime 100ml', tipo_bien: 'producto', sku: 'WEL-OIL-ARG-100', precio_venta: 95.00, costo_base: 50.00, categoria: 'PRODUCTO' },
  { id: 'b_004', nombre: 'Tinte Inoa Sin Amoníaco 60g - Tono 6.0 Rubio Oscuro', tipo_bien: 'insumo', sku: 'LOR-INO-60G-60', precio_venta: 45.00, costo_base: 24.00, categoria: 'INSUMO' },
  { id: 'b_005', nombre: 'Tinte Majirel 50g - Tono 7.1 Rubio Cenizo', tipo_bien: 'insumo', sku: 'LOR-MAJ-50G-71', precio_venta: 38.00, costo_base: 20.00, categoria: 'INSUMO' },
  { id: 'b_006', nombre: 'Oxidante en Crema 20 Volúmenes 1000ml', tipo_bien: 'insumo', sku: 'LOR-OX-20V-1000', precio_venta: 60.00, costo_base: 32.00, categoria: 'INSUMO' },
  { id: 'b_007', nombre: 'Polvo Decolorante Blond Studio 500g', tipo_bien: 'insumo', sku: 'LOR-DEC-BLN-500', precio_venta: 110.00, costo_base: 62.00, categoria: 'INSUMO' },
  { id: 'b_008', nombre: 'Repuesto Resistencia Térmica Secadora Parlux 385', tipo_bien: 'repuesto', sku: 'REP-RES-PAR-385', precio_venta: 140.00, costo_base: 85.00, categoria: 'REPUESTO' },
  { id: 'b_009', nombre: 'Juego de Carbones para Motor de Turbina Salón', tipo_bien: 'repuesto', sku: 'REP-CARB-TUR-01', precio_venta: 35.00, costo_base: 18.00, categoria: 'REPUESTO' },
  { id: 'b_010', nombre: 'Tijera de Corte Profesional Jaguar Ergo 5.5"', tipo_bien: 'equipo', sku: 'EQ-TIJ-JAG-55', precio_venta: 320.00, costo_base: 210.00, categoria: 'EQUIPO' },
  { id: 'b_011', nombre: 'Plancha Cerámica Titanium Digital Nano 450°F', tipo_bien: 'equipo', sku: 'EQ-PLN-TIT-450', precio_venta: 380.00, costo_base: 240.00, categoria: 'EQUIPO' },
  { id: 'b_012', nombre: 'Pintura Epóxica Antibacterial Lavable Blanco Salón 1 Gal', tipo_bien: 'material', sku: 'MAT-PNT-EPO-1G', precio_venta: 160.00, costo_base: 115.00, categoria: 'MATERIAL' },
  { id: 'b_013', nombre: 'Pack Focos LED Iluminación Luz Neutra 4000K CRI95 (x6)', tipo_bien: 'material', sku: 'MAT-LED-CRI-X6', precio_venta: 90.00, costo_base: 55.00, categoria: 'MATERIAL' },
  { id: 'b_014', nombre: 'Sillón de Corte Hidráulico Tapiz Cuero Premium Reclinable', tipo_bien: 'mobiliario', sku: 'MOB-SIL-COR-HID', precio_venta: 1250.00, costo_base: 850.00, categoria: 'ACTIVO' },
  { id: 'b_015', nombre: 'Lavacabezas Ergonómico Cerámica Basculante con Grifería', tipo_bien: 'mobiliario', sku: 'MOB-LAV-ERG-CER', precio_venta: 1850.00, costo_base: 1200.00, categoria: 'ACTIVO' }
];

export default function IngresoCentralPanel() {
  const [bienes, setBienes] = useState<any[]>(CATALOGO_DEMO_SEED);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<CategoriaBienFiltro>('TODOS');
  const [search, setSearch] = useState('');

  // Paginación para Catálogo de Bienes
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  
  // Enlace con Facturas de Compras
  const [facturasDisponibles, setFacturasDisponibles] = useState<FacturaCompra[]>([]);
  const [facturaSeleccionadaId, setFacturaSeleccionadaId] = useState<string>('');
  const [modoReferencia, setModoReferencia] = useState<'FACTURA_REGISTRADA' | 'MANUAL'>('FACTURA_REGISTRADA');
  const [referenciaManual, setReferenciaManual] = useState('GR-001-0042');
  
  // Carrito de recepción
  const [carrito, setCarrito] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { showAlert } = useUIStore();

  useEffect(() => {
    const loadBienesYFacturas = async () => {
      try {
        const [resBienes, facturas] = await Promise.all([
          supabase.from('bienes').select('*').order('nombre').limit(1000),
          obtenerFacturasCompras({ sedeId: sedeActiva?.id })
        ]);

        if (resBienes?.data && resBienes.data.length > 0) {
          const existingIds = new Set(resBienes.data.map((b: any) => b.id));
          const complementary = CATALOGO_DEMO_SEED.filter(c => !existingIds.has(c.id));
          setBienes([...resBienes.data, ...complementary]);
        } else {
          setBienes(CATALOGO_DEMO_SEED);
        }

        setFacturasDisponibles(facturas || []);
        if (facturas && facturas.length > 0) {
          setFacturaSeleccionadaId(facturas[0].id);
        }
      } catch (e) {
        console.warn('Usando catálogo demo en Ingreso Central:', e);
        setBienes(CATALOGO_DEMO_SEED);
      }
    };
    loadBienesYFacturas();
  }, [sedeActiva]);

  // Reiniciar a la primera página ante cambios en búsqueda o categoría
  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoriaSeleccionada]);

  // Factura activa seleccionada
  const facturaSeleccionada = facturasDisponibles.find(f => f.id === facturaSeleccionadaId);
  const referenciaFinal = modoReferencia === 'FACTURA_REGISTRADA' && facturaSeleccionada
    ? `${facturaSeleccionada.tipo_comprobante} #${facturaSeleccionada.serie}-${facturaSeleccionada.numero} (${facturaSeleccionada.proveedor_razon_social})`
    : referenciaManual;

  // Filtrado de bienes por categoría y texto
  const filteredBienes = bienes.filter(b => {
    // Filtro por categoría
    const tipo = (b.tipo_bien || b.categoria || '').toUpperCase();
    let cumpleCategoria = true;
    if (categoriaSeleccionada === 'PRODUCTO') cumpleCategoria = tipo.includes('PRODUCTO');
    else if (categoriaSeleccionada === 'INSUMO') cumpleCategoria = tipo.includes('INSUMO');
    else if (categoriaSeleccionada === 'REPUESTO') cumpleCategoria = tipo.includes('REPUESTO');
    else if (categoriaSeleccionada === 'EQUIPO') cumpleCategoria = tipo.includes('EQUIPO');
    else if (categoriaSeleccionada === 'MATERIAL') cumpleCategoria = tipo.includes('MATERIAL');
    else if (categoriaSeleccionada === 'ACTIVO') cumpleCategoria = tipo.includes('MOBILIARIO') || tipo.includes('ACTIVO');

    // Filtro por texto
    const cumpleTexto = !search || 
      b.nombre.toLowerCase().includes(search.toLowerCase()) || 
      (b.sku && b.sku.toLowerCase().includes(search.toLowerCase()));

    return cumpleCategoria && cumpleTexto;
  });

  // Bienes paginados para la vista actual
  const paginatedBienes = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredBienes.slice(startIndex, startIndex + pageSize);
  }, [filteredBienes, currentPage, pageSize]);

  const getDestinoBadge = (tipoBien: string) => {
    const t = (tipoBien || '').toUpperCase();
    if (t.includes('PRODUCTO')) return { label: '🛍️ Retail', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (t.includes('INSUMO')) return { label: '🧪 Insumo Lab', bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' };
    if (t.includes('REPUESTO')) return { label: '🔧 Repuesto', bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    if (t.includes('EQUIPO')) return { label: '✂️ Equipo', bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' };
    if (t.includes('MATERIAL')) return { label: '🧱 Material', bg: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800' };
    if (t.includes('MOBILIARIO') || t.includes('ACTIVO')) return { label: '🪑 Activo Fijo', bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' };
    return { label: '📦 Mercadería', bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200' };
  };

  const addToCart = (bien: any) => {
    const costoUnit = Number(bien.costo_base || bien.precio_venta || 0);
    const exists = carrito.find(c => c.bien_id === bien.id);
    if (exists) {
      setCarrito(carrito.map(c => c.bien_id === bien.id ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.costo_unitario } : c));
    } else {
      setCarrito([...carrito, { 
        bien_id: bien.id, 
        nombre: bien.nombre,
        tipo_bien: bien.tipo_bien || bien.categoria || 'insumo',
        sku: bien.sku || 'SIN-SKU',
        costo_unitario: costoUnit,
        cantidad: 1,
        subtotal: costoUnit
      }]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) return;
    setCarrito(carrito.map(c => c.bien_id === id ? { ...c, cantidad: qty, subtotal: qty * c.costo_unitario } : c));
  };

  const updateCost = (id: string, cost: number) => {
    if (cost < 0) return;
    setCarrito(carrito.map(c => c.bien_id === id ? { ...c, costo_unitario: cost, subtotal: c.cantidad * cost } : c));
  };

  const remove = (id: string) => {
    setCarrito(carrito.filter(c => c.bien_id !== id));
  };

  const handleIngreso = async () => {
    if (carrito.length === 0 || !referenciaFinal.trim()) {
      showAlert('Por favor agrega ítems y verifica el documento de referencia.', 'error');
      return;
    }
    setIsProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let userId = null;
      if (user) {
        const { data: ag } = await supabase.from('agentes').select('id').eq('email', user.email).single();
        if (ag) userId = ag.id;
      }

      await registrarIngresoCentral(carrito, referenciaFinal, userId || '');
      showAlert(`¡Ingreso registrado con éxito! ${carrito.length} ítems incorporados al Almacén Central.`, 'success');
      setCarrito([]);
    } catch (e: any) {
      showAlert(e.message || 'Error registrando ingreso', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const total = carrito.reduce((sum, item) => sum + item.subtotal, 0);

  return (
    <div className="flex flex-col h-full gap-5 animate-in fade-in">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
            Logística & Almacén Central
          </span>
          <h1 className="text-xl font-black text-slate-800 dark:text-white mt-1.5 flex items-center gap-2.5">
            <Download className="w-6 h-6 text-indigo-600" />
            Ingreso Central & Recepción de Mercadería
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Recepción física, validación de bultos y entrada a Kardex vinculada a Facturas de Compras.
          </p>
        </div>

        {/* Badge de Segregación de Responsabilidades */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-slate-600 dark:text-slate-300 font-medium">
            Flujo Integrado: <strong>Finanzas (Contable)</strong> ➔ <strong>Almacén (Kardex Físico)</strong>
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
        
        {/* Columna Izquierda: Catálogo Categórico de Bienes */}
        <div className="w-full lg:w-5/12 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 flex flex-col flex-1 min-h-0">
            
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" /> Catálogo de Bienes
              </h2>
              <span className="text-[11px] text-slate-400 font-bold">
                {filteredBienes.length} disponibles
              </span>
            </div>

            {/* Selector de Categorías (Chips / Pestañas) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
              {[
                { id: 'TODOS', label: 'Todos', icon: Layers },
                { id: 'PRODUCTO', label: '🛍️ Retail', icon: ShoppingBag },
                { id: 'INSUMO', label: '🧪 Insumos Lab', icon: FlaskConical },
                { id: 'REPUESTO', label: '🔧 Repuestos', icon: Wrench },
                { id: 'EQUIPO', label: '✂️ Equipos', icon: Scissors },
                { id: 'MATERIAL', label: '🧱 Materiales', icon: HardHat },
                { id: 'ACTIVO', label: '🪑 Mobiliario', icon: Armchair },
              ].map(cat => {
                const isSelected = categoriaSeleccionada === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoriaSeleccionada(cat.id as CategoriaBienFiltro)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Buscador de Texto */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-2xl text-xs font-medium text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Lista de Bienes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
              {paginatedBienes.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No hay bienes en esta categoría o con ese criterio de búsqueda.
                </div>
              ) : (
                paginatedBienes.map(b => {
                  const badge = getDestinoBadge(b.tipo_bien || b.categoria);
                  return (
                    <div 
                      key={b.id} 
                      className="group flex justify-between items-center p-3 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl cursor-pointer transition"
                      onClick={() => addToCart(b)}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{b.sku || 'SIN-SKU'}</span>
                        </div>
                        <p className="font-bold text-xs text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 truncate">
                          {b.nombre}
                        </p>
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 block">
                          Costo Ref: S/ {Number(b.costo_base || b.precio_venta || 0).toFixed(2)}
                        </span>
                      </div>

                      <button 
                        type="button"
                        className="p-2 bg-indigo-600 text-white rounded-xl shadow-sm opacity-90 group-hover:opacity-100 group-hover:scale-105 transition flex items-center justify-center cursor-pointer"
                        title="Agregar a la recepción"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Paginación Reactiva de Bienes */}
            {filteredBienes.length > 0 && (
              <TablePagination
                currentPage={currentPage}
                totalItems={filteredBienes.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 25, 50, 100]}
                itemName="bienes"
                compact={true}
              />
            )}

          </div>
        </div>

        {/* Columna Derecha: Detalle de Recepción & Enlace con Factura */}
        <div className="w-full lg:w-7/12 flex flex-col gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col flex-1 min-h-0 overflow-hidden">
            
            {/* Header Detalle & Selector de Documento de Referencia */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" /> Detalle de Recepción
                </h2>

                {/* Switch Factura Registrada vs Manual */}
                <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setModoReferencia('FACTURA_REGISTRADA')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      modoReferencia === 'FACTURA_REGISTRADA'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    🧾 Factura de Compra
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoReferencia('MANUAL')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      modoReferencia === 'MANUAL'
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    ✍️ Guía / Manual
                  </button>
                </div>
              </div>

              {/* Selector de Factura de Compra */}
              {modoReferencia === 'FACTURA_REGISTRADA' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                      Vincular Factura:
                    </label>
                    <select
                      value={facturaSeleccionadaId}
                      onChange={(e) => setFacturaSeleccionadaId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {facturasDisponibles.length === 0 ? (
                        <option value="">No hay facturas de compras registradas</option>
                      ) : (
                        facturasDisponibles.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.proveedor_razon_social} • {f.tipo_comprobante} #{f.serie}-{f.numero} (Total: S/ {Number(f.total).toFixed(2)})
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Card Resumen de la Factura Vinculada */}
                  {facturaSeleccionada && (
                    <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between text-xs animate-in fade-in">
                      <div>
                        <strong className="text-indigo-900 dark:text-indigo-200 block font-bold">
                          {facturaSeleccionada.proveedor_razon_social} (RUC: {facturaSeleccionada.proveedor_ruc})
                        </strong>
                        <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300">
                          {facturaSeleccionada.tipo_comprobante} #{facturaSeleccionada.serie}-{facturaSeleccionada.numero} • Condición: {facturaSeleccionada.condicion_pago.replace('CREDITO_', 'Crédito ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Factura</span>
                        <strong className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                          S/ {Number(facturaSeleccionada.total).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Entrada Manual de Guía */
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0">
                    Doc. Referencia:
                  </label>
                  <input 
                    type="text" 
                    value={referenciaManual}
                    onChange={(e) => setReferenciaManual(e.target.value)}
                    placeholder="Ej. GR-001-0042 / Guía Remisión"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

            </div>
            
            {/* Tabla de Ítems en Recepción */}
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="text-[10px] text-slate-400 uppercase font-black border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Destino & Producto</th>
                    <th className="px-4 py-3 text-right">Costo U. (S/)</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {carrito.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center">
                          <PackageSearch className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-2" />
                          <p className="font-bold text-xs">Aún no has agregado productos a la recepción.</p>
                          <span className="text-[11px] text-slate-400 mt-0.5">Selecciona ítems del catálogo izquierdo para recibirlos.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    carrito.map(item => {
                      const badge = getDestinoBadge(item.tipo_bien);
                      return (
                        <tr key={item.bien_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badge.bg}`}>
                                {badge.label}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{item.sku}</span>
                            </div>
                            <strong className="text-slate-800 dark:text-slate-100 block text-xs">
                              {item.nombre}
                            </strong>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <input 
                              type="number" 
                              min="0"
                              step="0.01"
                              value={item.costo_unitario}
                              onChange={(e) => updateCost(item.bien_id, Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-right text-xs font-bold text-slate-800 dark:text-white outline-none"
                            />
                          </td>

                          <td className="px-4 py-3 text-center">
                            <input 
                              type="number" 
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => updateQuantity(item.bien_id, Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-indigo-50/50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg text-center text-xs font-black text-indigo-700 dark:text-indigo-300 outline-none"
                            />
                          </td>

                          <td className="px-4 py-3 text-right font-black text-slate-800 dark:text-white">
                            S/ {item.subtotal.toFixed(2)}
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button 
                              type="button"
                              onClick={() => remove(item.bien_id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Quitar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Footer de Confirmación */}
            <div className="p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Total de la Recepción ({carrito.length} ítems)
                </p>
                <p className="text-2xl font-black text-slate-800 dark:text-white">
                  S/ {total.toFixed(2)}
                </p>
              </div>

              <button 
                type="button"
                onClick={handleIngreso}
                disabled={isProcessing || carrito.length === 0 || !referenciaFinal}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold px-6 py-3 rounded-2xl shadow-sm transition flex items-center gap-2 text-xs cursor-pointer disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Procesando Ingreso...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Ingreso a Central</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
