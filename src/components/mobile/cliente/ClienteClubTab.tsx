'use client';

import React, { useState } from 'react';
import { 
  Award, Sparkles, User, Phone, Mail, Edit3, 
  LogOut, Dna, ShieldCheck, CheckCircle2, ChevronRight, Gift, Share2, Copy, Check, HeartHandshake 
} from 'lucide-react';
import { LuminaHqPluginConfig } from '@/types/clienteLifestyle';
import { StitchHolographicVipCard } from './StitchHolographicVipCard';
import { MobileAccessibilityCard } from '@/components/mobile/MobileAccessibilityCard';
import { useUIStore } from '@/store/useUIStore';

interface ClienteClubTabProps {
  cliente: {
    id: string;
    nombre: string;
    dni?: string;
    celular?: string;
    email?: string;
    rango_vip?: string;
    puntos_lumina?: number;
  };
  insignias: any[];
  pluginLumina: LuminaHqPluginConfig;
  onTogglePluginLumina: () => void;
  onCerrarSesion: () => void;
  onActualizarDatosCliente: (nuevosDatos: { celular?: string; email?: string }) => Promise<void>;
}

export function ClienteClubTab({
  cliente,
  insignias,
  pluginLumina,
  onTogglePluginLumina,
  onCerrarSesion,
  onActualizarDatosCliente
}: ClienteClubTabProps) {
  const { showAlert } = useUIStore();
  const [editando, setEditando] = useState(false);
  const [celular, setCelular] = useState(cliente.celular || '');
  const [email, setEmail] = useState(cliente.email || '');
  const [guardando, setGuardando] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState(false);

  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onActualizarDatosCliente({ celular, email });
      showAlert('Datos personales actualizados correctamente.', 'success');
      setEditando(false);
    } catch (err: any) {
      showAlert('Error al actualizar datos: ' + err.message, 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      
      {/* 1. Tarjeta VIP Holográfica Stitch */}
      <StitchHolographicVipCard cliente={cliente} />

      {/* 2. Control de Conmutación Marca Blanca vs + LuminaHQ */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dna className="w-4 h-4 text-purple-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Plug-in Biotecnológico LuminaHQ
            </h3>
          </div>
          <span className="text-[10px] font-mono text-purple-500 font-bold">
            {pluginLumina.activo ? 'ACTIVADO' : 'DESACTIVADO'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Alterna fluidamente entre la experiencia neutral de <strong>Marca Blanca (Vaikuntha Core)</strong> y la capa enriquecida <strong>+ LuminaHQ</strong> con diagnóstico capilar biométrico y Copiloto AI.
        </p>

        <button
          type="button"
          onClick={onTogglePluginLumina}
          className={`w-full h-11 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition cursor-pointer active:scale-95 border ${
            pluginLumina.activo
              ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-600 shadow-md shadow-purple-600/20'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
          }`}
        >
          {pluginLumina.activo ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Desactivar Plug-in (Volver a Marca Blanca)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Activar Plug-in + LuminaHQ Biocare</span>
            </>
          )}
        </button>
      </div>

      {/* 2.5 Programa de Referidos: Invita a una Amiga al Santuario (Growth Loop) */}
      <div className="bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-amber-500/10 border border-pink-500/30 dark:border-pink-500/20 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-pink-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Invita a una Amiga al Santuario
            </h3>
          </div>
          <span className="text-[10px] font-bold text-pink-600 dark:text-pink-400 bg-pink-500/15 px-2.5 py-0.5 rounded-full border border-pink-500/20">
            +150 LuminaCoins
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Comparte la experiencia boutique de <strong>Gloss Salón and Relax</strong>. Tu amiga recibe <strong>S/ 30 de descuento</strong> en su primer servicio y tú recibes <strong>150 LuminaCoins</strong> de bienestar cuando complete su visita.
        </p>

        <div className="p-3 bg-white/80 dark:bg-slate-950/80 border border-pink-200 dark:border-pink-500/20 rounded-2xl flex items-center justify-between gap-3">
          <div className="text-left">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest block">
              Tu Código VIP
            </span>
            <span className="text-sm font-mono font-black text-purple-600 dark:text-purple-400">
              {cliente.dni ? `GLOSS-${cliente.dni.slice(-4)}` : `GLOSS-${cliente.id.slice(0, 4).toUpperCase()}`}
            </span>
          </div>

          <button
            type="button"
            onClick={async () => {
              const code = cliente.dni ? `GLOSS-${cliente.dni.slice(-4)}` : `GLOSS-${cliente.id.slice(0, 4).toUpperCase()}`;
              try {
                if (navigator.clipboard?.writeText) {
                  await navigator.clipboard.writeText(code);
                }
                setCodigoCopiado(true);
                showAlert(`Código ${code} copiado al portapapeles.`, 'success');
                setTimeout(() => setCodigoCopiado(false), 2000);
              } catch {
                showAlert(`Código: ${code}`, 'info');
              }
            }}
            aria-label={codigoCopiado ? "Código copiado al portapapeles" : "Copiar código de pase VIP"}
            className="min-w-[44px] min-h-[44px] rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-300 hover:bg-purple-100 transition flex items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            {codigoCopiado ? (
              <Check className="w-4 h-4 text-emerald-500" aria-hidden="true" />
            ) : (
              <Copy className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `¡Hola! 🌸 Te invito a conocer Gloss Salón and Relax en Jesús María (17 años de maestría y bienestar boutique). ` +
            `Usa mi código de pase VIP: *${cliente.dni ? `GLOSS-${cliente.dni.slice(-4)}` : `GLOSS-${cliente.id.slice(0, 4).toUpperCase()}`}* ` +
            `para recibir S/ 30 de cortesía en tu primera visita.\n` +
            `👉 Descubre el santuario: https://gloss.pe/cliente`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Compartir invitación de bienvenida por WhatsApp (se abre en una nueva pestaña)"
          className="w-full min-h-[48px] h-auto py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition cursor-pointer active:scale-95 motion-safe:active:scale-95 text-center leading-normal"
        >
          <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Compartir Invitación por WhatsApp</span>
        </a>
      </div>

      {/* 3. Insignias de Bienestar y Lealtad */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Insignias & Logros de Cuidado
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">
            {insignias.length} desbloqueadas
          </span>
        </div>

        {insignias.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            <Gift className="w-6 h-6 mx-auto mb-1 text-slate-400" />
            <p>Con tu próxima visita al salón desbloquearás tus primeras insignias de constancia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {insignias.map(ins => (
              <div
                key={ins.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                    {ins.nombre}
                  </span>
                  <span className="text-[10px] text-slate-400 truncate block">
                    {ins.descripcion || 'Cumplido'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Datos Personales */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Datos de Cuenta
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setEditando(!editando)}
            className="text-xs text-pink-500 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{editando ? 'Cancelar' : 'Editar'}</span>
          </button>
        </div>

        {editando ? (
          <form onSubmit={handleGuardar} className="space-y-3">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                WhatsApp / Teléfono
              </label>
              <input
                type="tel"
                value={celular}
                onChange={e => setCelular(e.target.value)}
                placeholder="+51 999 999 999"
                className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full h-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs text-slate-900 dark:text-white outline-none focus:border-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={guardando}
              className="w-full h-10 bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">WhatsApp:</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">{cliente.celular || 'No registrado'}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Email:</span>
              <span className="font-bold text-slate-900 dark:text-white">{cliente.email || 'No registrado'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Tarjeta de Accesibilidad Visual */}
      <MobileAccessibilityCard userId={cliente.id} />

      {/* 6. Cerrar Sesión */}
      <button
        type="button"
        onClick={onCerrarSesion}
        className="w-full h-12 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-black text-xs rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer active:scale-95 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Cerrar Sesión de Mi Cuenta</span>
      </button>

    </div>
  );
}
