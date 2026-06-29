'use client';

import { useState, useEffect } from 'react';
import { Scissors, Beaker, X } from 'lucide-react';
import ClientSearch from './ClientSearch';
import CatalogModal from './CatalogModal';
import AgentSearch from './AgentSearch';
import { Cliente, Bien, Agente, obtenerAgentesDisponibles, crearOatc } from '@/services/recepcion';
import { obtenerConfigDemandas, ConfigDemanda } from '@/services/wfmConfig';
import { useAppStore } from '@/store/useAppStore';

export default function NuevaOATC({ onClose }: { onClose?: () => void }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [puntoPartida, setPuntoPartida] = useState<Bien[]>([]);
  
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteId, setAgenteId] = useState<string>('');
  
  const [demandas, setDemandas] = useState<ConfigDemanda[]>([]);
  const [tipoDemandaId, setTipoDemandaId] = useState<string>('');
  
  const [modalTipo, setModalTipo] = useState<'servicio' | 'producto' | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const { sedeActiva } = useAppStore();

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
        setTipoDemandaId(dataDemandas[0].id);
      }
    } catch (error) {
      console.error("Error al cargar datos en NuevaOATC:", error);
    }
  };

  const handleAddBien = (bien: Bien) => {
    setPuntoPartida([...puntoPartida, bien]);
  };

  const handleRemoveBien = (index: number) => {
    const newItems = [...puntoPartida];
    newItems.splice(index, 1);
    setPuntoPartida(newItems);
  };

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
        cliente?.id || null, 
        cliente?.nombre || 'POR ASIGNAR', 
        agenteId || null, 
        agenteNombre, 
        puntoPartida,
        demanda ? demanda.nombre : 'Cliente',
        demanda ? demanda.estado_disparador : 'ASESORIA'
      );
      
      setMessage('¡Atención generada exitosamente!');
      
      // Reset form
      setTimeout(() => {
        setCliente(null);
        setPuntoPartida([]);
        setAgenteId('');
        setMessage('');
        if (onClose) onClose();
      }, 1500);
      
    } catch (err) {
      console.error("Error al crear OATC:", err);
      setMessage('Error al generar la atención. Revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Constructor Principal Único */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold mb-4 text-gray-800">Nueva OATC</h2>
        {/* Fila 1: Cliente */}
        <div className="mb-4">
          <ClientSearch 
            onSelect={setCliente} 
            selectedClientName={cliente?.nombre} 
          />
        </div>

        {/* Punto de Partida */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-gray-700">Punto de Partida (Seleccionados)</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setModalTipo('servicio')} 
                className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-700 text-sm border border-blue-200 rounded hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm" 
                title="Agregar Servicio"
              >
                <Scissors className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setModalTipo('producto')} 
                className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-700 text-sm border border-green-200 rounded hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm" 
                title="Agregar Producto Retail"
              >
                <Beaker className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="bg-gray-50 min-h-[60px] border border-gray-200 rounded p-2">
            {puntoPartida.length === 0 ? (
              <div className="text-xs text-gray-400 text-center mt-2">Agrega servicios o productos con los botones de arriba ➔</div>
            ) : (
              <ul className="space-y-1">
                {puntoPartida.map((item, index) => (
                  <li key={index} className="flex justify-between items-center text-xs bg-white p-1.5 border rounded shadow-sm">
                    <span className="font-semibold text-gray-800 truncate pl-1">{item.nombre}</span>
                    <button 
                      onClick={() => handleRemoveBien(index)} 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded ml-2 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Tipo de Demanda */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de Demanda</label>
          <select 
            value={tipoDemandaId}
            onChange={(e) => setTipoDemandaId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            {demandas.map(d => (
              <option key={d.id} value={d.id}>{d.nombre}</option>
            ))}
            {demandas.length === 0 && <option value="">Sin Configurar</option>}
          </select>
        </div>

        {/* Asignar Agente */}
        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-500 mb-1">
            Asignar a Agente
          </label>
          <AgentSearch 
            agentes={agentes} 
            selectedAgenteId={agenteId} 
            onSelectAgente={setAgenteId} 
          />
        </div>

        {/* Botón Generar */}
        <button 
          onClick={handleGenerar} 
          disabled={isSubmitting}
          className={`w-full text-white font-bold rounded-lg text-sm px-4 py-3 shadow-md transition-all ${
            isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {isSubmitting ? 'Procesando...' : 'Generar Orden de Atención'}
        </button>
        {message && (
          <p className={`mt-2 text-xs text-center font-medium ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>

      <CatalogModal 
        isOpen={modalTipo !== null} 
        onClose={() => setModalTipo(null)} 
        tipo={modalTipo} 
        onAdd={handleAddBien} 
      />

    </div>
  );
}
