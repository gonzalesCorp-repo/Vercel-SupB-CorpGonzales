'use client';

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Clock, CheckCircle2, FileText, ArrowUpRight, ArrowDownRight, 
  Sparkles, X, Printer, MessageSquare, ChevronRight, ShieldCheck, Send 
} from 'lucide-react';
import { 
  obtenerEstadoCuentaContinuo, solicitarLiquidacionStaff, 
  TransaccionCuenta, ComprobanteLiquidacion 
} from '@/services/compensaciones';
import { ComprobanteLiquidacionTicket } from './ComprobanteLiquidacionTicket';

interface ModalLiquidacionStaffProps {
  isOpen: boolean;
  onClose: () => void;
  agenteId: string;
  agenteNombre: string;
}

export function ModalLiquidacionStaff({ isOpen, onClose, agenteId, agenteNombre }: ModalLiquidacionStaffProps) {
  const [balance, setBalance] = useState(165.50);
  const [creditos, setCreditos] = useState(180.50);
  const [debitos, setDebitos] = useState(15.00);
  const [transacciones, setTransacciones] = useState<TransaccionCuenta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [solicitando, setSolicitando] = useState(false);
  const [comprobanteActivo, setComprobanteActivo] = useState<ComprobanteLiquidacion | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (isOpen) {
      cargarEstadoCuenta();
    }
  }, [isOpen]);

  const cargarEstadoCuenta = async () => {
    setIsLoading(true);
    const data = await obtenerEstadoCuentaContinuo(agenteId);
    setTransacciones(data.transacciones);
    setBalance(data.balanceAcumulado);
    setCreditos(data.creditosHoy);
    setDebitos(data.debitosHoy);
    setIsLoading(false);
  };

  const handleSolicitar = async () => {
    setSolicitando(true);
    const comp = await solicitarLiquidacionStaff(agenteId, agenteNombre, balance, 'DIRECTO_CAJA');
    setSolicitando(false);
    setComprobanteActivo(comp);
    setFeedback('¡Solicitud de Liquidación enviada a Caja y Jefe Operativo!');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-5 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              💵
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Estado de Cuenta Continuo</h3>
              <p className="text-[10px] text-slate-400">Liquidaciones y Comisiones bajo demanda</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tarjeta de Balance Actual Acumulado */}
        <div className="bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 p-5 rounded-3xl space-y-3 shrink-0 shadow-lg">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Saldo Liquidable Disponible
          </span>
          <div className="flex items-baseline justify-between">
            <p className="text-3xl font-black text-emerald-400 font-mono">
              S/. {balance.toFixed(2)}
            </p>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              FREELANCE / DIARIO
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Créditos Hoy:</span>
              <span className="font-bold text-emerald-400 font-mono">+ S/. {creditos.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Deducciones/Canon:</span>
              <span className="font-bold text-rose-400 font-mono">- S/. {debitos.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Lista de Transacciones / Extracto */}
        <div className="space-y-2 flex-1 overflow-y-auto pr-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Movimientos del Periodo
          </span>

          {transacciones.map((tx) => {
            const isCredito = tx.monto > 0;

            return (
              <div
                key={tx.id}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5 pr-2">
                  <p className="font-bold text-slate-200">{tx.concepto}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    <span>{tx.fecha}</span>
                    {tx.clienteNombre && <span>• {tx.clienteNombre}</span>}
                  </div>
                </div>

                <span className={`font-mono font-bold text-xs shrink-0 ${
                  isCredito ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {isCredito ? `+ S/. ${tx.monto.toFixed(2)}` : `- S/. ${Math.abs(tx.monto).toFixed(2)}`}
                </span>
              </div>
            );
          })}
        </div>

        {/* Botón de Solicitud de Liquidación */}
        <div className="pt-2 border-t border-slate-800 shrink-0">
          <button
            onClick={handleSolicitar}
            disabled={solicitando || balance <= 0}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>{solicitando ? 'Enviando Solicitud...' : `Solicitar Liquidación (S/. ${balance.toFixed(2)})`}</span>
          </button>
        </div>

      </div>

      {/* Modal de Comprobante / Ticket */}
      {comprobanteActivo && (
        <ComprobanteLiquidacionTicket
          comprobante={comprobanteActivo}
          onClose={() => setComprobanteActivo(null)}
        />
      )}
    </div>
  );
}
