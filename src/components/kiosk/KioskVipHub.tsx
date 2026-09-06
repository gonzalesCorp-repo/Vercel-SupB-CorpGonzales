'use client';

import React from 'react';
import { ArrowLeft, Sparkles, Clock, Zap, Coffee, History, Calendar } from 'lucide-react';
import { ClienteVipPerfil } from '@/services/clientes';
import { getLoyaltyTier } from '@/config/branding';
import { KioskConciergeAgent } from './KioskConciergeAgent';

export interface KioskVipHubProps {
  clienteVip: ClienteVipPerfil;
  branding: any;
  onCambiarCliente: () => void;
  accionTurnoEnviando: boolean;
  onRegistrarLlegada: () => void;
  onPedirBebida: (bebida: string) => void;
}

export function KioskVipHub({
  clienteVip,
  branding,
  onCambiarCliente,
  accionTurnoEnviando,
  onRegistrarLlegada,
  onPedirBebida
}: KioskVipHubProps) {
  const loyaltyTier = getLoyaltyTier(clienteVip.puntosVaikuntha, branding);

  return (
    <div className="space-y-5 animate-in fade-in select-none">
      
      {/* Header VIP del Cliente */}
      <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl border border-purple-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-[2px] shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center font-black text-2xl text-purple-300">
              {clienteVip.cliente.nombre.charAt(0)}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white">{clienteVip.cliente.nombre}</h2>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${loyaltyTier.badgeColor}`}>
                {loyaltyTier.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              DNI: <strong className="text-slate-200 font-mono">{clienteVip.cliente.dni || 'No registrado'}</strong> • {clienteVip.visitasTotales} Visitas en Salón
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Balance Vaikuntha Points */}
          <div className="bg-slate-950/80 border border-purple-500/30 p-3.5 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-amber-400 flex items-center justify-end gap-1 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> {branding.loyalty?.pointsName || 'Puntos VIP'}
            </span>
            <p className="text-2xl font-black text-white mt-0.5 font-mono">
              {clienteVip.puntosVaikuntha} <span className="text-xs text-purple-400">{branding.loyalty?.pointsShort || 'PTS'}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onCambiarCliente}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cambiar</span>
          </button>
        </div>
      </div>

      {/* Google Opal AI Concierge */}
      <KioskConciergeAgent
        clienteVip={clienteVip}
        branding={branding}
        onPedirBebida={onPedirBebida}
      />

      {/* ESTADO EN VIVO: ¿Tiene orden activa en sala? */}
      {clienteVip.oatcActiva ? (
        <div className="bg-gradient-to-br from-indigo-950/50 to-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Estado de Tu Turno en Sala
              </span>
              <h3 className="text-xl font-black text-white mt-0.5">
                {clienteVip.oatcActiva.estado_proceso === 'EN_ESPERA' 
                  ? `Posición en Cola: #${clienteVip.posicionCola || 1} en Espera`
                  : `En Atención en Silla: ${clienteVip.oatcActiva.estado_proceso}`}
              </h3>
            </div>

            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold uppercase">
              {clienteVip.oatcActiva.estado_proceso}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Especialista Asignado</span>
              <p className="text-sm font-bold text-white mt-1">
                {clienteVip.oatcActiva.agente_nombre || 'Asignación automática en curso'}
              </p>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Tiempo Estimado</span>
              <p className="text-sm font-bold text-amber-400 mt-1">
                ~ 5 a 10 minutos
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* NO TIENE ORDEN ACTIVA: Botón para Autogestionar Llegada / Tomar Turno */
        <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white">¿Deseas atenderte el día de hoy?</h3>
            <p className="text-xs text-slate-400 mt-1">
              Registra tu llegada para que Recepción y tu especialista preparen tu estación de trabajo.
            </p>
          </div>

          <button
            type="button"
            disabled={accionTurnoEnviando}
            onClick={onRegistrarLlegada}
            className="w-full max-w-md mx-auto py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>{accionTurnoEnviando ? 'Registrando Turno...' : '🎟️ Registrar Mi Llegada (Tomar Turno en Sala)'}</span>
          </button>
        </div>
      )}

      {/* Bar & Cafetería de Bienvenida */}
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Coffee className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Bar & Cafetería VIP de Cortesía
            </h3>
          </div>
          <span className="text-[10px] text-amber-400 font-bold">100% Incluido</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {[
            { nombre: '☕ Café Espresso Americano', desc: 'Grano Seleccionado' },
            { nombre: '☕ Capuchino con Canela', desc: 'Espuma Artesanal' },
            { nombre: '🧃 Jugo de Naranja Natural', desc: 'Prensado en Frío' },
            { nombre: '🍵 Té Verde Antioxidante', desc: 'Infusión Orgánica' },
            { nombre: '💧 Agua Mineral San Mateo', desc: 'Con o sin gas' },
            { nombre: '🥂 Cocktail de Bienvenida VIP', desc: 'Exclusivo Miembros' }
          ].map((b) => (
            <button
              key={b.nombre}
              type="button"
              onClick={() => onPedirBebida(b.nombre)}
              className="p-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 rounded-2xl text-left transition active:scale-95 cursor-pointer"
            >
              <span className="text-xs font-bold text-white block truncate">{b.nombre}</span>
              <span className="text-[9px] text-slate-400 block mt-0.5">{b.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Historial de Visitas Pasadas */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Historial de Visitas & Atenciones Pasadas
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {clienteVip.historialVisitas?.length || 0} atenciones registradas
          </span>
        </div>

        {(!clienteVip.historialVisitas || clienteVip.historialVisitas.length === 0) ? (
          <p className="text-xs text-slate-500 text-center py-4">Esta es tu primera visita registrada en el sistema.</p>
        ) : (
          <div className="space-y-2.5">
            {clienteVip.historialVisitas.map((v) => (
              <div
                key={v.id}
                className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-bold text-white">
                      {new Date(v.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-[10px] text-slate-400">• Atendido por: <strong className="text-indigo-300">{v.agente_nombre || 'Especialista'}</strong></span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1">
                    {v.punto_partida?.map((p: any) => p.nombre).join(' + ') || 'Servicios realizados'}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-400 font-mono block">
                    S/ {v.punto_partida?.reduce((acc: number, p: any) => acc + Number(p.precio || 0), 0).toFixed(2) || '0.00'}
                  </span>
                  <span className="text-[9px] text-purple-400 font-bold uppercase">Finalizado</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
