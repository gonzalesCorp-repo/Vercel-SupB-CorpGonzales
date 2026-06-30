'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, DollarSign, Calendar, Settings, Edit2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useUIStore } from '@/store/useUIStore';

const supabase = createClient();

interface AgentProd {
  agente_id: string;
  nombre: string;
  total_servicios: number;
  total_recaudado: number;
  comision_estimada: number;
}

export default function AdminProductividadPage() {
  const [productividad, setProductividad] = useState<AgentProd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filtros
  const [fechaInicio, setFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split('T')[0]);

  // Modal Comisiones
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [agentesList, setAgentesList] = useState<{id: string, nombre: string}[]>([]);
  const [bienesList, setBienesList] = useState<{id: string, nombre: string, comision_porcentaje: number}[]>([]);
  const [selectedAgente, setSelectedAgente] = useState('');
  const [selectedBien, setSelectedBien] = useState('');
  const [comisionValue, setComisionValue] = useState('');
  const [excepciones, setExcepciones] = useState<any[]>([]);

  const { sedeActiva } = useAppStore();
  const { showAlert } = useUIStore();

  useEffect(() => {
    if (sedeActiva) {
      loadData();
    }
  }, [sedeActiva, fechaInicio, fechaFin]);

  const loadData = async () => {
    setIsLoading(true);
    
    // 1. Cargar OATCs para Productividad
    let query = supabase
      .from('oatc')
      .select('*')
      .eq('sede_id', sedeActiva!.id)
      .eq('estado_proceso', 'FINALIZADO');
      
    if (fechaInicio) query = query.gte('created_at', `${fechaInicio}T00:00:00.000Z`);
    if (fechaFin) query = query.lte('created_at', `${fechaFin}T23:59:59.999Z`);

    const { data: oatcs } = await query;

    if (oatcs) {
      const prodMap = new Map<string, AgentProd>();
      
      oatcs.forEach(oatc => {
        if (!oatc.agente_id) return;
        
        if (!prodMap.has(oatc.agente_id)) {
          prodMap.set(oatc.agente_id, {
            agente_id: oatc.agente_id,
            nombre: oatc.agente_nombre || 'Desconocido',
            total_servicios: 0,
            total_recaudado: 0,
            comision_estimada: 0
          });
        }
        
        const current = prodMap.get(oatc.agente_id)!;
        
        const items = Array.isArray(oatc.punto_partida) ? oatc.punto_partida : [];
        items.forEach(item => {
          const precio = Number(item.precio) || Number(item.precio_venta) || 0;
          const cantidad = Number(item.cantidad) || 1;
          const subtotalItem = precio * cantidad;
          // La magia del congelamiento: toma la comisión del JSON
          const comisionPorc = Number(item.comision_porcentaje) || 0; 

          current.total_servicios += cantidad;
          current.total_recaudado += subtotalItem;
          current.comision_estimada += subtotalItem * (comisionPorc / 100);
        });
      });

      const ranking = Array.from(prodMap.values()).sort((a, b) => b.total_recaudado - a.total_recaudado);
      setProductividad(ranking);
    }
    setIsLoading(false);
  };

  const openConfigModal = async () => {
    setShowConfigModal(true);
    const { data: agData } = await supabase.from('agentes').select('id, nombre');
    if (agData) setAgentesList(agData);

    const { data: bData } = await supabase.from('bienes').select('id, nombre, comision_porcentaje');
    if (bData) setBienesList(bData);
    
    loadExcepciones();
  };

  const loadExcepciones = async () => {
    const { data } = await supabase
      .from('agentes_comisiones')
      .select('id, comision_porcentaje, agentes(nombre), bienes(nombre)');
    if (data) setExcepciones(data);
  };

  const handleSaveComision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgente || !selectedBien || !comisionValue) return;

    // Usar upsert para la restricción UNIQUE(agente_id, bien_id)
    const { error } = await supabase.from('agentes_comisiones').upsert({
      agente_id: selectedAgente,
      bien_id: selectedBien,
      comision_porcentaje: Number(comisionValue)
    }, { onConflict: 'agente_id,bien_id' });

    if (error) {
      showAlert('Error al guardar comisión: ' + error.message, 'error');
    } else {
      showAlert('Comisión (Excepción) guardada', 'success');
      setComisionValue('');
      loadExcepciones();
    }
  };

  const handleDeleteExcepcion = async (id: string) => {
    await supabase.from('agentes_comisiones').delete().eq('id', id);
    loadExcepciones();
  };

  const totalRecaudacion = productividad.reduce((sum, p) => sum + p.total_recaudado, 0);

  return (
    <div className="p-4 md:p-8 h-full bg-slate-50/50 min-h-[calc(100vh-4rem)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600 bg-indigo-100 rounded-lg p-1" />
            Productividad (Histórica)
          </h1>
          <p className="text-slate-500 mt-2">Métricas globales y configuración de comisiones.</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm outline-none font-bold text-slate-700" />
          <span className="text-slate-400 font-bold">-</span>
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} className="border border-slate-200 rounded-lg p-2 text-sm outline-none font-bold text-slate-700" />
          
          <button onClick={openConfigModal} className="bg-slate-800 hover:bg-slate-900 text-white p-2 rounded-lg transition-colors ml-2" title="Configurar Comisiones">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Recaudación Total</p>
            <p className="text-3xl font-black text-slate-800">S/ {totalRecaudacion.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Agentes Participantes</p>
            <p className="text-3xl font-black text-slate-800">{productividad.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 uppercase">Top Agente</p>
            <p className="text-xl font-bold text-slate-800 truncate">{productividad[0]?.nombre || '-'}</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Ranking del Período Seleccionado</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold border-b border-slate-200">Operativo / Agente</th>
                <th className="p-4 font-bold border-b border-slate-200 text-center">Servicios</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Recaudado</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right">Participación</th>
                <th className="p-4 font-bold border-b border-slate-200 text-right text-emerald-600">Comisiones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Calculando...</td></tr>
              ) : productividad.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No hay atenciones finalizadas en este periodo.</td></tr>
              ) : (
                productividad.map((agente, idx) => {
                  const participacion = totalRecaudacion > 0 ? (agente.total_recaudado / totalRecaudacion) * 100 : 0;
                  return (
                    <tr key={agente.agente_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <span className={`font-black text-lg w-6 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-800">{agente.nombre}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600">
                        {agente.total_servicios}
                      </td>
                      <td className="p-4 text-right font-black text-slate-800">
                        S/ {agente.total_recaudado.toFixed(2)}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-sm font-bold text-slate-500">{participacion.toFixed(1)}%</span>
                          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${participacion}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-600">
                        S/ {agente.comision_estimada.toFixed(2)}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Configuración de Comisiones */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2"><Settings /> Configurar Comisiones Especiales</h3>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-300 hover:text-white font-bold">X</button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-sm text-slate-600 mb-6">
                Crea excepciones por operativo. Si un operativo no tiene excepción aquí, cobrará el porcentaje por defecto configurado en el catálogo.
              </p>

              <form onSubmit={handleSaveComision} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-end gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Agente / Operativo</label>
                  <select required value={selectedAgente} onChange={e => setSelectedAgente(e.target.value)} className="w-full border border-slate-200 p-2 rounded-lg outline-none text-sm font-medium">
                    <option value="">Seleccione...</option>
                    {agentesList.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Servicio</label>
                  <select required value={selectedBien} onChange={e => setSelectedBien(e.target.value)} className="w-full border border-slate-200 p-2 rounded-lg outline-none text-sm font-medium">
                    <option value="">Seleccione...</option>
                    {bienesList.map(b => <option key={b.id} value={b.id}>{b.nombre} (Base: {b.comision_porcentaje}%)</option>)}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Comisión (%)</label>
                  <input type="number" required step="0.1" value={comisionValue} onChange={e => setComisionValue(e.target.value)} placeholder="Ej. 60" className="w-full border border-slate-200 p-2 rounded-lg outline-none text-sm font-bold text-indigo-600" />
                </div>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors h-[38px]">
                  Guardar
                </button>
              </form>

              <h4 className="font-bold text-slate-800 mb-3">Excepciones Activas</h4>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3 font-bold">Operativo</th>
                      <th className="p-3 font-bold">Servicio</th>
                      <th className="p-3 font-bold text-right">Comisión Única</th>
                      <th className="p-3 font-bold text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {excepciones.length === 0 ? (
                      <tr><td colSpan={4} className="p-4 text-center text-slate-400">No hay excepciones configuradas.</td></tr>
                    ) : (
                      excepciones.map(exc => (
                        <tr key={exc.id}>
                          <td className="p-3 font-medium text-slate-800">{exc.agentes?.nombre}</td>
                          <td className="p-3 text-slate-600">{exc.bienes?.nombre}</td>
                          <td className="p-3 font-black text-indigo-600 text-right">{exc.comision_porcentaje}%</td>
                          <td className="p-3 text-center">
                            <button onClick={() => handleDeleteExcepcion(exc.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs">Eliminar</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
