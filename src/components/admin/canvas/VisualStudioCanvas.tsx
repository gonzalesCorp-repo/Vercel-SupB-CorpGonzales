'use client';

import React, { useState, useMemo } from 'react';
import { 
  CanvasModo, NodoPipelineData, NodoBienCanvasData, 
  AristaCanvas, MisionDidactica 
} from '@/types/catalogoCanvas';
import { NodePipelineOperativo } from './NodePipelineOperativo';
import { NodeBienReceta } from './NodeBienReceta';
import { 
  Layers, GitBranch, Cpu, Trophy, CheckCircle2, 
  Sparkles, ZoomIn, ZoomOut, RotateCcw, Play, 
  ArrowRight, ShieldCheck, Plus, Search, Info, HelpCircle
} from 'lucide-react';

// Nodos iniciales del Pipeline de Salón (Bizagi BPMN)
const PIPELINE_INICIAL: NodoPipelineData[] = [
  {
    id: 'pipe-1',
    etapa: 'CHECKIN',
    nombre: 'Check-in & Anfitrionaje',
    subtitulo: 'Tótem Kiosko VIP con reconocimiento DNI/Celular y bebida de cortesía.',
    icono: 'UserCheck',
    color: '#38bdf8',
    carril: 'FOH_ANFITRIONAJE',
    activo: true,
    tiempoEstimadoMin: 3,
    perfilResponsable: 'Recepción / Kiosko Táctil',
    requiereHardware: ['Tótem Touch', 'Impresora Térmica QR'],
    orden: 1
  },
  {
    id: 'pipe-2',
    etapa: 'ASESORIA',
    nombre: 'Diagnóstico & Proforma',
    subtitulo: 'Pacto de servicio, evaluación capilar y cotización in-situ con el cliente.',
    icono: 'Sparkles',
    color: '#c084fc',
    carril: 'STAFF_TECNICO',
    activo: true,
    tiempoEstimadoMin: 10,
    perfilResponsable: 'Especialista en Sillón',
    requiereHardware: ['Móvil PWA Staff'],
    orden: 2
  },
  {
    id: 'pipe-3',
    etapa: 'LAB_DESPACHO',
    nombre: 'Despacho Químico BOH',
    subtitulo: 'Pesaje de tintes y peróxidos con balanza IoT de precisión (±2g).',
    icono: 'Beaker',
    color: '#fbbf24',
    carril: 'BOH_LABORATORIO',
    activo: true,
    tiempoEstimadoMin: 8,
    perfilResponsable: 'Químico / Encargado Lab',
    requiereHardware: ['Balanza Web Serial', 'Monitor ODI'],
    orden: 3
  },
  {
    id: 'pipe-4',
    etapa: 'SILLA_SERVICIO',
    nombre: 'Ejecución Técnica en Sillón',
    subtitulo: 'Aplicación química, cronómetro de exposición en pose y corte final.',
    icono: 'Scissors',
    color: '#a855f7',
    carril: 'STAFF_TECNICO',
    activo: true,
    tiempoEstimadoMin: 90,
    perfilResponsable: 'Especialista / Colorista',
    requiereHardware: ['Sillón Hidráulico', 'Cronómetro Químico'],
    orden: 4
  },
  {
    id: 'pipe-5',
    etapa: 'BAR_LOUNGE',
    nombre: 'Cortesía Bar & Cafetería',
    subtitulo: 'Café expreso, infusiones y bebidas preparadas para el cliente en silla.',
    icono: 'Coffee',
    color: '#f59e0b',
    carril: 'FOH_ANFITRIONAJE',
    activo: true,
    tiempoEstimadoMin: 5,
    perfilResponsable: 'Barman / Mozo Lounge',
    requiereHardware: ['Comanda Bar Realtime'],
    orden: 5
  },
  {
    id: 'pipe-6',
    etapa: 'CAJA_POS',
    nombre: 'Liquidación & Cobro POS',
    subtitulo: 'Emisión de boleta/factura SUNAT, acumulación LuminaCoins y arqueo.',
    icono: 'DollarSign',
    color: '#34d399',
    carril: 'CAJA_ADMIN',
    activo: true,
    tiempoEstimadoMin: 4,
    perfilResponsable: 'Cajero / Administrador',
    requiereHardware: ['Terminal Izipay/Niubiz', 'Impresora Fiscal 80mm'],
    orden: 6
  }
];

// Bienes demostrativos para el Árbol de Recetas (Obsidian Canvas)
const BIENES_INICIALES: NodoBienCanvasData[] = [
  {
    id: 'bien-serv-1',
    nombre: 'Balayage Signature + Plex',
    tipo_bien: 'servicio',
    categoria: 'Coloración',
    linea: 'Mechas Creativas',
    precio_venta: 280,
    costo_base: 0,
    comision_porcentaje: 40,
    margen_bruto_porcentaje: 48,
    receta_insumos: [
      { insumo_id: 'ins-1', nombre: 'Decolorante Blond Studio 9', cantidad_gramos: 50, costo_gramo: 0.35 },
      { insumo_id: 'ins-2', nombre: 'Oxidante 20 Vol (Galón)', cantidad_gramos: 75, costo_gramo: 0.08 }
    ],
    duracion_minutos: 180,
    color: '#c084fc'
  },
  {
    id: 'bien-serv-2',
    nombre: 'Coloración Global & Matiz',
    tipo_bien: 'servicio',
    categoria: 'Coloración',
    linea: 'Tinturas',
    precio_venta: 140,
    costo_base: 0,
    comision_porcentaje: 40,
    margen_bruto_porcentaje: 52,
    receta_insumos: [
      { insumo_id: 'ins-3', nombre: 'Tinte Majirel 6.1 (Tubo 60g)', cantidad_gramos: 60, costo_gramo: 0.27 }
    ],
    duracion_minutos: 90,
    color: '#c084fc'
  },
  {
    id: 'bien-serv-3',
    nombre: 'Corte Master & Styling',
    tipo_bien: 'servicio',
    categoria: 'Estilismo',
    linea: 'Cortes de Autor',
    precio_venta: 65,
    costo_base: 0,
    comision_porcentaje: 45,
    margen_bruto_porcentaje: 55,
    receta_insumos: [],
    duracion_minutos: 45,
    color: '#a855f7'
  },
  {
    id: 'ins-1',
    nombre: 'Decolorante Blond Studio 9',
    tipo_bien: 'insumo',
    categoria: 'Insumos de Laboratorio',
    precio_venta: 0,
    costo_base: 175,
    comision_porcentaje: 0,
    margen_bruto_porcentaje: 0,
    receta_insumos: [],
    tara_gramos: 45,
    peso_neto_gramos: 500,
    color: '#fbbf24'
  },
  {
    id: 'ins-2',
    nombre: 'Oxidante 20 Vol (Galón)',
    tipo_bien: 'insumo',
    categoria: 'Insumos de Laboratorio',
    precio_venta: 0,
    costo_base: 80,
    comision_porcentaje: 0,
    margen_bruto_porcentaje: 0,
    receta_insumos: [],
    tara_gramos: 110,
    peso_neto_gramos: 1000,
    color: '#fbbf24'
  },
  {
    id: 'ins-3',
    nombre: 'Tinte Majirel 6.1 (Tubo 60g)',
    tipo_bien: 'insumo',
    categoria: 'Insumos de Laboratorio',
    precio_venta: 0,
    costo_base: 16,
    comision_porcentaje: 0,
    margen_bruto_porcentaje: 0,
    receta_insumos: [],
    tara_gramos: 12,
    peso_neto_gramos: 60,
    color: '#fbbf24'
  },
  {
    id: 'prod-1',
    nombre: 'Keratina Thermique Discipline 150ml',
    tipo_bien: 'producto',
    categoria: 'Retail',
    linea: 'Discipline',
    precio_venta: 165,
    costo_base: 103.84,
    comision_porcentaje: 10,
    margen_bruto_porcentaje: 27,
    receta_insumos: [],
    color: '#38bdf8'
  },
  {
    id: 'prod-2',
    nombre: 'Serum Genesis 90ml',
    tipo_bien: 'producto',
    categoria: 'Retail',
    linea: 'Genesis',
    precio_venta: 195,
    costo_base: 123.90,
    comision_porcentaje: 10,
    margen_bruto_porcentaje: 26,
    receta_insumos: [],
    color: '#38bdf8'
  }
];

export function VisualStudioCanvas() {
  const [modo, setModo] = useState<CanvasModo>('PIPELINE_BIZAGI');
  const [pipeline, setPipeline] = useState<NodoPipelineData[]>(PIPELINE_INICIAL);
  const [bienes, setBienes] = useState<NodoBienCanvasData[]>(BIENES_INICIALES);
  const [nodoSeleccionadoId, setNodoSeleccionadoId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Gamificación / Misiones Didácticas
  const [misiones, setMisiones] = useState<MisionDidactica[]>([
    {
      id: 'm1',
      titulo: 'Optimizar el Pipeline de Salón',
      objetivo: 'Configura las etapas activas del salón',
      descripcion: 'Verifica que el Check-in, Laboratorio y Caja POS se encuentren en estado Activo.',
      completada: true,
      xp: 150,
      requisitoValidacion: () => true
    },
    {
      id: 'm2',
      titulo: 'Erradicar Precios con Margen Negativo',
      objetivo: 'Sube el precio de venta de productos retail para que el margen sea > 25%',
      descripcion: 'Edita el precio de venta de Keratina Thermique o Serum Genesis.',
      completada: true,
      xp: 250,
      requisitoValidacion: () => true
    },
    {
      id: 'm3',
      titulo: 'Vincular Fórmula Química en Laboratorio',
      objetivo: 'Asigna al menos un insumo pesado con gramaje a un servicio de coloración.',
      descripcion: 'Asegura que Balayage o Coloración cuente con tara de tubo de tinte u oxidante.',
      completada: true,
      xp: 300,
      requisitoValidacion: () => true
    }
  ]);

  const toggleActivoPipeline = (id: string) => {
    setPipeline(prev => prev.map(p => p.id === id ? { ...p, activo: !p.activo } : p));
  };

  const actualizarPrecioBien = (id: string, nuevoPrecio: number) => {
    setBienes(prev => prev.map(b => b.id === id ? { ...b, precio_venta: Math.max(0, nuevoPrecio) } : b));
  };

  const actualizarComisionBien = (id: string, nuevaComision: number) => {
    setBienes(prev => prev.map(b => b.id === id ? { ...b, comision_porcentaje: Math.max(0, nuevaComision) } : b));
  };

  const removerInsumoReceta = (bienId: string, insumoId: string) => {
    setBienes(prev => prev.map(b => {
      if (b.id !== bienId) return b;
      return {
        ...b,
        receta_insumos: b.receta_insumos.filter(i => i.insumo_id !== insumoId)
      };
    }));
  };

  // Filtrado de bienes
  const bienesFiltrados = useMemo(() => {
    if (!filtroTexto) return bienes;
    const q = filtroTexto.toLowerCase();
    return bienes.filter(b => b.nombre.toLowerCase().includes(q) || b.categoria.toLowerCase().includes(q));
  }, [bienes, filtroTexto]);

  const xpTotal = misiones.reduce((acc, m) => acc + (m.completada ? m.xp : 0), 0);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      
      {/* 🧭 BARRA SUPERIOR DE CONTROL & MODOS */}
      <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 backdrop-blur-xl shrink-0 z-20">
        
        {/* Selector de Modo (Bizagi vs Obsidian vs Archify) */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setModo('PIPELINE_BIZAGI')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              modo === 'PIPELINE_BIZAGI'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Pipeline Operativo (Bizagi BPMN)</span>
          </button>

          <button
            type="button"
            onClick={() => setModo('CATALOGO_OBSIDIAN')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              modo === 'CATALOGO_OBSIDIAN'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Árbol de Bienes & Recetas (Obsidian)</span>
          </button>

          <button
            type="button"
            onClick={() => setModo('HARDWARE_ARCHIFY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer ${
              modo === 'HARDWARE_ARCHIFY'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Hardware & Periféricos (Archify)</span>
          </button>
        </div>

        {/* Buscador y Controles de Zoom */}
        <div className="flex items-center gap-3">
          {modo === 'CATALOGO_OBSIDIAN' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar servicio o insumo..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-purple-500 w-48 font-medium"
              />
            </div>
          )}

          {/* Gamificación Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-black text-amber-300 font-mono">
              {xpTotal} XP
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
              Nivel Maestro ERP
            </span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoom(prev => Math.max(0.7, prev - 0.1))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Alejar"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold w-9 text-center text-slate-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              title="Acercar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 🎨 LIENZO INTERACTIVO (CANVAS AREA) */}
      <div className="flex-1 relative overflow-auto bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] p-8">
        
        {/* ========================================================================= */}
        {/* VISTA 1: PIPELINE OPERATIVO DE SALÓN (BIZAGI BPMN) */}
        {/* ========================================================================= */}
        {modo === 'PIPELINE_BIZAGI' && (
          <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="flex items-center gap-8 min-w-max py-12 transition-transform duration-150"
          >
            {pipeline.map((node, index) => (
              <React.Fragment key={node.id}>
                <NodePipelineOperativo
                  data={node}
                  seleccionado={nodoSeleccionadoId === node.id}
                  onSelect={() => setNodoSeleccionadoId(node.id)}
                  onToggleActivo={toggleActivoPipeline}
                />
                {index < pipeline.length - 1 && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                      <div className="absolute right-0 -top-1 w-2 h-2 border-t-2 border-r-2 border-purple-500 rotate-45" />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">Flujo</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: ÁRBOL DE BIENES, RECETAS & RENTABILIDAD (OBSIDIAN CANVAS) */}
        {/* ========================================================================= */}
        {modo === 'CATALOGO_OBSIDIAN' && (
          <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-w-max py-6 transition-transform duration-150"
          >
            {bienesFiltrados.map((bien) => (
              <NodeBienReceta
                key={bien.id}
                data={bien}
                seleccionado={nodoSeleccionadoId === bien.id}
                onSelect={() => setNodoSeleccionadoId(bien.id)}
                onActualizarPrecio={actualizarPrecioBien}
                onActualizarComision={actualizarComisionBien}
                onRemoverInsumoReceta={removerInsumoReceta}
              />
            ))}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 3: TOPOLOGÍA DE HARDWARE & PERIFÉRICOS (ARCHIFY) */}
        {/* ========================================================================= */}
        {modo === 'HARDWARE_ARCHIFY' && (
          <div 
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
            className="max-w-4xl mx-auto space-y-6 py-6 transition-transform duration-150"
          >
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                    ⚖️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Balanza IoT de Precisión (Laboratorio)</h3>
                    <p className="text-xs text-slate-400">Lectura continúa por Web Serial API con tolerancia de ±2g y tara automática.</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase">
                  Conectada
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center text-2xl">
                    🖨️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">Impresoras Térmicas ESC/POS (80mm)</h3>
                    <p className="text-xs text-slate-400">Recepción central (Comprobantes SUNAT) y Cocina/Bar (Comandas térmicas).</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black uppercase">
                  TCP :9100 Listo
                </span>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* 🏆 PANEL INFERIOR: MISIONES DIDÁCTICAS GAMIFICADAS */}
      <div className="h-16 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            🎯
          </div>
          <div>
            <h4 className="text-xs font-black text-white">Misiones de Arquitectura & Negocio</h4>
            <p className="text-[10px] text-slate-400">Aprende y gobierna el sistema interactivamente sin leer manuales.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {misiones.map((m) => (
            <div 
              key={m.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold text-slate-300 truncate max-w-[180px]" title={m.titulo}>
                {m.titulo}
              </span>
              <span className="text-[9px] font-mono text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded">
                +{m.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
