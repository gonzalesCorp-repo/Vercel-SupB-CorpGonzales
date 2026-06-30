'use client';

import { useState, useEffect } from 'react';
import { Wallet, LogIn, LogOut, CheckCircle, Clock, AlertTriangle, PlusCircle, MinusCircle, Calculator, Info } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

const supabase = createClient();

interface CajaSesion {
  id: string;
  sede_id: string;
  cajero_id: string;
  fondo_inicial: number;
  fecha_apertura: string;
  estado: string;
}

interface Movimiento {
  id: string;
  tipo: 'INGRESO' | 'EGRESO' | 'ADELANTO';
  monto: number;
  descripcion: string;
  created_at: string;
}

export default function ArqueoPage() {
  const [session, setSession] = useState<CajaSesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fondoInicial, setFondoInicial] = useState('0');
  
  const [resumenPagos, setResumenPagos] = useState<any>({});
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [cajeroId, setCajeroId] = useState<string | null>(null);
  
  // Conteo de Efectivo
  const [tipoCambio, setTipoCambio] = useState('3.80');
  const [soles, setSoles] = useState({ s200: 0, s100: 0, s50: 0, s20: 0, s10: 0, s5: 0, s2: 0, s1: 0, s05: 0, s02: 0, s01: 0 });
  const [dolares, setDolares] = useState({ d100: 0, d50: 0, d20: 0, d10: 0, d5: 0, d2: 0, d1: 0 });
  const [monedaActiva, setMonedaActiva] = useState<'soles'|'dolares'>('soles');

  // Modal Movimientos
  const [showMovModal, setShowMovModal] = useState(false);
  const [movTipo, setMovTipo] = useState<'INGRESO'|'EGRESO'|'ADELANTO'>('INGRESO');
  const [movMonto, setMovMonto] = useState('');
  const [movDesc, setMovDesc] = useState('');
  const [isSavingMov, setIsSavingMov] = useState(false);

  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  const loadSession = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: agente } = await supabase.from('agentes').select('id').eq('email', user.email).single();
    if (!agente) { setIsLoading(false); return; }
    setCajeroId(agente.id);

    // Fix 406: Use maybeSingle instead of single
    const { data: openSession } = await supabase
      .from('caja_sesiones')
      .select('*')
      .eq('cajero_id', agente.id)
      .eq('estado', 'ABIERTA')
      .maybeSingle();

    if (openSession) {
      setSession(openSession);
      calcularResumen(openSession.id);
    } else {
      setSession(null);
    }
    setIsLoading(false);
  };

  const calcularResumen = async (sesionId: string) => {
    // Pagos del POS
    const { data: pagos } = await supabase.from('pagos').select('*').eq('caja_sesion_id', sesionId);
    if (pagos) {
      const resumen = pagos.reduce((acc: any, curr: any) => {
        acc[curr.metodo_pago] = (acc[curr.metodo_pago] || 0) + Number(curr.monto);
        return acc;
      }, {});
      setResumenPagos(resumen);
    }

    // Movimientos manuales
    const { data: movs } = await supabase.from('caja_movimientos').select('*').eq('caja_sesion_id', sesionId).order('created_at', { ascending: false });
    if (movs) setMovimientos(movs);
  };

  useEffect(() => {
    if (sedeActiva) {
      loadSession();
    }
  }, [sedeActiva]);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sedeActiva || !cajeroId) return;

    const { data, error } = await supabase.from('caja_sesiones').insert({
      sede_id: sedeActiva.id,
      cajero_id: cajeroId,
      fondo_inicial: Number(fondoInicial)
    }).select().single();

    if (error) {
      showAlert('Error al abrir caja', 'error');
    } else {
      showAlert('Caja abierta correctamente', 'success');
      setSession(data);
      setResumenPagos({});
    }
  };

  const guardarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !movMonto || !movDesc) return;
    
    setIsSavingMov(true);
    const { error } = await supabase.from('caja_movimientos').insert({
      caja_sesion_id: session.id,
      tipo: movTipo,
      monto: Number(movMonto),
      descripcion: movDesc
    });

    setIsSavingMov(false);
    if (!error) {
      setShowMovModal(false);
      setMovMonto('');
      setMovDesc('');
      showAlert('Movimiento registrado', 'success');
      calcularResumen(session.id);
    } else {
      showAlert('Error guardando movimiento', 'error');
    }
  };

  // Cálculos de Conteo
  const totalSolesFisico = (soles.s200 * 200) + (soles.s100 * 100) + (soles.s50 * 50) + (soles.s20 * 20) + (soles.s10 * 10) + (soles.s5 * 5) + (soles.s2 * 2) + (soles.s1 * 1) + (soles.s05 * 0.5) + (soles.s02 * 0.2) + (soles.s01 * 0.1);
  const totalDolaresFisico = (dolares.d100 * 100) + (dolares.d50 * 50) + (dolares.d20 * 20) + (dolares.d10 * 10) + (dolares.d5 * 5) + (dolares.d2 * 2) + (dolares.d1 * 1);
  const efectivoFisicoTotal = totalSolesFisico + (totalDolaresFisico * Number(tipoCambio));

  // Cálculos de Sistema
  const ventasEfectivo = resumenPagos['Efectivo'] || 0;
  const ingresosManuales = movimientos.filter(m => m.tipo === 'INGRESO').reduce((sum, m) => sum + Number(m.monto), 0);
  const egresosManuales = movimientos.filter(m => m.tipo === 'EGRESO' || m.tipo === 'ADELANTO').reduce((sum, m) => sum + Number(m.monto), 0);
  
  const totalSistemaEfectivo = session ? Number(session.fondo_inicial) + ventasEfectivo + ingresosManuales - egresosManuales : 0;
  const descuadreProyectado = efectivoFisicoTotal - totalSistemaEfectivo;

  const handleCerrarCaja = async () => {
    if (!session) return;
    if (!confirm('¿Estás seguro de cerrar el turno de caja actual?')) return;

    const { error } = await supabase.from('caja_sesiones').update({
      efectivo_sistema: totalSistemaEfectivo,
      efectivo_real: efectivoFisicoTotal,
      descuadre: descuadreProyectado,
      estado: 'CERRADA',
      fecha_cierre: new Date().toISOString()
    }).eq('id', session.id);

    if (error) {
      showAlert('Error al cerrar caja', 'error');
    } else {
      showAlert(`Caja cerrada. Descuadre: S/ ${descuadreProyectado.toFixed(2)}`, Math.abs(descuadreProyectado) < 0.1 ? 'success' : 'warning');
      setSession(null);
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500 font-medium">Cargando estado de caja...</div>;

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Wallet className="w-8 h-8 text-emerald-600 bg-emerald-100 rounded-lg p-1" />
          Arqueo de Caja
        </h1>
        <p className="text-slate-500 mt-2">Apertura, monitoreo en tiempo real y cierre de tu turno.</p>
      </div>

      {!session ? (
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center mt-12">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogOut className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Tu caja está cerrada</h2>
          <p className="text-sm text-slate-500 mb-8">Debes abrir caja para poder cobrar órdenes en el POS.</p>

          <form onSubmit={handleAbrirCaja}>
            <div className="text-left mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fondo Inicial (Sencillo)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">S/</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fondoInicial}
                  onChange={(e) => setFondoInicial(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" /> Abrir Caja
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header Dashboard Activo */}
          <div className="bg-emerald-600 rounded-xl shadow-lg p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="bg-emerald-500/50 text-emerald-50 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 w-max mb-3">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> SESIÓN ABIERTA
              </span>
              <h2 className="text-2xl font-bold">Turno Activo</h2>
              <p className="text-emerald-100 text-sm mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Abierto a las {new Date(session.fecha_apertura).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-emerald-200 text-sm font-bold uppercase tracking-wider">Fondo Inicial</p>
              <p className="text-4xl font-black">S/ {Number(session.fondo_inicial).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Columna Izquierda: Resumen y Movimientos */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Resumen del Día */}
              <div className="bg-white rounded-xl border-l-4 border-l-indigo-600 border-y border-r border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center justify-center gap-2 text-center border-b border-slate-100 pb-4">
                  <CheckCircle className="w-5 h-5 text-indigo-500" /> RESUMEN DEL DÍA
                </h3>
                
                <div className="space-y-4 text-sm font-medium">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Fondo Inicial:</span>
                    <span>S/ {Number(session.fondo_inicial).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-emerald-700">
                    <span>(+) Ventas Efectivo:</span>
                    <span>S/ {ventasEfectivo.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-indigo-600">
                    <span>(+) Ingresos Extra:</span>
                    <span>S/ {ingresosManuales.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-rose-600">
                    <span>(-) Gastos y Adelantos:</span>
                    <span>S/ {egresosManuales.toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t-2 border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-800 uppercase">Total Esperado</span>
                  <span className="text-2xl font-black text-slate-800">S/ {totalSistemaEfectivo.toFixed(2)}</span>
                </div>
              </div>

              {/* Movimientos Manuales */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider text-center">Movimientos Manuales</h3>
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button onClick={() => { setMovTipo('INGRESO'); setShowMovModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors">
                    <PlusCircle className="w-5 h-5" /> <span className="text-xs font-bold">Ingreso</span>
                  </button>
                  <button onClick={() => { setMovTipo('ADELANTO'); setShowMovModal(true); }} className="bg-cyan-500 hover:bg-cyan-600 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors">
                    <Wallet className="w-5 h-5" /> <span className="text-xs font-bold">Adelanto</span>
                  </button>
                  <button onClick={() => { setMovTipo('EGRESO'); setShowMovModal(true); }} className="bg-rose-600 hover:bg-rose-700 text-white p-3 rounded-lg flex flex-col items-center justify-center gap-1 transition-colors">
                    <MinusCircle className="w-5 h-5" /> <span className="text-xs font-bold">Egreso</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 text-sm">
                  {movimientos.length === 0 ? (
                    <div className="text-center text-slate-400 py-4 italic flex items-center justify-center gap-2">
                      <Info className="w-4 h-4" /> No hay movimientos manuales registrados
                    </div>
                  ) : (
                    movimientos.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div>
                          <p className={`font-bold text-xs ${m.tipo === 'INGRESO' ? 'text-emerald-600' : 'text-rose-600'}`}>{m.tipo}</p>
                          <p className="text-slate-600 truncate max-w-[150px]">{m.descripcion}</p>
                        </div>
                        <span className="font-black text-slate-800">
                          {m.tipo === 'INGRESO' ? '+' : '-'}S/ {Number(m.monto).toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Columna Derecha: Conteo de Efectivo */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              
              <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center text-center flex-col md:flex-row gap-4">
                <div className="w-full text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Diferencia de Arqueo</p>
                  <p className={`text-5xl font-black ${Math.abs(descuadreProyectado) < 0.1 ? 'text-emerald-600' : (descuadreProyectado > 0 ? 'text-indigo-600' : 'text-rose-600')}`}>
                    {descuadreProyectado > 0.05 ? '+' : ''}{descuadreProyectado.toFixed(2)}
                  </p>
                  <div className="flex justify-center gap-6 mt-3 text-sm font-bold text-slate-600">
                    <p>Físico: <span className="text-slate-800">{efectivoFisicoTotal.toFixed(2)}</span></p>
                    <p>Esperado: <span className="text-slate-800">{totalSistemaEfectivo.toFixed(2)}</span></p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-slate-500" /> Conteo de Efectivo
                </h3>
                
                <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <label className="text-sm font-bold text-slate-600 whitespace-nowrap">Tipo de Cambio (Venta)</label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">S/</span>
                    <input type="number" step="0.01" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)} className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded outline-none font-bold text-slate-800 text-right" />
                  </div>
                </div>

                <div className="flex mb-4">
                  <button onClick={() => setMonedaActiva('soles')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${monedaActiva === 'soles' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    Soles (S/)
                  </button>
                  <button onClick={() => setMonedaActiva('dolares')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${monedaActiva === 'dolares' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:bg-slate-50'}`}>
                    Dólares ($)
                  </button>
                </div>

                {/* Calculadora Soles */}
                <div className={`space-y-3 overflow-y-auto pr-2 pb-6 flex-1 ${monedaActiva === 'soles' ? 'block' : 'hidden'}`}>
                  {[
                    { label: 'S/ 200', key: 's200', val: 200 },
                    { label: 'S/ 100', key: 's100', val: 100 },
                    { label: 'S/ 50', key: 's50', val: 50 },
                    { label: 'S/ 20', key: 's20', val: 20 },
                    { label: 'S/ 10', key: 's10', val: 10 },
                    { label: 'S/ 5', key: 's5', val: 5 },
                    { label: 'S/ 2', key: 's2', val: 2 },
                    { label: 'S/ 1', key: 's1', val: 1 },
                    { label: '50 Cts', key: 's05', val: 0.5 },
                    { label: '20 Cts', key: 's02', val: 0.2 },
                    { label: '10 Cts', key: 's01', val: 0.1 },
                  ].map(bill => (
                    <div key={bill.key} className="flex justify-between items-center gap-4">
                      <span className="font-bold text-slate-800 w-16">{bill.label}</span>
                      <input 
                        type="number" min="0" 
                        value={(soles as any)[bill.key] || ''} 
                        onChange={e => setSoles({...soles, [bill.key]: parseInt(e.target.value) || 0})}
                        className="w-24 text-center py-2 border border-slate-300 rounded font-medium outline-none focus:border-indigo-500" 
                        placeholder="0"
                      />
                      <span className="text-slate-500 font-medium w-24 text-right">
                        S/ {(((soles as any)[bill.key] || 0) * bill.val).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Calculadora Dolares */}
                <div className={`space-y-3 overflow-y-auto pr-2 pb-6 flex-1 ${monedaActiva === 'dolares' ? 'block' : 'hidden'}`}>
                  {[
                    { label: '$ 100', key: 'd100', val: 100 },
                    { label: '$ 50', key: 'd50', val: 50 },
                    { label: '$ 20', key: 'd20', val: 20 },
                    { label: '$ 10', key: 'd10', val: 10 },
                    { label: '$ 5', key: 'd5', val: 5 },
                    { label: '$ 2', key: 'd2', val: 2 },
                    { label: '$ 1', key: 'd1', val: 1 },
                  ].map(bill => (
                    <div key={bill.key} className="flex justify-between items-center gap-4">
                      <span className="font-bold text-slate-800 w-16">{bill.label}</span>
                      <input 
                        type="number" min="0" 
                        value={(dolares as any)[bill.key] || ''} 
                        onChange={e => setDolares({...dolares, [bill.key]: parseInt(e.target.value) || 0})}
                        className="w-24 text-center py-2 border border-slate-300 rounded font-medium outline-none focus:border-indigo-500" 
                        placeholder="0"
                      />
                      <span className="text-slate-500 font-medium w-24 text-right">
                        $ {(((dolares as any)[bill.key] || 0) * bill.val).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200 mt-auto">
                   <button onClick={handleCerrarCaja} className="w-full bg-rose-600 text-white font-bold py-4 rounded-xl hover:bg-rose-700 transition-colors shadow-sm text-lg flex items-center justify-center gap-2">
                     <LogOut className="w-5 h-5" /> Declarar Cierre de Caja
                   </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Modal Movimiento Manual */}
      {showMovModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`p-6 text-white ${movTipo === 'INGRESO' ? 'bg-emerald-600' : (movTipo === 'ADELANTO' ? 'bg-cyan-500' : 'bg-rose-600')}`}>
              <h3 className="text-xl font-bold flex items-center gap-2">
                {movTipo === 'INGRESO' ? <PlusCircle/> : (movTipo === 'ADELANTO' ? <Wallet/> : <MinusCircle/>)}
                Registrar {movTipo.toLowerCase()}
              </h3>
            </div>
            <form onSubmit={guardarMovimiento} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Monto (S/)</label>
                <input type="number" step="0.01" required value={movMonto} onChange={e => setMovMonto(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 outline-none font-bold focus:border-indigo-500" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Concepto / Descripción</label>
                <textarea required value={movDesc} onChange={e => setMovDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 outline-none focus:border-indigo-500 resize-none h-24" placeholder="Ej: Pago de pasajes..."></textarea>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowMovModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" disabled={isSavingMov} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
