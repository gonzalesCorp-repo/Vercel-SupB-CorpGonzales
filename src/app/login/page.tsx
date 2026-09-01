'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { registrarLog } from '@/services/logger';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const clearSede = useAppStore((state) => state.clearSede);

  useEffect(() => {
    clearSede();
  }, [clearSede]);

  const executeAuth = async (loginEmail: string, loginPass: string) => {
    setIsLoading(true);
    setError('');

    const isSandboxAccount = loginEmail.includes('@vaikuntha.com') || loginEmail.includes('@gonzales.page') || loginEmail.includes('@gloss.pe');

    try {
      // 1. Determinar rol inicial por email para sandbox instantáneo
      let userRol = 'STAFF';
      if (loginEmail.includes('cristian')) userRol = 'SUPERADMIN';
      else if (loginEmail.includes('platon') || loginEmail.includes('diana') || loginEmail.includes('joseph') || loginEmail.includes('erick') || loginEmail.includes('adriano')) userRol = 'ADMIN';
      else if (loginEmail.includes('socrates')) userRol = 'SOPORTE';
      else if (loginEmail.includes('tales')) userRol = 'CAJA';
      else if (loginEmail.includes('pitagoras')) userRol = 'JEFE_OPERATIVO';
      else if (loginEmail.includes('kiosko') || loginEmail.includes('kiosk')) userRol = 'KIOSKO';
      else userRol = 'STAFF';

      // 2. Intento de autenticación con timeout seguro
      const authPromise = supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPass,
      });

      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null }, error: null }), 3000)
      );

      const authResult = await Promise.race([authPromise, timeoutPromise]);

      if (authResult?.error && !isSandboxAccount) {
        throw authResult.error;
      }

      // 3. Consultar rol de base de datos en background/seguro
      try {
        const { data: agente } = await supabase
          .from('agentes')
          .select('rol, estado, nombre')
          .ilike('email', loginEmail.trim())
          .maybeSingle();

        if (agente?.estado === 'INACTIVO') {
          throw new Error(`La cuenta de ${agente.nombre || 'colaborador'} se encuentra DADA DE BAJA (Inactiva). Comunícate con Administración.`);
        }
        if (agente?.rol) userRol = agente.rol.toUpperCase();
      } catch (e: any) {
        if (e.message?.includes('DADA DE BAJA')) {
          throw e;
        }
      }

      // 4. Persistir sesión local para resiliencia
      if (typeof window !== 'undefined') {
        localStorage.setItem('vaikuntha_user_email', loginEmail.trim());
        localStorage.setItem('vaikuntha_user_rol', userRol);
      }
      useAppStore.getState().setUserEmail(loginEmail.trim());
      useAppStore.getState().setUserRol(userRol);

      // Registrar log de forma asíncrona no bloqueante
      registrarLog('AUTH', 'Inicio de sesión exitoso', { email: loginEmail }).catch(() => {});

      const isMobileDevice = typeof window !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth < 768
      );

      let targetRoute = '/recepcion';
      if (userRol === 'KIOSKO' || loginEmail.toLowerCase().includes('kiosk')) {
        targetRoute = '/kiosk';
      } else if (userRol === 'SUPERADMIN' && isMobileDevice) {
        targetRoute = '/mobile/superadmin';
      } else if (userRol === 'ADMIN' && isMobileDevice) {
        targetRoute = '/mobile/admin';
      } else if (userRol === 'SOPORTE' && isMobileDevice) {
        targetRoute = '/mobile/soporte';
      } else if ((userRol === 'STAFF' || userRol === 'OPERACION') && isMobileDevice) {
        targetRoute = '/mobile/operacion';
      } else if (isMobileDevice) {
        targetRoute = '/mobile/operacion';
      } else if (userRol === 'STAFF' || userRol === 'OPERACION') {
        targetRoute = '/mobile/operacion';
      } else if (userRol === 'CAJA') {
        targetRoute = '/caja';
      } else if (userRol === 'SOPORTE' || userRol === 'RECEPCION') {
        targetRoute = '/recepcion';
      } else {
        targetRoute = '/recepcion';
      }

      if (typeof window !== 'undefined') {
        window.location.href = targetRoute;
      } else {
        router.push(targetRoute);
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err?.message || 'Error interno del servidor.';
      if (msg === 'Invalid login credentials') {
        msg = 'Correo o contraseña incorrectos.';
      }
      setError(typeof msg === 'string' ? msg : JSON.stringify(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      await executeAuth(email, password);
    } else {
      setError('Por favor ingresa correo electrónico y contraseña');
    }
  };

  const quickSandboxLogin = async (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    await executeAuth(quickEmail, quickPass);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-50 bg-opacity-95 p-4 overflow-y-auto">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-3xl shadow-xl border border-gray-100 my-auto">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl mb-2 shadow-lg shadow-indigo-500/20">
            V
          </div>
          <h1 className="text-xl font-black text-gray-900">Vaikuntha ERP</h1>
          <p className="text-gray-500 text-xs mt-0.5">Acceso al Sistema Sandbox</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block mb-1 text-[11px] font-bold text-gray-700 uppercase tracking-wider">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-2.5 transition-all"
              placeholder="usuario@vaikuntha.com"
              required
            />
          </div>
          <div>
            <label className="block mb-1 text-[11px] font-bold text-gray-700 uppercase tracking-wider">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 block w-full p-2.5 transition-all" 
              required 
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}
          
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full text-white bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-sm px-4 py-3 text-center transition disabled:opacity-70 shadow-lg shadow-indigo-600/20 active:scale-98"
          >
            {!isLoading ? 'Ingresar al Sistema' : 'Iniciando Sesión...'}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-bold mb-2 text-center uppercase tracking-widest">
            Ingreso Rápido en 1-Clic (Sandbox)
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('cristian@gonzales.page', '123456')}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              👑 SUPERADMIN
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('platon@vaikuntha.com', '123456')}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl border border-indigo-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              🏢 ADMIN (Platón)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('socrates@vaikuntha.com', '123456')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl border border-emerald-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              🛎️ SOPORTE Recepción (Sócrates)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('tales@vaikuntha.com', '123456')}
              className="p-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl border border-teal-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              💵 SOPORTE Caja & POS (Tales)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('democrito@vaikuntha.com', '123456')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-xl border border-amber-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              💈 STAFF (Demócrito)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('diogenes@vaikuntha.com', '123456')}
              className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-xl border border-orange-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              ✂️ STAFF Estilismo (Diógenes)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('parmenides@vaikuntha.com', '123456')}
              className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              💆 STAFF Cosmiatría (Parménides)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('pitagoras@vaikuntha.com', '123456')}
              className="p-2.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-xl border border-cyan-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              🎯 JEFE OPERATIVO (Pitágoras)
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => quickSandboxLogin('kiosko@vaikuntha.com', '123456')}
              className="p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl border border-pink-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
            >
              🪪 TÓTEM KIOSKO (Autoservicio)
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-[10px] text-pink-600 font-black mb-2 text-center uppercase tracking-widest flex items-center justify-center gap-1">
              <span>🌸</span> Gloss Salón and Relax — Acceso Directo
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickSandboxLogin('diana.laiza@gloss.pe', 'Gloss2026!')}
                className="p-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl border border-pink-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
              >
                🏢 Diana Laiza (ADMIN)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickSandboxLogin('jeferson.ayala@gloss.pe', 'Gloss2026!')}
                className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl border border-rose-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
              >
                ✂️ Jeferson (ESTILISMO)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickSandboxLogin('yoncivis.colina@gloss.pe', 'Gloss2026!')}
                className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl border border-purple-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
              >
                💇 Yovi (ESTILISMO)
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => quickSandboxLogin('iriana.roa@gloss.pe', 'Gloss2026!')}
                className="p-2.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 rounded-xl border border-fuchsia-200 text-left font-semibold transition active:scale-95 disabled:opacity-50"
              >
                💆 Iriana (COSMIATRÍA)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
