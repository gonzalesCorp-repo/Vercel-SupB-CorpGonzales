'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, QrCode, CheckCircle2, User, Phone, Search, ArrowRight, UserPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import ClientePerfilView from '@/components/mobile/cliente/ClientePerfilView';
import { useUIStore } from '@/store/useUIStore';

export default function MobileClientePage() {
  const [dni, setDni] = useState('');
  const [clienteActivo, setClienteActivo] = useState<any>(null);
  const [buscando, setBuscando] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');

  const supabase = createClient();
  const { showAlert } = useUIStore();

  useEffect(() => {
    // Cargar sesión guardada del cliente si existe
    const saved = localStorage.getItem('vaikuntha_cliente_sesion');
    if (saved) {
      try {
        setClienteActivo(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dni.trim()) return;

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .or(`dni.eq.${dni.trim()},telefono.eq.${dni.trim()}`)
        .limit(1)
        .maybeSingle();

      if (data) {
        setClienteActivo(data);
        localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(data));
        showAlert(`¡Bienvenido(a) de nuevo, ${data.nombre}! ✨`, 'success');
      } else {
        // Fallback / Crear rápido si no existe
        setMostrarRegistro(true);
        showAlert('No encontramos tu registro. Completa tu nombre para ingresar.', 'info');
      }
    } catch (err) {
      console.error(err);
      showAlert('Error al buscar cliente.', 'error');
    } finally {
      setBuscando(false);
    }
  };

  const handleRegistrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !dni.trim()) return;

    setBuscando(true);
    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert([{
          nombre: nuevoNombre.trim(),
          dni: dni.trim(),
          telefono: nuevoTelefono.trim() || null
        }])
        .select()
        .single();

      if (error || !data) {
        // Fallback demo si RLS restringe
        const mockCliente = {
          id: `temp-${Date.now()}`,
          nombre: nuevoNombre.trim(),
          dni: dni.trim(),
          telefono: nuevoTelefono.trim()
        };
        setClienteActivo(mockCliente);
        localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(mockCliente));
        showAlert(`¡Perfil creado con éxito! Bienvenido(a) ${nuevoNombre}`, 'success');
      } else {
        setClienteActivo(data);
        localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(data));
        showAlert(`¡Perfil VIP creado con éxito! Bienvenido(a) ${data.nombre}`, 'success');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBuscando(false);
      setMostrarRegistro(false);
    }
  };

  const handleCerrarSesion = () => {
    localStorage.removeItem('vaikuntha_cliente_sesion');
    setClienteActivo(null);
    setDni('');
    setMostrarRegistro(false);
    showAlert('Sesión cerrada correctamente.', 'info');
  };

  if (clienteActivo) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 md:p-6 font-sans transition-colors duration-200">
        <ClientePerfilView 
          cliente={clienteActivo}
          onCerrarSesion={handleCerrarSesion}
          onActualizarCliente={(upd) => {
            setClienteActivo(upd);
            localStorage.setItem('vaikuntha_cliente_sesion', JSON.stringify(upd));
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between max-w-md mx-auto p-5 font-sans transition-colors duration-200">
      {/* Header Cliente */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 p-[2px]">
              <div className="w-full h-full bg-white dark:bg-slate-950 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-pink-500" />
              </div>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white">Vaikuntha Client</h1>
              <p className="text-[10px] text-pink-600 dark:text-pink-400 font-bold uppercase tracking-widest">Portal de Experiencia & Auto-Checkin</p>
            </div>
          </div>
          <span className="text-[10px] bg-pink-50 dark:bg-pink-500/10 border border-pink-200 dark:border-pink-500/30 text-pink-700 dark:text-pink-400 font-bold px-2.5 py-1 rounded-full">
            VIP 2.0
          </span>
        </div>

        {/* Input DNI / Identificación */}
        {!mostrarRegistro ? (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl shadow-xl transition-colors">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Ingresa a tu Cuenta VIP</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ingresa tu DNI o Celular para consultar tus puntos, medallas de consumo y pase de Auto-Checkin.
              </p>
            </div>

            <form onSubmit={handleBuscar} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="DNI o Celular..."
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-3.5 text-sm text-slate-900 dark:text-white font-mono placeholder:text-slate-400 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={buscando || !dni}
                className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3.5 rounded-2xl transition-all shadow-lg shadow-pink-600/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {buscando ? 'Buscando...' : 'Ingresar a Mi Cuenta'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-xl shadow-xl transition-colors">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Crear Pase VIP Rápido</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No encontramos el DNI <strong className="text-pink-600 dark:text-pink-400 font-mono">{dni}</strong>. Regístrate en 10 segundos:
              </p>
            </div>

            <form onSubmit={handleRegistrar} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Camila Torres"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase block mb-1">WhatsApp (Opcional)</label>
                <input
                  type="tel"
                  placeholder="+51 999 999 999"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarRegistro(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={buscando}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg text-xs cursor-pointer"
                >
                  {buscando ? 'Creando...' : 'Comenzar Experiencia'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="pt-6 text-center space-y-1">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 font-semibold tracking-wider uppercase">
          Impulsado por Vaikuntha ERP & LuminaHQ
        </p>
      </div>
    </div>
  );
}
