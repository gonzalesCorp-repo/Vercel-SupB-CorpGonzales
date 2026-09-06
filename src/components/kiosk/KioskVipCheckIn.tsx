'use client';

import React from 'react';
import { User, Search, Plus, Sparkles, X } from 'lucide-react';

export interface KioskVipCheckInProps {
  busquedaCliente: string;
  setBusquedaCliente: (v: string) => void;
  buscandoCliente: boolean;
  onBuscarSubmit: (e: React.FormEvent) => void;
  onEjecutarBusqueda: (term: string) => void;
  clientesFrecuentes: any[];
  onOpenNuevoCliente: () => void;
  showNuevoClienteModal: boolean;
  onCloseNuevoClienteModal: () => void;
  nuevoClienteForm: { nombre: string; dni: string; celular: string };
  setNuevoClienteForm: React.Dispatch<React.SetStateAction<{ nombre: string; dni: string; celular: string }>>;
  guardandoCliente: boolean;
  onCrearNuevoClienteSubmit: (e: React.FormEvent) => void;
  branding: any;
}

export function KioskVipCheckIn({
  busquedaCliente,
  setBusquedaCliente,
  buscandoCliente,
  onBuscarSubmit,
  onEjecutarBusqueda,
  clientesFrecuentes,
  onOpenNuevoCliente,
  showNuevoClienteModal,
  onCloseNuevoClienteModal,
  nuevoClienteForm,
  setNuevoClienteForm,
  guardandoCliente,
  onCrearNuevoClienteSubmit,
  branding
}: KioskVipCheckInProps) {
  return (
    <div className="space-y-6 animate-in fade-in select-none">
      
      {/* Buscador Táctil */}
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
            <User className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-white">Ingreso de Clientes VIP</h2>
          <p className="text-xs text-slate-400">Ingresa tu número de DNI o celular para acceder a tu pasaporte digital</p>
        </div>

        <form onSubmit={onBuscarSubmit} className="max-w-md mx-auto space-y-3">
          <div className="relative">
            <input
              id="kiosk_busqueda_cliente"
              name="kiosk_busqueda_cliente"
              type="text"
              placeholder="DNI / Celular / Nombre"
              aria-label="DNI, Celular o Nombre del Cliente VIP"
              value={busquedaCliente}
              onChange={(e) => setBusquedaCliente(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3.5 text-center text-lg font-mono tracking-wider text-white focus:outline-none focus:border-purple-500"
              autoFocus
            />
            {busquedaCliente && (
              <button
                type="button"
                onClick={() => setBusquedaCliente('')}
                className="absolute right-3 top-3.5 p-1 rounded-full text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="submit"
              disabled={buscandoCliente || !busquedaCliente.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-purple-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{buscandoCliente ? 'Buscando...' : 'Consultar Mi Perfil'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenNuevoCliente}
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Soy Nuevo / Registrarme</span>
            </button>
          </div>
        </form>
      </div>

      {/* Tiles Rápidos de Clientes Frecuentes Reales */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider">
              Clientes Recientes & Frecuentes
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">1-Toque para Check-in</span>
        </div>

        {clientesFrecuentes.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No hay clientes registrados recientemente en esta sede. Utiliza el buscador o regístrate como nuevo cliente.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {clientesFrecuentes.map((c) => (
              <div
                key={c.id || c.dni}
                onClick={() => onEjecutarBusqueda(c.dni || c.celular || c.nombre)}
                className="p-3.5 bg-slate-900 border border-slate-800 hover:border-purple-500/60 rounded-2xl cursor-pointer transition-all flex items-center justify-between group active:scale-98 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 flex items-center justify-center font-black text-sm uppercase">
                    {c.nombre?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
                      {c.nombre}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.dni ? `DNI: ${c.dni}` : c.celular ? `Cel: ${c.celular}` : 'Cliente Registrado'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full block mb-1">
                    VIP Salón
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    Activo
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Express de Registro de Nuevo Cliente */}
      {showNuevoClienteModal && (
        <div className="fixed inset-0 z-[200] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-4 shadow-2xl relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={onCloseNuevoClienteModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto mb-2">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Registro Express VIP</h3>
              <p className="text-xs text-slate-400">
                Regístrate en 20 segundos y obtén <strong className="text-purple-300">100 {branding.loyalty?.pointsName || 'Puntos'}</strong> de bienvenida.
              </p>
            </div>

            <form onSubmit={onCrearNuevoClienteSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="kiosk_nuevo_cliente_nombre" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                  Nombre Completo *
                </label>
                <input
                  id="kiosk_nuevo_cliente_nombre"
                  name="kiosk_nuevo_cliente_nombre"
                  type="text"
                  placeholder="Ej. Valeria Mendoza"
                  value={nuevoClienteForm.nombre}
                  onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, nombre: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-bold"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="kiosk_nuevo_cliente_dni" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    DNI / Documento
                  </label>
                  <input
                    id="kiosk_nuevo_cliente_dni"
                    name="kiosk_nuevo_cliente_dni"
                    type="text"
                    placeholder="72918234"
                    value={nuevoClienteForm.dni}
                    onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, dni: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label htmlFor="kiosk_nuevo_cliente_celular" className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    id="kiosk_nuevo_cliente_celular"
                    name="kiosk_nuevo_cliente_celular"
                    type="text"
                    placeholder="999888777"
                    value={nuevoClienteForm.celular}
                    onChange={(e) => setNuevoClienteForm({ ...nuevoClienteForm, celular: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white font-mono font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={guardandoCliente}
                className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-purple-600/30 transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                {guardandoCliente ? 'Registrando...' : '✨ Registrarme y Obtener Mis 100 Puntos'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
