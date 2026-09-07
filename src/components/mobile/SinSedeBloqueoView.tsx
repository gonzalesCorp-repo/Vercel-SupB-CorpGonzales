'use client';

import React, { useState } from 'react';
import { ShieldAlert, RefreshCw, MessageSquare, Mail, LogOut, Building2, Phone } from 'lucide-react';

interface SinSedeBloqueoViewProps {
  colaboradorNombre: string;
  colaboradorEmail: string;
  onReintentar: () => Promise<void> | void;
  onLogout: () => Promise<void> | void;
}

export function SinSedeBloqueoView({
  colaboradorNombre,
  colaboradorEmail,
  onReintentar,
  onLogout
}: SinSedeBloqueoViewProps) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    try {
      await onReintentar();
    } finally {
      setIsVerifying(false);
    }
  };

  const mensajeWhatsApp = `Hola Diana, soy ${colaboradorNombre || 'colaborador'}. Acabo de ingresar a la app Staff y necesito que me asignes mi sede de trabajo en el sistema para poder iniciar turno.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensajeWhatsApp)}`;
  const mailtoUrl = `mailto:diana.laiza@gloss.pe?subject=${encodeURIComponent('Asignación de Sede Staff - ' + colaboradorNombre)}&body=${encodeURIComponent(mensajeWhatsApp)}`;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 relative overflow-hidden">
      {/* Fondo estético con sutiles esferas de brillo */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera con Icono de Seguridad */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <span className="inline-block text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
            Acceso Pendiente de Sede
          </span>
          <h2 className="text-xl font-black tracking-tight text-white">
            Sin Sede Asignada
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
            Hola <strong className="text-slate-200">{colaboradorNombre || 'Colaborador'}</strong>, tu cuenta está activa pero aún no tienes una sede de salón vinculada en el sistema. Comunícate con Administración para activar tu estación.
          </p>
        </div>

        {/* Tarjeta de Contacto Directo: Diana Laiza */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-md shrink-0">
              DL
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-black text-white truncate">
                Diana Laiza
              </h4>
              <p className="text-[11px] text-indigo-400 font-bold truncate">
                Administradora de Operaciones
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Gloss Salón and Relax (Sede Central)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition active:scale-95"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={mailtoUrl}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs rounded-xl transition active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Enviar Correo</span>
            </a>
          </div>
        </div>

        {/* Botón de Reintentar Verificación */}
        <div className="space-y-2 pt-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isVerifying}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
            <span>{isVerifying ? 'Comprobando Asignación...' : 'Ya me Asignaron, Reintentar'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="w-full py-2.5 text-slate-500 hover:text-slate-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>

      </div>
    </div>
  );
}
