'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Scale, Bluetooth, Wifi, Usb, Cpu, CheckCircle2, 
  AlertTriangle, RefreshCw, Radio, Zap, ShieldCheck 
} from 'lucide-react';
import { 
  ProtocoloBalanza, 
  ConfiguracionBalanza, 
  obtenerConfiguracionBalanza, 
  guardarConfiguracionBalanza, 
  conectarBalanzaBluetooth, 
  conectarBalanzaWiFi, 
  conectarBalanzaSerial, 
  desconectarBalanza, 
  LecturaBalanza 
} from '@/lib/hardware/iotScale';

interface ModalConfiguracionBalanzaProps {
  isOpen: boolean;
  onClose: () => void;
  onLecturaBalanza: (lectura: LecturaBalanza) => void;
}

export function ModalConfiguracionBalanza({
  isOpen,
  onClose,
  onLecturaBalanza
}: ModalConfiguracionBalanzaProps) {
  const [config, setConfig] = useState<ConfiguracionBalanza>({
    protocolo: 'SIMULACION',
    dispositivoNombre: 'Balanza Simulada',
    wifiIp: '192.168.1.150',
    wifiPuerto: 81,
    serialBaudRate: 9600,
    autoReconectar: false
  });

  const [conectando, setConectando] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const [ultimoPesoTest, setUltimoPesoTest] = useState<number>(0);
  const [esEstableTest, setEsEstableTest] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      const cfg = obtenerConfiguracionBalanza();
      setConfig(cfg);
      setErrorMensaje('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestCallback = (lectura: LecturaBalanza) => {
    setUltimoPesoTest(lectura.pesoGramos);
    setEsEstableTest(lectura.estable);
    onLecturaBalanza(lectura);
  };

  const handleConectar = async () => {
    setConectando(true);
    setErrorMensaje('');

    try {
      if (config.protocolo === 'BLUETOOTH_BLE') {
        const res = await conectarBalanzaBluetooth(handleTestCallback);
        if (res.ok) {
          setConectado(true);
          setConfig(prev => ({ ...prev, dispositivoNombre: res.deviceName }));
        } else {
          setErrorMensaje(res.error || 'Error conectando bluetooth');
        }
      } else if (config.protocolo === 'WIFI_LOCAL') {
        const res = await conectarBalanzaWiFi(config.wifiIp || '192.168.1.150', config.wifiPuerto || 81, handleTestCallback);
        if (res.ok) {
          setConectado(true);
        } else {
          setErrorMensaje(res.error || 'Error conectando WiFi');
        }
      } else if (config.protocolo === 'SERIAL_USB') {
        const res = await conectarBalanzaSerial(handleTestCallback, config.serialBaudRate || 9600);
        if (res.ok) {
          setConectado(true);
        } else {
          setErrorMensaje(res.error || 'Error conectando USB Serial');
        }
      } else {
        // Simulación
        desconectarBalanza();
        guardarConfiguracionBalanza({ ...config, protocolo: 'SIMULACION' });
        setConectado(true);
        handleTestCallback({
          pesoGramos: 0.0,
          unidad: 'g',
          estable: true,
          timestamp: new Date().toISOString(),
          protocolo: 'SIMULACION',
          dispositivoNombre: 'Simulador Calibrado'
        });
      }
    } catch (e: any) {
      setErrorMensaje(e.message || 'Error en comunicación');
    } finally {
      setConectando(false);
    }
  };

  const handleDesconectar = () => {
    desconectarBalanza();
    setConectado(false);
    setUltimoPesoTest(0);
    setErrorMensaje('');
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg space-y-5 shadow-2xl text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Configuración de Balanzas IoT</h3>
              <p className="text-[10px] text-slate-400">Driver Tri-Modo: Bluetooth BLE, WiFi Local y USB Serial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Display Test en Vivo */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Lectura en Tiempo Real</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black font-mono text-emerald-400">
                {ultimoPesoTest.toFixed(1)}
              </span>
              <span className="text-sm font-bold text-emerald-500">gramos</span>
            </div>
          </div>

          <div className="text-right space-y-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
              conectado ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              <Radio className={`w-3 h-3 ${conectado ? 'animate-pulse text-emerald-400' : ''}`} />
              {conectado ? 'CONECTADA' : 'STANDBY'}
            </span>
            <p className="text-[9px] font-mono text-slate-500 block">
              {esEstableTest ? '🟢 Peso Estable' : '🟡 Estabilizando...'}
            </p>
          </div>
        </div>

        {errorMensaje && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMensaje}</span>
          </div>
        )}

        {/* Selector de Protocolo */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase block">
            Seleccionar Protocolo de Hardware:
          </label>
          <div className="grid grid-cols-2 gap-2">
            
            {/* BLE */}
            <button
              type="button"
              onClick={() => setConfig({ ...config, protocolo: 'BLUETOOTH_BLE' })}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                config.protocolo === 'BLUETOOTH_BLE'
                  ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bluetooth className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Bluetooth BLE</p>
                <p className="text-[10px] text-slate-400">GATT / UART Nordic</p>
              </div>
            </button>

            {/* WiFi */}
            <button
              type="button"
              onClick={() => setConfig({ ...config, protocolo: 'WIFI_LOCAL' })}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                config.protocolo === 'WIFI_LOCAL'
                  ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wifi className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">WiFi / ESP32</p>
                <p className="text-[10px] text-slate-400">WebSocket & REST IP</p>
              </div>
            </button>

            {/* USB Serial */}
            <button
              type="button"
              onClick={() => setConfig({ ...config, protocolo: 'SERIAL_USB' })}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                config.protocolo === 'SERIAL_USB'
                  ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Usb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">USB Serial / COM</p>
                <p className="text-[10px] text-slate-400">Ohaus, Dymo, Torrey</p>
              </div>
            </button>

            {/* Simulación */}
            <button
              type="button"
              onClick={() => setConfig({ ...config, protocolo: 'SIMULACION' })}
              className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                config.protocolo === 'SIMULACION'
                  ? 'bg-indigo-500/20 border-indigo-500 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">Simulador Demo</p>
                <p className="text-[10px] text-slate-400">Pesaje por software</p>
              </div>
            </button>

          </div>
        </div>

        {/* Parámetros Específicos según Protocolo */}
        {config.protocolo === 'WIFI_LOCAL' && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-3 animate-in fade-in">
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">IP Local de Balanza:</label>
                <input
                  type="text"
                  value={config.wifiIp}
                  onChange={(e) => setConfig({ ...config, wifiIp: e.target.value })}
                  placeholder="192.168.1.150"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Puerto WS:</label>
                <input
                  type="number"
                  value={config.wifiPuerto}
                  onChange={(e) => setConfig({ ...config, wifiPuerto: Number(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Asegúrate de que la balanza ESP32 y este equipo estén en la misma red WiFi/LAN.
            </p>
          </div>
        )}

        {config.protocolo === 'SERIAL_USB' && (
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2 animate-in fade-in">
            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Baudrate COM:</label>
            <select
              value={config.serialBaudRate}
              onChange={(e) => setConfig({ ...config, serialBaudRate: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={9600}>9600 bps (Estándar Ohaus / CAS)</option>
              <option value={19200}>19200 bps</option>
              <option value={115200}>115200 bps (ESP32 / Balanzas Rápidas)</option>
            </select>
          </div>
        )}

        {/* Botonera de Acción */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
          {conectado ? (
            <button
              type="button"
              onClick={handleDesconectar}
              className="px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold rounded-xl transition"
            >
              Desconectar
            </button>
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={handleConectar}
              disabled={conectando}
              className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 active:scale-95 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${conectando ? 'animate-spin' : ''}`} />
              <span>{conectando ? 'Conectando...' : 'Conectar Balanza'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
