'use client';

import { useState, useEffect, useRef } from 'react';
import { Lock, FileText, Users, Calendar, CreditCard, User, LogOut, Loader2, ChevronLeft } from 'lucide-react';
import { validarPin } from '@/services/operaciones';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useAppStore } from '@/store/useAppStore';

const supabase = createClient();

type Herramienta = 'historial' | 'clientes' | 'citas' | 'liquidaciones' | 'informacion' | null;

export default function RecursosPanel() {
  const [agenteAutenticado, setAgenteAutenticado] = useState<any | null>(null);
  const [herramientaActiva, setHerramientaActiva] = useState<Herramienta>(null);
  
  // PIN State
  const [pin, setPin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [pinError, setPinError] = useState(false);
  
  // Timeout State
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { showAlert } = useUIStore();
  const sedeActiva = useAppStore((state) => state.sedeActiva);

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      handleLogout('Por seguridad, tu sesión ha expirado por inactividad.');
    }, 60000); // 1 minuto
  };

  useEffect(() => {
    if (agenteAutenticado) {
      resetTimeout();
      
      // Listeners para inactividad
      const handleActivity = () => resetTimeout();
      window.addEventListener('mousemove', handleActivity);
      window.addEventListener('keypress', handleActivity);
      window.addEventListener('click', handleActivity);
      
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        window.removeEventListener('mousemove', handleActivity);
        window.removeEventListener('keypress', handleActivity);
        window.removeEventListener('click', handleActivity);
      };
    }
  }, [agenteAutenticado]);

  const handleVerificarPin = async () => {
    if (pin.length < 4) return;
    setIsVerifying(true);
    setPinError(false);
    
    try {
      // Para la validación necesitamos saber a qué agente pertenece el PIN.
      // Como estamos en un entorno compartido (Sede), el PIN por sí solo debería identificar al agente.
      // Buscar el agente por su PIN
      const { data: agente, error: errAgente } = await supabase
        .from('agentes')
        .select('*')
        .eq('pin', pin)
        .eq('rol', 'STAFF')
        .single();
        
      if (errAgente || !agente) {
        setPinError(true);
        setPin('');
        setIsVerifying(false);
        return;
      }
      
      // Validar que el agente pertenezca a la sede activa
      const { data: relacion, error: errRelacion } = await supabase
        .from('sedes_usuarios')
        .select('id')
        .eq('agente_id', agente.id)
        .eq('sede_id', sedeActiva?.id)
        .maybeSingle();

      if (errRelacion || !relacion) {
        setPinError(true);
        setPin('');
      } else {
        setAgenteAutenticado(agente);
        setPin('');
        showAlert(`Bienvenido/a, ${agente.nombre}`, 'success');
      }
    } catch (e) {
      setPinError(true);
    }
    setIsVerifying(false);
  };

  const handleLogout = (msg?: string) => {
    setAgenteAutenticado(null);
    setHerramientaActiva(null);
    if (msg) showAlert(msg, 'warning');
  };

  // Vistas Internas
  const renderHerramienta = () => {
    switch (herramientaActiva) {
      case 'historial':
        return <VistaHistorial agenteId={agenteAutenticado.id} sedeId={sedeActiva?.id || ''} />;
      case 'clientes':
        return <VistaPlaceholder titulo="Mis Clientes" icono={<Users className="w-12 h-12 text-slate-300" />} desc="Aquí podrás ver tu cartera de clientes y notas." />;
      case 'citas':
        return <VistaPlaceholder titulo="Mis Citas" icono={<Calendar className="w-12 h-12 text-slate-300" />} desc="Tu agenda de citas programadas aparecerá aquí." />;
      case 'liquidaciones':
        return <VistaPlaceholder titulo="Mis Liquidaciones" icono={<CreditCard className="w-12 h-12 text-slate-300" />} desc="Resumen de tus comisiones y pagos pendientes." />;
      case 'informacion':
        return <VistaPlaceholder titulo="Mi Información" icono={<User className="w-12 h-12 text-slate-300" />} desc="Detalles de tu perfil y métricas de desempeño." />;
      default:
        return null;
    }
  };

  if (!agenteAutenticado) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="bg-indigo-50 p-4 rounded-full mb-6">
          <Lock className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Portal de Empleados</h2>
        <p className="text-slate-500 mb-8 text-center max-w-sm">Ingresa tu PIN operativo para acceder a tus recursos personales de forma segura.</p>
        
        <div className="w-full max-w-xs">
          <input 
            type="password"
            maxLength={6}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/[^0-9]/g, ''));
              setPinError(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerificarPin()}
            placeholder="••••"
            className={`w-full text-center text-3xl tracking-[1em] p-4 rounded-xl border-2 outline-none transition-all ${
              pinError ? 'border-rose-500 bg-rose-50' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20'
            }`}
          />
          {pinError && <p className="text-rose-500 text-sm mt-2 text-center font-medium">PIN incorrecto o no pertenece a esta sede.</p>}
          
          <button 
            onClick={handleVerificarPin}
            disabled={pin.length < 4 || isVerifying}
            className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verificar Identidad'}
          </button>
        </div>
      </div>
    );
  }

  if (herramientaActiva) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-slate-100 px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setHerramientaActiva(null)}
              className="hover:bg-slate-800 p-2 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" /> Volver a Recursos
            </button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-indigo-300">Staff: {agenteAutenticado.nombre}</span>
            <button 
              onClick={() => handleLogout()}
              className="bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 p-2 rounded-lg transition-colors tooltip flex items-center gap-2 text-sm"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" /> Salir
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {renderHerramienta()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
      <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tus Recursos</h2>
          <p className="text-slate-500 mt-1">Selecciona una herramienta para continuar, {agenteAutenticado.nombre}.</p>
        </div>
        <button 
          onClick={() => handleLogout()}
          className="flex items-center gap-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <LogOut className="w-5 h-5" /> Cerrar Sesión
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ToolCard icon={<FileText className="w-8 h-8" />} title="Mi Historial" desc="Atenciones y servicios finalizados" onClick={() => setHerramientaActiva('historial')} />
        <ToolCard icon={<Users className="w-8 h-8" />} title="Mis Clientes" desc="Cartera y notas personales" onClick={() => setHerramientaActiva('clientes')} />
        <ToolCard icon={<Calendar className="w-8 h-8" />} title="Mis Citas" desc="Agenda y reservas próximas" onClick={() => setHerramientaActiva('citas')} />
        <ToolCard icon={<CreditCard className="w-8 h-8" />} title="Mis Liquidaciones" desc="Comisiones y pagos" onClick={() => setHerramientaActiva('liquidaciones')} />
        <ToolCard icon={<User className="w-8 h-8" />} title="Mi Información" desc="Perfil y configuraciones" onClick={() => setHerramientaActiva('informacion')} />
      </div>
      
      <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-sm text-slate-400">
        <Lock className="w-4 h-4" /> La sesión se cerrará automáticamente en 1 minuto de inactividad.
      </div>
    </div>
  );
}

function ToolCard({ icon, title, desc, onClick }: { icon: React.ReactNode, title: string, desc: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center text-center p-8 border border-slate-200 rounded-2xl hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50/30 transition-all group"
    >
      <div className="bg-slate-50 p-4 rounded-xl text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-indigo-700">{title}</h3>
      <p className="text-sm text-slate-500">{desc}</p>
    </button>
  );
}

function VistaPlaceholder({ titulo, icono, desc }: { titulo: string, icono: React.ReactNode, desc: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      {icono}
      <h3 className="text-xl font-bold text-slate-700 mt-4 mb-2">{titulo}</h3>
      <p className="text-slate-500 max-w-sm">{desc}</p>
      <div className="mt-8 bg-amber-50 text-amber-700 px-4 py-2 rounded-lg text-sm font-medium border border-amber-200">
        Módulo en construcción
      </div>
    </div>
  );
}

// Reutilizamos la lógica del historial pero encapsulada
function VistaHistorial({ agenteId, sedeId }: { agenteId: string, sedeId: string }) {
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      const { data } = await supabase.from('oatc').select('*')
        .eq('agente_id', agenteId)
        .in('estado_proceso', ['FINALIZADO', 'POR_COBRAR', 'PRE_COBRADO', 'CANCELADO'])
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) setHistorial(data);
      setLoading(false);
    };
    cargar();
  }, [agenteId]);

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-6">Tus Últimas Atenciones</h3>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : historial.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No hay atenciones en tu historial reciente.</div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Secuencia</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Servicio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historial.map((h, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-6 py-4">{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString()}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">#{h.secuencia}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">{h.estado_proceso}</span>
                  </td>
                  <td className="px-6 py-4">{h.servicio_nombre || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
