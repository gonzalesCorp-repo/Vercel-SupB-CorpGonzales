'use client';

import { useState, useEffect } from 'react';
import { Scissors, Beaker, X } from 'lucide-react';
import ClientSearch from './ClientSearch';
import CatalogModal from './CatalogModal';
import { Cliente, Bien, Agente, obtenerAgentesDisponibles, crearOatc } from '@/services/recepcion';
import { useAppStore } from '@/store/useAppStore';

export default function NuevaOATC() {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [puntoPartida, setPuntoPartida] = useState<Bien[]>([]);
  
  const [agentes, setAgentes] = useState<Agente[]>([]);
  const [agenteId, setAgenteId] = useState<string>('');
  
  const [tipoDemanda, setTipoDemanda] = useState<string>('cliente');
  
  const [modalTipo, setModalTipo] = useState<'servicio' | 'producto' | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const { sedeActiva } = useAppStore();

  useEffect(() => {
    if (sedeActiva) {
      cargarAgentes();
    }
  }, [sedeActiva]);

  const cargarAgentes = async () => {
    const data = await obtenerAgentesDisponibles();
    setAgentes(data);
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
    if (puntoPartida.length === 0) return;
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      const agenteSeleccionado = agentes.find(a => a.id === agenteId);
      const agenteNombre = agenteSeleccionado ? agenteSeleccionado.nombre : 'POR ASIGNAR';
      
      await crearOatc(
        cliente?.id || null, 
        cliente?.nombre || 'Público General', 
        agenteId || null, 
        agenteNombre, 
        puntoPartida,
        tipoDemanda
      );
      
      setMessage('¡Atención generada exitosamente!');
      
      // Reset form
      setTimeout(() => {
        setCliente(null);
        setPuntoPartida([]);
        setAgenteId('');
        setMessage('');
        // Here we could trigger a refresh of the queue list (to be implemented later)
      }, 2000);
      
    } catch (err) {
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
        
        {/* Fila 1: Cliente y Catálogo */}
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          
          {/* Cliente */}
          <div className="flex-1">
            <ClientSearch 
              onSelect={setCliente} 
              selectedClientName={cliente?.nombre} 
            />
          </div>

          {/* Botones Catálogo Modal */}
          <div className="w-auto flex flex-col justify-end shrink-0">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Catálogo</label>
            <div className="flex gap-2 h-[42px]">
              <button 
                onClick={() => setModalTipo('servicio')} 
                className="w-12 flex items-center justify-center bg-blue-50 text-blue-700 text-xl border border-blue-200 rounded-lg hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm" 
                title="Agregar Servicio"
              >
                <Scissors className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setModalTipo('producto')} 
                className="w-12 flex items-center justify-center bg-green-50 text-green-700 text-xl border border-green-200 rounded-lg hover:bg-green-600 hover:text-white hover:border-green-600 transition-all shadow-sm" 
                title="Agregar Producto Retail"
              >
                <Beaker className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Punto de Partida */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Punto de Partida (Seleccionados)</label>
          <div className="bg-gray-50 min-h-[60px] border border-gray-200 rounded p-2">
            {puntoPartida.length === 0 ? (
              <div className="text-xs text-gray-400 text-center mt-2">Busca en el catálogo y agrégalos aquí ➔</div>
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
            value={tipoDemanda}
            onChange={(e) => setTipoDemanda(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="cliente">Atención a Cliente</option>
            <option value="turno">Turno</option>
            <option value="apoyo">Apoyo Interno</option>
            <option value="garantia">Garantía / Corrección</option>
          </select>
        </div>

        {/* Asignar Agente */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Asignar a Agente</label>
          <select 
            value={agenteId}
            onChange={(e) => setAgenteId(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg p-2.5 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          >
            <option value="">A Lista de Espera General</option>
            {agentes.filter(a => a.rol === 'STAFF').map(ag => (
              <option key={ag.id} value={ag.id} disabled={ag.estado !== 'DISPONIBLE'}>
                {ag.nombre} ({ag.estado}) {ag.especialidad ? `- ${ag.especialidad}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Botón Generar */}
        <button 
          onClick={handleGenerar} 
          disabled={!cliente || puntoPartida.length === 0 || isSubmitting}
          className={`w-full text-white font-bold rounded-lg text-sm px-4 py-3 shadow-md transition-all ${
            (!cliente || puntoPartida.length === 0 || isSubmitting) ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
          }`}
        >
          {isSubmitting ? 'Procesando...' : 'Generar OATC'}
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
