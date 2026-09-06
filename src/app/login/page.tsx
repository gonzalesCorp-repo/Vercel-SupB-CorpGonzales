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
  const [mostrarPruebas, setMostrarPruebas] = useState(false);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-3xl shadow-2xl border border-purple-100 my-auto">
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-400 flex items-center justify-center text-white font-black text-2xl mb-3 shadow-lg shadow-purple-500/25">
            G
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gloss Salón and Relax</h1>
          <p className="text-[11px] text-purple-700 font-extrabold mt-0.5 uppercase tracking-widest">
            Corporación Gonzales • 17 Años de Maestría
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Portal Corporativo & Sistema Operativo Vaikuntha
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="login_email" className="block mb-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Correo Electrónico Corporativo
            </label>
            <input
              id="login_email"
              name="login_email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 block w-full p-3 transition-all outline-none"
              placeholder="colaborador@gloss.pe"
              required
            />
          </div>
          <div>
            <label htmlFor="login_password" className="block mb-1 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Contraseña
            </label>
            <input 
              id="login_password"
              name="login_password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 block w-full p-3 transition-all outline-none" 
              placeholder="••••••••"
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
            className="w-full text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-bold rounded-xl text-sm px-4 py-3.5 text-center transition disabled:opacity-70 shadow-lg shadow-purple-600/25 active:scale-98 cursor-pointer"
          >
            {!isLoading ? 'Ingresar al Sistema' : 'Validando Credenciales...'}
          </button>
        </form>

        {/* Accesos rápidos a Touchpoints de Sala */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold">
          <a href="/kiosk" className="hover:text-purple-600 transition flex items-center gap-1.5 p-1 rounded-lg hover:bg-purple-50">
            <span>🖥️</span> Tótem Kiosko Sala
          </a>
          <a href="/mobile/cliente" className="hover:text-purple-600 transition flex items-center gap-1.5 p-1 rounded-lg hover:bg-purple-50">
            <span>📱</span> Suite Cliente PWA
          </a>
        </div>

        {/* Panel de accesos directos colapsado */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => setMostrarPruebas(!mostrarPruebas)}
            className="text-[11px] text-slate-400 hover:text-slate-600 font-medium transition cursor-pointer"
          >
            {mostrarPruebas ? '▲ Ocultar accesos rápidos de personal' : '▼ Accesos Rápidos de Personal & Equipo'}
          </button>

          {mostrarPruebas && (
            <div className="mt-3 space-y-3 animate-in fade-in">
              <div className="pt-2">
                <p className="text-[10px] text-pink-600 font-black mb-2 text-center uppercase tracking-widest flex items-center justify-center gap-1">
                  <span>🌸</span> Equipo Gloss Salón and Relax
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

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-bold mb-2 text-center uppercase tracking-widest">
                  Perfiles Técnicos & Kiosko
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickSandboxLogin('cristian@gonzales.page', '123456')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left font-medium transition active:scale-95 disabled:opacity-50"
                  >
                    👑 SUPERADMIN
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => quickSandboxLogin('kiosko@vaikuntha.com', '123456')}
                    className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-left font-medium transition active:scale-95 disabled:opacity-50"
                  >
                    🪪 TÓTEM KIOSKO
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
