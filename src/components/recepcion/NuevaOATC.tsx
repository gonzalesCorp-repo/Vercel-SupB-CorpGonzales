'use client';

import { useState, useEffect } from 'react';
import { Scissors, Beaker, X, CheckCircle2, User, Sparkles } from 'lucide-react';
import ClientSearch from './ClientSearch';
import CatalogModal from './CatalogModal';
import AgentSearch from './AgentSearch';
import { Cliente, Bien, Agente, obtenerAgentesDisponibles, crearOatc } from '@/services/recepcion';
import { obtenerConfigDemandas, ConfigDemanda } from '@/services/wfmConfig';
import { useAppStore } from '@/store/useAppStore';

interface NuevaOATCProps {
  onClose?: () => void;
  onClientSelected?: (name: string) => void;
  onCreatedSuccess?: () => void;
}

export default function NuevaOATC({ onClose, onClientSelected, onCreatedSuccess }: NuevaOATCProps) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [puntoPartida, setPuntoPartida] = useState<(Bien & { precio?: number })[]>([]);
  
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteId, setAgenteId] = useState<string>('');
  
  const [demandas, setDemandas] = useState<ConfigDemanda[]>([]);
  const [tipoDemandaId, setTipoDemandaId] = useState<string>('');
  
  const [modalTipo, setModalTipo] = useState<'servicio' | 'producto' | null>(null);
  
  // Anticipos y Pre-Cobro
  const [tieneAdelanto, setTieneAdelanto] = useState(false);
  const [montoAdelanto, setMontoAdelanto] = useState<number>(0);
  const [metodoAdelanto, setMetodoAdelanto] = useState<string>('YAPE');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const sedeActiva = useAppStore((state) => state.sedeActiva);

  useEffect(() => {
    if (sedeActiva) {
      cargarDatosIniciales();
    }
  }, [sedeActiva]);
  
  // Resetear agenteId cuando se cambia de sede
  useEffect(() => {
    setAgenteId('');
  }, [sedeActiva?.id]);

  const cargarDatosIniciales = async () => {
    try {
      const [dataAgentes, dataDemandas] = await Promise.all([
        obtenerAgentesDisponibles(),
        obtenerConfigDemandas()
      ]);
      
      const operativosActivos = dataAgentes.filter(a => a.rol === 'STAFF' && a.estado !== 'INACTIVO');
      const ordenados = operativosActivos.sort((a, b) => {
        const timeA = new Date((a as any).ultimo_cambio_estado || a.created_at).getTime();
        const timeB = new Date((b as any).ultimo_cambio_estado || b.created_at).getTime();
        return timeA - timeB;
      });
      
      setAgentes(ordenados);
      setDemandas(dataDemandas);
      if (dataDemandas.length > 0) {
        // Por defecto: 'Turno'
        const demandaTurno = dataDemandas.find(d => d.nombre.toLowerCase().includes('turno') || d.nombre.toLowerCase().includes('cola')) || dataDemandas[0];
        setTipoDemandaId(demandaTurno.id);
      }
    } catch (error) {
      console.error("Error al cargar datos en NuevaOATC:", error);
    }
  };

  const handleClienteSelect = (c: Cliente | null) => {
    setCliente(c);
    if (onClientSelected) {
      onClientSelected(c ? c.nombre : '');
    }
  };

  const handleAddItem = (item: Bien) => {
    setPuntoPartida((prev) => [...prev, { ...item, precio: item.precio_venta || 0 }]);
    setModalTipo(null);
  };

  const handleRemoveItem = (index: number) => {
    setPuntoPartida((prev) => prev.filter((_, i) => i !== index));
  };

  const totalCalculado = puntoPartida.reduce((acc, it) => acc + (it.precio || it.precio_venta || 0), 0);

  const handleGenerar = async () => {
    if (puntoPartida.length === 0) {
      setMessage('Error: Debes agregar al menos un servicio o producto.');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const agenteSeleccionado = agentes.find(a => a.id === agenteId);
      const agenteNombre = agenteSeleccionado ? agenteSeleccionado.nombre : 'POR ASIGNAR';
      const demanda = demandas.find(d => d.id === tipoDemandaId);
      
      await crearOatc(
        cliente ? (cliente.id || null) : null,
        cliente ? cliente.nombre : 'Cliente Ocasional',
        agenteId || null, 
        agenteNombre, 
        puntoPartida,
        demanda ? demanda.nombre : 'Cliente',
        'ASESORIA', // Siempre iniciar en ASESORIA
        tieneAdelanto ? montoAdelanto : 0,
        tieneAdelanto ? metodoAdelanto : undefined
      );
      
      setMessage('¡Atención generada exitosamente!');
      
      // Reset form
      setTimeout(() => {
        setCliente(null);
        setPuntoPartida([]);
        setAgenteId('');
        setTieneAdelanto(false);
        setMontoAdelanto(0);
        setMessage('');
        if (onCreatedSuccess) onCreatedSuccess();
        if (onClose) onClose();
      }, 1000);
      
    } catch (err) {
      console.error("Error al crear OATC:", err);
      setMessage('Error al generar la atención.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 text-slate-800 dark:text-slate-100">
      
      {/* Constructor Principal Único */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
        
        {/* Fila 1: Cliente */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">1. Cliente / Consumidor</label>
          <ClientSearch 
            onSelect={handleClienteSelect} 
            selectedClientName={cliente?.nombre} 
          />
          {cliente && (
            <div className="mt-2 p-2.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">
                  {cliente.nombre.charAt(0)}
                </div>
                <div>
                  <span className="text-xs font-black text-slate-900 dark:text-white block">{cliente.nombre}</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {cliente.dni ? `DNI: ${cliente.dni}` : ''} {cliente.dni && cliente.celular ? '• ' : ''} {cliente.celular ? `Cel: ${cliente.celular}` : ''}
                  </span>
                </div>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                Ficha VIP
              </span>
            </div>
          )}
        </div>

        {/* Fila 2: Punto de Partida */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">2. Punto de Partida</label>
          
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => setModalTipo('servicio')}
              className="flex-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Scissors className="w-4 h-4" /> Agregar Servicio
            </button>
            <button
              type="button"
              onClick={() => setModalTipo('producto')}
              className="flex-1 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Beaker className="w-4 h-4" /> Agregar Producto
            </button>
          </div>

          {/* Lista de Items Seleccionados */}
          {puntoPartida.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mb-3">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-3 py-2 text-left font-bold text-slate-600 dark:text-slate-300">Concepto</th>
                    <th className="px-3 py-2 text-right font-bold text-slate-600 dark:text-slate-300">Precio</th>
                    <th className="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {puntoPartida.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 font-medium">{item.nombre}</td>
                      <td className="px-3 py-2 text-right font-semibold">S/ {(item.precio || item.precio_venta || 0).toFixed(2)}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="text-slate-400 hover:text-rose-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Fila 3: Agente y Tipo de Demanda */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">3. Especialista Asignado</label>
            <AgentSearch 
              agentes={agentes}
              selectedAgenteId={agenteId}
              onSelectAgente={setAgenteId}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">4. Tipo de Demanda</label>
            <select
              value={tipoDemandaId}
              onChange={(e) => setTipoDemandaId(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
            >
              {demandas.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fila 4: Anticipo / Pre-Cobro Fuera de Horario */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={tieneAdelanto}
                onChange={(e) => {
                  setTieneAdelanto(e.target.checked);
                  if (e.target.checked && montoAdelanto === 0) {
                    setMontoAdelanto(totalCalculado);
                  }
                }}
                className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
              />
              <span>Registrar Anticipo / Pre-Cobro de Cita</span>
            </label>
            {tieneAdelanto && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                montoAdelanto >= totalCalculado && totalCalculado > 0
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {montoAdelanto >= totalCalculado && totalCalculado > 0 ? '100% PRE-COBRADO' : 'ANTICIPO PARCIAL'}
              </span>
            )}
          </div>

          {tieneAdelanto && (
            <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Monto Adelanto (S/)</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={montoAdelanto || ''}
                  onChange={(e) => setMontoAdelanto(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Método de Anticipo</label>
                <select
                  value={metodoAdelanto}
                  onChange={(e) => setMetodoAdelanto(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="YAPE">📱 Yape</option>
                  <option value="PLIN">🟣 Plin</option>
                  <option value="TARJETA">💳 Tarjeta (POS)</option>
                  <option value="EFECTIVO">💵 Efectivo</option>
                  <option value="TRANSFERENCIA">🏦 Transferencia Bancaria</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Message */}
        {message && (
          <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
            message.includes('Error') 
              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}>
            {!message.includes('Error') && <CheckCircle2 className="w-4 h-4" />}
            <span>{message}</span>
          </div>
        )}

        {/* Botón de Confirmación */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isSubmitting || puntoPartida.length === 0}
            onClick={handleGenerar}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition disabled:opacity-50 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Generando Orden...' : 'Crear Orden de Atención'}
          </button>
        </div>

      </div>

      {/* Modal de Catálogo */}
      {modalTipo && (
        <CatalogModal 
          isOpen={true} 
          tipo={modalTipo} 
          onClose={() => setModalTipo(null)} 
          onAdd={handleAddItem} 
        />
      )}
    </div>
  );
}
