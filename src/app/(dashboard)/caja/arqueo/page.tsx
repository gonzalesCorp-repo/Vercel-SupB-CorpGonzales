'use client';

import { useState, useEffect } from 'react';
import { Wallet, LogIn, LogOut, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
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
  efectivo_sistema?: number;
  efectivo_real?: number;
  descuadre?: number;
}

export default function ArqueoPage() {
  const [session, setSession] = useState<CajaSesion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fondoInicial, setFondoInicial] = useState('0');
  const [efectivoFisico, setEfectivoFisico] = useState('');
  const [resumenPagos, setResumenPagos] = useState<any>({});
  const [cajeroId, setCajeroId] = useState<string | null>(null);
  
  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  const loadSession = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data: agente } = await supabase.from('agentes').select('id').eq('email', user.email).single();
    if (!agente) { setIsLoading(false); return; }
    setCajeroId(agente.id);

    // Buscar sesión abierta
    const { data: openSession } = await supabase
      .from('caja_sesiones')
      .select('*')
      .eq('cajero_id', agente.id)
      .eq('estado', 'ABIERTA')
      .single();

    if (openSession) {
      setSession(openSession);
      calcularResumen(openSession.id);
    } else {
      setSession(null);
    }
    setIsLoading(false);
  };

  const calcularResumen = async (sesionId: string) => {
    const { data: pagos } = await supabase.from('pagos').select('*').eq('caja_sesion_id', sesionId);
    if (!pagos) return;

    const resumen = pagos.reduce((acc: any, curr: any) => {
      acc[curr.metodo_pago] = (acc[curr.metodo_pago] || 0) + Number(curr.monto);
      return acc;
    }, {});
    setResumenPagos(resumen);
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

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;

    const fisico = Number(efectivoFisico);
    const efectivoSistema = (resumenPagos['Efectivo'] || 0) + Number(session.fondo_inicial);
    const descuadre = fisico - efectivoSistema;

    const { error } = await supabase.from('caja_sesiones').update({
      efectivo_sistema: efectivoSistema,
      efectivo_real: fisico,
      descuadre: descuadre,
      estado: 'CERRADA',
      fecha_cierre: new Date().toISOString()
    }).eq('id', session.id);

    if (error) {
      showAlert('Error al cerrar caja', 'error');
    } else {
      showAlert(`Caja cerrada. Descuadre: $${descuadre.toFixed(2)}`, descuadre === 0 ? 'success' : 'warning');
      setSession(null);
      setEfectivoFisico('');
    }
  };

  if (isLoading) return <div className="p-8 text-slate-500 font-medium">Cargando estado de caja...</div>;

  const totalSistemaEfectivo = session ? (resumenPagos['Efectivo'] || 0) + Number(session.fondo_inicial) : 0;
  const descuadreProyectado = efectivoFisico ? Number(efectivoFisico) - totalSistemaEfectivo : 0;

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
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fondoInicial}
                  onChange={(e) => setFondoInicial(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
              <LogIn className="w-5 h-5" /> Abrir Caja
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Dashboard Activo */}
          <div className="bg-emerald-600 rounded-xl shadow-lg p-6 text-white mb-8 flex justify-between items-center">
            <div>
              <span className="bg-emerald-500/50 text-emerald-50 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 w-max mb-3">
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span> SESIÓN ABIERTA
              </span>
              <h2 className="text-2xl font-bold">Turno Activo</h2>
              <p className="text-emerald-100 text-sm mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Abierto a las {new Date(session.fecha_apertura).toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-emerald-200 text-sm font-bold uppercase tracking-wider">Fondo Inicial</p>
              <p className="text-4xl font-black">${Number(session.fondo_inicial).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Ingresos en tiempo real */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-indigo-500" /> Ingresos Registrados
              </h3>
              
              <div className="space-y-4">
                {Object.keys(resumenPagos).length === 0 ? (
                  <p className="text-sm text-slate-400 font-medium italic">No hay cobros registrados en este turno.</p>
                ) : (
                  Object.entries(resumenPagos).map(([metodo, monto]) => (
                    <div key={metodo} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-600">{metodo}</span>
                      <span className="font-black text-slate-800 text-lg">${Number(monto).toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-500 uppercase tracking-wider text-xs">Total Sistema (Efectivo)</span>
                <span className="text-2xl font-black text-indigo-600">${totalSistemaEfectivo.toFixed(2)}</span>
              </div>
              <p className="text-xs text-slate-400 mt-1 text-right">(Incluye fondo inicial)</p>
            </div>

            {/* Cierre de Caja */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-rose-500" /> Declarar Cierre
              </h3>
              
              <form onSubmit={handleCerrarCaja}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-600 mb-2">¿Cuánto Efectivo Físico hay en caja?</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={efectivoFisico}
                      onChange={(e) => setEfectivoFisico(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 text-2xl bg-slate-50 border border-slate-200 rounded-xl font-black text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
                    />
                  </div>
                </div>

                {efectivoFisico !== '' && (
                  <div className={`p-4 rounded-lg mb-6 border ${descuadreProyectado === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-bold flex items-center gap-2">
                        {descuadreProyectado === 0 ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                        {descuadreProyectado === 0 ? '¡Caja Cuadrada Exacta!' : (descuadreProyectado > 0 ? 'Sobrante detectado' : 'Faltante detectado')}
                      </span>
                      <span className="font-black text-xl">${Math.abs(descuadreProyectado).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl hover:bg-rose-600 transition-colors shadow-sm text-lg">
                  Confirmar Cierre de Caja
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
