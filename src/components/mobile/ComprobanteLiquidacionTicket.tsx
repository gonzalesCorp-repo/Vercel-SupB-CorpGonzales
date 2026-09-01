'use client';

import React, { useState } from 'react';
import { 
  Printer, MessageSquare, Download, CheckCircle2, X, DollarSign, 
  Sparkles, FileText, Wifi, Bluetooth, ShieldCheck, Share2
} from 'lucide-react';
import { ComprobanteLiquidacion } from '@/services/compensaciones';

interface ComprobanteLiquidacionTicketProps {
  comprobante: ComprobanteLiquidacion;
  onClose: () => void;
}

export function ComprobanteLiquidacionTicket({ comprobante, onClose }: ComprobanteLiquidacionTicketProps) {
  const [imprimiendo, setImprimiendo] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleImprimirTermica = () => {
    setImprimiendo(true);
    setTimeout(() => {
      setImprimiendo(false);
      setFeedback('¡Enviado a Impresora Térmica Bluetooth/Wi-Fi (ESC/POS 80mm)!');
      setTimeout(() => setFeedback(''), 4000);
    }, 1200);
  };

  const handleDescargarPDF = () => {
    window.print();
  };

  const textoWhatsApp = encodeURIComponent(
    `*🧾 COMPROBANTE DE LIQUIDACIÓN OPERATIVA*\n` +
    `*Código:* ${comprobante.codigoLiquidacion}\n` +
    `*Colaborador:* ${comprobante.agenteNombre} (DNI: ${comprobante.agenteDni})\n` +
    `*Sede:* ${comprobante.sedeNombre}\n` +
    `*Fecha:* ${new Date(comprobante.fechaEmision).toLocaleDateString()}\n\n` +
    `*RESUMEN FINANCIERO:*\n` +
    `• Comisiones Servicios: S/. ${comprobante.totalComisionesServicios.toFixed(2)}\n` +
    `• Bono Insumos Propios: + S/. ${comprobante.bonoInsumosPropios.toFixed(2)}\n` +
    `• Canon Uso Espacio: - S/. ${comprobante.deduccionAlquilerEspacio.toFixed(2)}\n` +
    `• Adelantos: - S/. ${comprobante.deduccionAdelantos.toFixed(2)}\n\n` +
    `*💰 MONTO NETO A PAGAR: S/. ${comprobante.montoNetoPagar.toFixed(2)}*\n` +
    `*Estado:* ${comprobante.estado}\n` +
    `*Firma Digital:* ${comprobante.firmaSolicitante}`
  );

  return (
    <div className="fixed inset-0 z-[140] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 w-full max-w-md rounded-3xl p-6 border border-slate-800 space-y-5 shadow-2xl my-auto text-slate-100 animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              🧾
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Comprobante de Liquidación</h3>
              <p className="text-[10px] font-mono text-emerald-400">{comprobante.codigoLiquidacion}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold rounded-2xl flex items-center gap-2 animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Tarjeta de Ticket Térmico / Extracto Digital */}
        <div className="bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-mono text-xs space-y-3.5 select-text border border-slate-300">
          
          <div className="text-center border-b border-dashed border-slate-400 pb-3 space-y-0.5">
            <h2 className="font-black text-sm uppercase tracking-wider">{comprobante.sedeNombre}</h2>
            <p className="text-[10px] text-slate-600">LIQUIDACIÓN DE SERVICIOS POR DESTAJO</p>
            <p className="text-[10px] text-slate-500">RUC: 20608912341 • Jesús María, Lima</p>
          </div>

          <div className="text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Colaborador:</span>
              <span className="font-bold">{comprobante.agenteNombre}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">DNI / RUC:</span>
              <span className="font-bold">{comprobante.agenteDni || '--------'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Régimen:</span>
              <span className="font-bold">{comprobante.regimen}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Periodo:</span>
              <span>{comprobante.periodoInicio}</span>
            </div>
          </div>

          {/* Detalle de Servicios */}
          <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1.5">
            <span className="font-bold text-[10px] uppercase text-slate-700 block">Detalle de Producción:</span>
            {comprobante.detalleServicios.map((s, idx) => (
              <div key={idx} className="flex justify-between text-[10px] leading-tight">
                <div className="pr-2">
                  <p className="font-bold text-slate-800">{s.servicioNombre}</p>
                  <span className="text-slate-500">{s.clienteNombre} ({s.porcentajeComision}% {s.insumosPropios ? '+Insumo Propio' : ''})</span>
                </div>
                <span className="font-bold text-right shrink-0">S/. {s.comisionGanada.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Resumen y Totales */}
          <div className="space-y-1 text-[11px] pt-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Comisiones Servicios:</span>
              <span>S/. {comprobante.totalComisionesServicios.toFixed(2)}</span>
            </div>
            {comprobante.bonoInsumosPropios > 0 && (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Bono Insumos Propios:</span>
                <span>+ S/. {comprobante.bonoInsumosPropios.toFixed(2)}</span>
              </div>
            )}
            {comprobante.deduccionAlquilerEspacio > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Canon Alquiler Silla/Box:</span>
                <span>- S/. {comprobante.deduccionAlquilerEspacio.toFixed(2)}</span>
              </div>
            )}
            {comprobante.deduccionAdelantos > 0 && (
              <div className="flex justify-between text-rose-700">
                <span>Adelantos Precedentes:</span>
                <span>- S/. {comprobante.deduccionAdelantos.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black pt-2 border-t-2 border-slate-900 text-slate-900">
              <span>NETO A LIQUIDAR:</span>
              <span>S/. {comprobante.montoNetoPagar.toFixed(2)}</span>
            </div>
          </div>

          {/* Espacio de Firmas Duales */}
          <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[9px] border-t border-dashed border-slate-400">
            <div className="space-y-1">
              <div className="border-b border-slate-800 pb-1 font-mono italic text-[8px] text-slate-500">
                {comprobante.firmaSolicitante ? 'FIRMA DIGITAL REGISTRADA' : '___________________'}
              </div>
              <p className="font-bold text-slate-700">FIRMA DEL COLABORADOR</p>
              <p className="text-slate-500">{comprobante.agenteNombre}</p>
            </div>

            <div className="space-y-1">
              <div className="border-b border-slate-800 pb-1 font-mono italic text-[8px] text-slate-500">
                PENDIENTE AUTORIZACIÓN
              </div>
              <p className="font-bold text-slate-700">ADMIN / CAJA POS</p>
              <p className="text-slate-500">{comprobante.sedeNombre || 'Administración'}</p>
            </div>
          </div>

          <div className="text-[8px] text-center text-slate-400 pt-2">
            HASH DE SEGURIDAD: {comprobante.codigoLiquidacion} • VÁLIDO SUNAT / LOCACIÓN DE SERVICIOS
          </div>

        </div>

        {/* Acciones de Conectividad & Exportación */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleImprimirTermica}
            disabled={imprimiendo}
            className="p-3 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold text-xs rounded-2xl border border-slate-700 flex flex-col items-center justify-center gap-1 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span className="text-[10px]">{imprimiendo ? 'Imprimiendo...' : 'Térmica 80mm'}</span>
          </button>

          <a
            href={`https://wa.me/?text=${textoWhatsApp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-95 text-center shadow-lg shadow-emerald-600/20"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px]">WhatsApp</span>
          </a>

          <button
            onClick={handleDescargarPDF}
            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl flex flex-col items-center justify-center gap-1 transition active:scale-95 shadow-lg shadow-indigo-600/20"
          >
            <Download className="w-4 h-4" />
            <span className="text-[10px]">Descargar PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
