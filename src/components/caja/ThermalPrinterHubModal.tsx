'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, 
  Usb, 
  Bluetooth, 
  Wifi, 
  Globe, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X, 
  Play, 
  Settings2,
  RefreshCw
} from 'lucide-react';
import { 
  ThermalPrinterConfig, 
  CanalImpresion, 
  obtenerConfiguracionImpresora, 
  guardarConfiguracionImpresora,
  imprimirTicketUniversal,
  generarPayloadPrueba,
  isWebSerialSupported,
  isWebBluetoothSupported
} from '@/services/impresionTermica';

interface ThermalPrinterHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  sedeId?: string;
}

export function ThermalPrinterHubModal({ isOpen, onClose, sedeId }: ThermalPrinterHubModalProps) {
  const [config, setConfig] = useState<ThermalPrinterConfig>(obtenerConfiguracionImpresora());
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setConfig(obtenerConfiguracionImpresora());
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const hasWebSerial = isWebSerialSupported();
  const hasWebBluetooth = isWebBluetoothSupported();

  const handleCanalChange = (canal: CanalImpresion) => {
    const updated = guardarConfiguracionImpresora({ canal });
    setConfig(updated);
    setStatusMessage(null);
  };

  const handleConfigUpdate = (partial: Partial<ThermalPrinterConfig>) => {
    const updated = guardarConfiguracionImpresora(partial);
    setConfig(updated);
  };

  const handleTestPrint = async () => {
    setIsPrintingTest(true);
    setStatusMessage({ type: 'info', text: 'Enviando comando de prueba a la impresora...' });

    try {
      const payload = generarPayloadPrueba(config);
      const res = await imprimirTicketUniversal(payload, config, sedeId);

      if (res.success) {
        setStatusMessage({
          type: 'success',
          text: `¡Ticket de prueba impreso correctamente vía ${res.canalUsado}!`
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: res.error || 'No se pudo comunicar con la impresora térmica.'
        });
      }
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: e?.message || 'Error inesperado al intentar imprimir.'
      });
    } finally {
      setIsPrintingTest(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-100 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white flex items-center gap-2">
                Hub de Impresión Térmica ESC/POS
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                  Tri-Modal
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Configura tu impresora térmica de AliExpress (58mm / 80mm)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Canales de Impresión */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-black text-slate-300 uppercase tracking-wider">
            Canal de Conexión Activo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* CANAL USB SERIAL */}
            <button
              type="button"
              onClick={() => handleCanalChange('USB_SERIAL')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                config.canal === 'USB_SERIAL'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Usb className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs font-black">USB Directo</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Web Serial (Cable)</p>
              </div>
            </button>

            {/* CANAL BLUETOOTH BLE */}
            <button
              type="button"
              onClick={() => handleCanalChange('BLUETOOTH_BLE')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                config.canal === 'BLUETOOTH_BLE'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Bluetooth className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs font-black">Bluetooth</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Inalámbrico BLE</p>
              </div>
            </button>

            {/* CANAL WIFI / LAN */}
            <button
              type="button"
              onClick={() => handleCanalChange('WIFI_LAN_CLOUD')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                config.canal === 'WIFI_LAN_CLOUD'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Wifi className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs font-black">Wi-Fi / LAN</p>
                <p className="text-[9px] text-slate-400 mt-0.5">TCP Puerto 9100</p>
              </div>
            </button>

            {/* CANAL NAVEGADOR HTML */}
            <button
              type="button"
              onClick={() => handleCanalChange('BROWSER_HTML')}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition text-center cursor-pointer ${
                config.canal === 'BROWSER_HTML'
                  ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-400 hover:border-slate-600'
              }`}
            >
              <Globe className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs font-black">Navegador</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Fallback Universal</p>
              </div>
            </button>
          </div>

          {/* Ajustes de Parámetros */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Ancho del papel */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Ancho de Papel
                </label>
                <select
                  value={config.ancho}
                  onChange={(e) => handleConfigUpdate({ ancho: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-indigo-500"
                >
                  <option value="58mm">58 mm (32 cols - Estándar AliExpress)</option>
                  <option value="80mm">80 mm (48 cols - Ancho Completo)</option>
                </select>
              </div>

              {/* Baud Rate (solo para USB) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Velocidad USB (Baud Rate)
                </label>
                <select
                  value={config.baudRate}
                  onChange={(e) => handleConfigUpdate({ baudRate: Number(e.target.value) })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-medium outline-none focus:border-indigo-500"
                  disabled={config.canal !== 'USB_SERIAL'}
                >
                  <option value={9600}>9600 (Recomendado para POS-58)</option>
                  <option value={19200}>19200</option>
                  <option value={38400}>38400 (POS-80)</option>
                  <option value={115200}>115200</option>
                </select>
              </div>
            </div>

            {/* IP de impresora LAN si está en modo WIFI */}
            {config.canal === 'WIFI_LAN_CLOUD' && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    IP de Impresora en Red Local
                  </label>
                  <input
                    type="text"
                    value={config.ipImpresoraLan || ''}
                    onChange={(e) => handleConfigUpdate({ ipImpresoraLan: e.target.value })}
                    placeholder="192.168.1.200"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Puerto TCP
                  </label>
                  <input
                    type="number"
                    value={config.puertoLan || 9100}
                    onChange={(e) => handleConfigUpdate({ puertoLan: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Checkboxes de Hardware */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.cortarPapelAutomatico}
                  onChange={(e) => handleConfigUpdate({ cortarPapelAutomatico: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Corte automático de papel</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.abrirCajonAutomatico}
                  onChange={(e) => handleConfigUpdate({ abrirCajonAutomatico: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Abrir cajón portamonedas</span>
              </label>
            </div>
          </div>

          {/* Mensaje de Estado / Feedback */}
          {statusMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              ) : (
                <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-indigo-400" />
              )}
              <span className="flex-1">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium">
            {config.canal === 'USB_SERIAL' && hasWebSerial && '🟢 Navegador listo para Web Serial USB'}
            {config.canal === 'USB_SERIAL' && !hasWebSerial && '⚠️ Usa Chrome o Edge para Web Serial'}
            {config.canal === 'BLUETOOTH_BLE' && hasWebBluetooth && '🟢 Web Bluetooth disponible'}
            {config.canal === 'WIFI_LAN_CLOUD' && '📡 Requiere print-bridge-agent.js corriendo en el local'}
            {config.canal === 'BROWSER_HTML' && '📄 Compatible con cualquier sistema operativo'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestPrint}
              disabled={isPrintingTest}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isPrintingTest ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 text-emerald-300" />
              )}
              <span>Imprimir Ticket de Prueba</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
