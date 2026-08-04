'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Users, Calendar, Plus, History, User, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { cambiarEstadoAgente } from '@/services/agentes';
import { obtenerTicketsAsignados, solicitarInicioAtencion, solicitarFinAtencion, solicitarPreCobro } from '@/services/operaciones';
import { buscarClientes, crearCliente, Cliente } from '@/services/clientes';
import { OATC, Agente, obtenerAgentesDisponibles } from '@/services/recepcion';
import { otorgarXP, actualizarStreak, enviarKudos } from '@/lib/gamification/engine';
import { calcularFinCiclo, XP_REWARDS } from '@/lib/gamification/config';

import KudosModal from '@/components/mobile/KudosModal';
import StaffInicioTab from '@/components/mobile/staff/StaffInicioTab';
import StaffTurnoTab from '@/components/mobile/staff/StaffTurnoTab';
import StaffClientesTab from '@/components/mobile/staff/StaffClientesTab';
import StaffAgendaTab from '@/components/mobile/staff/StaffAgendaTab';
import StaffHistoricoView from '@/components/mobile/staff/StaffHistoricoView';
import StaffMetricasView from '@/components/mobile/staff/StaffMetricasView';
import StaffPerfilView from '@/components/mobile/staff/StaffPerfilView';
import StaffColegasModal from '@/components/mobile/staff/StaffColegasModal';

interface OATCExtended extends OATC {
  codigo_ticket?: string;
  monto_total?: number;
}

interface StaffMobileViewProps {
  agente: any;
  sedeId: string;
}

export default function StaffMobileView({ agente, sedeId }: StaffMobileViewProps) {
  const [mainTab, setMainTab] = useState<'inicio' | 'turno' | 'clientes' | 'agenda'>('inicio');
  const [activeSecondaryView, setActiveSecondaryView] = useState<'historico' | 'metricas' | 'perfil' | null>(null);

  const [inicioSubTab, setInicioSubTab] = useState<'alertas' | 'bar'>('alertas');
  const [estadoActual, setEstadoActual] = useState<string>('DISPONIBLE');
  const [isLoading, setIsLoading] = useState(true);
  const [tickets, setTickets] = useState<OATCExtended[]>([]);
  const [colegas, setColegas] = useState<Agente[]>([]);
  
  const [showColegasModal, setShowColegasModal] = useState(false);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState<string>('TODAS');

  const [barOrder, setBarOrder] = useState({ cafe: 0, infusion: 0, agua: 0 });

  const [queryCliente, setQueryCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({ nombre: '', dni: '', celular: '', email: '' });

  const [showAddCitaModal, setShowAddCitaModal] = useState(false);
  const [newCitaForm, setNewCitaForm] = useState({ clienteNombre: '', servicio: 'Colorimetria', fecha: new Date().toISOString().split('T')[0], hora: '09:00' });

  const [isFabOpen, setIsFabOpen] = useState(false);

  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosTargetId, setKudosTargetId] = useState('');
  const [kudosTargetName, setKudosTargetName] = useState('');

  const [fechaDesde, setFechaDesde] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState<string>(new Date().toISOString().split('T')[0]);

  const supabase = createClient();
  const { showAlert } = useUIStore();
  const { profile: gamProfile, loadProfile: loadGamProfile, refreshHallOfFame, hallOfFame, addXP: addXPLocal } = useGamificationStore();

  const cargarDatosMobile = async () => {
    setIsLoading(true);
    if (agente) {
      setEstadoActual(agente.estado || 'DISPONIBLE');
      const allTickets = await obtenerTicketsAsignados('ALL');
      setTickets(allTickets.filter(t => t.agente_id === agente.id));
      await loadGamProfile(agente.id);
      await refreshHallOfFame();
    }
    const listaAgentes = await obtenerAgentesDisponibles();
    setColegas(listaAgentes);
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosMobile();
    const channel = supabase.channel('realtime-mobile-pilot-v2')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatosMobile())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatosMobile())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (queryCliente.trim().length >= 2) {
      buscarClientes(queryCliente).then(res => setClientesEncontrados(res));
    } else {
      setClientesEncontrados([]);
    }
  }, [queryCliente]);

  const handleAlertaRapidaWFM = async (accion: string, nuevoEstado: string) => {
    if (!agente) return;
    try {
      await cambiarEstadoAgente(agente.id, nuevoEstado);
      setEstadoActual(nuevoEstado);
      showAlert(`✅ Registro Automático Exitoso: ${accion} (Sin intermediarios)`, 'success');
      if (nuevoEstado === 'DISPONIBLE' && accion === 'YA LLEGUÉ') {
        await otorgarXP(agente.id, XP_REWARDS.LLEGADA_PUNTUAL, 'LLEGADA_PUNTUAL', { accion });
        await actualizarStreak(agente.id);
        addXPLocal(XP_REWARDS.LLEGADA_PUNTUAL);
        showAlert(`🎮 +${XP_REWARDS.LLEGADA_PUNTUAL} XP • Streak actualizado 🔥`, 'info');
      } else if (accion === 'REGRESÉ') {
        await otorgarXP(agente.id, XP_REWARDS.NFC_CHECKIN, 'REGRESO_PAUSA', { accion });
        addXPLocal(XP_REWARDS.NFC_CHECKIN);
      }
      cargarDatosMobile();
    } catch (err: any) { showAlert(`Error: ${err.message}`, 'error'); }
  };

  const handleNfcTagScan = async () => {
    if (!agente) return;
    let siguienteEstado = estadoActual === 'INACTIVO' ? 'DISPONIBLE' : (estadoActual === 'PAUSA' ? 'DISPONIBLE' : 'PAUSA');
    let mensajeAccion = siguienteEstado === 'PAUSA' ? 'Inicio de Refrigerio' : 'Entrada / Retorno';
    try {
      await cambiarEstadoAgente(agente.id, siguienteEstado);
      setEstadoActual(siguienteEstado);
      showAlert(`🏷️ Tag NFC Detectado: ${mensajeAccion} registrado.`, 'success');
      cargarDatosMobile();
    } catch (err: any) { showAlert(`Error NFC: ${err.message}`, 'error'); }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        ndef.scan().then(() => { ndef.onreading = () => handleNfcTagScan(); }).catch(() => {});
      } catch (err) {}
    }
  }, [agente, estadoActual]);

  const handleEnviarPedidoBar = async () => {
    const totalItems = barOrder.cafe + barOrder.infusion + barOrder.agua;
    if (totalItems === 0) return showAlert('Selecciona al menos 1 bebida', 'warning');
    showAlert(`Pedido de Bar enviado a Recepción (${totalItems} bebidas)`, 'success');
    setBarOrder({ cafe: 0, infusion: 0, agua: 0 });
  };

  const handleCrearCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCitaForm.clienteNombre.trim()) return showAlert('Ingresa el nombre del cliente', 'warning');
    showAlert(`📅 Cita agendada con éxito para ${newCitaForm.clienteNombre} (${newCitaForm.fecha} - ${newCitaForm.hora})`, 'success');
    setShowAddCitaModal(false);
    setNewCitaForm({ clienteNombre: '', servicio: 'Colorimetria', fecha: new Date().toISOString().split('T')[0], hora: '09:00' });
  };

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClienteForm.nombre.trim()) return;
    const res = await crearCliente(newClienteForm);
    if (res) {
      showAlert('Cliente registrado con éxito', 'success');
      setShowAddClienteModal(false);
      setNewClienteForm({ nombre: '', dni: '', celular: '', email: '' });
      setQueryCliente(res.nombre);
    } else {
      showAlert('Error registrando cliente', 'error');
    }
  };

  const ticketActivo = tickets.find(t => t.estado_proceso && ['EN_CURSO', 'PRE_COBRADO', 'ASESORIA'].includes(t.estado_proceso));
  const misColegasEnCola = colegas.filter(c => c.estado !== 'INACTIVO');
  const miPosicionEnCola = agente ? misColegasEnCola.findIndex(c => c.id === agente.id) + 1 : 1;

  const renderSecondaryView = () => {
    if (activeSecondaryView === 'historico') return <StaffHistoricoView onClose={() => setActiveSecondaryView(null)} fechaDesde={fechaDesde} setFechaDesde={setFechaDesde} fechaHasta={fechaHasta} setFechaHasta={setFechaHasta} isLoading={isLoading} onRefresh={cargarDatosMobile} agente={agente} />;
    if (activeSecondaryView === 'metricas') return <StaffMetricasView onClose={() => setActiveSecondaryView(null)} agente={agente} />;
    if (activeSecondaryView === 'perfil') return <StaffPerfilView onClose={() => setActiveSecondaryView(null)} agente={agente} gamProfile={gamProfile} hallOfFame={hallOfFame} setShowKudosModal={setShowKudosModal} setKudosTargetId={setKudosTargetId} setKudosTargetName={setKudosTargetName} />;
    return null;
  };

  const renderMainTab = () => {
    if (activeSecondaryView !== null) return null;
    switch (mainTab) {
      case 'inicio': return <StaffInicioTab hallOfFame={hallOfFame} agente={agente} calcularFinCiclo={calcularFinCiclo} gamProfile={gamProfile} inicioSubTab={inicioSubTab} setInicioSubTab={setInicioSubTab} handleAlertaRapidaWFM={handleAlertaRapidaWFM} handleNfcTagScan={handleNfcTagScan} barOrder={barOrder} setBarOrder={setBarOrder} handleEnviarPedidoBar={handleEnviarPedidoBar} />;
      case 'turno': return <StaffTurnoTab tickets={tickets} isLoading={isLoading} cargarDatosMobile={cargarDatosMobile} estadoActual={estadoActual} miPosicionEnCola={miPosicionEnCola} setShowColegasModal={setShowColegasModal} ticketActivo={ticketActivo} handleSolicitarPreCobro={async (id) => { await solicitarPreCobro(id); showAlert('Pre-cobro solicitado', 'success'); cargarDatosMobile(); }} handleFinalizarAtencion={async () => { if (ticketActivo) { await solicitarFinAtencion(ticketActivo, agente?.rol || 'STAFF'); showAlert('Atención Finalizada', 'success'); cargarDatosMobile(); } }} />;
      case 'clientes': return <StaffClientesTab queryCliente={queryCliente} setQueryCliente={setQueryCliente} clientesEncontrados={clientesEncontrados} showAddClienteModal={showAddClienteModal} setShowAddClienteModal={setShowAddClienteModal} newClienteForm={newClienteForm} setNewClienteForm={setNewClienteForm} handleCrearCliente={handleCrearCliente} />;
      case 'agenda': return <StaffAgendaTab isLoading={isLoading} cargarDatosMobile={cargarDatosMobile} showAddCitaModal={showAddCitaModal} setShowAddCitaModal={setShowAddCitaModal} newCitaForm={newCitaForm} setNewCitaForm={setNewCitaForm} handleCrearCita={handleCrearCita} />;
      default: return null;
    }
  };

  return (
    <>
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {renderSecondaryView()}
        {renderMainTab()}
      </main>

      <AnimatePresence>
        {isFabOpen && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsFabOpen(false)} className="fixed inset-0 z-[45] bg-slate-950/70 backdrop-blur-sm" />}
      </AnimatePresence>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[50] flex flex-col items-center">
        <AnimatePresence>
          {isFabOpen && (
            <motion.div initial={{ opacity: 0, y: 30, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.8 }} className="flex items-end justify-center gap-5 mb-5">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setIsFabOpen(false); setActiveSecondaryView('historico'); }} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-indigo-500/50 text-indigo-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900"><History className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full shadow-lg">Historial</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setIsFabOpen(false); setActiveSecondaryView('metricas'); }} className="flex flex-col items-center gap-1.5 group cursor-pointer -translate-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-purple-500/50 text-purple-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900"><BarChart2 className="w-7 h-7" /></div>
                <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full shadow-lg">Métricas</span>
              </motion.button>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { setIsFabOpen(false); setActiveSecondaryView('perfil'); }} className="flex flex-col items-center gap-1.5 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-pink-500/50 text-pink-400 shadow-2xl flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900"><User className="w-6 h-6" /></div>
                <span className="text-[10px] font-black text-slate-100 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full shadow-lg">Perfil</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button onClick={() => setIsFabOpen(!isFabOpen)} animate={{ rotate: isFabOpen ? 135 : 0 }} transition={{ duration: 0.3, ease: 'backOut' }} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white font-black flex items-center justify-center shadow-2xl shadow-purple-500/50 border-2 border-slate-950 cursor-pointer">
          <Plus className="w-7 h-7" />
        </motion.button>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-800/80 px-4 py-2 flex justify-around items-center max-w-md mx-auto shadow-2xl">
        <button onClick={() => { setActiveSecondaryView(null); setMainTab('inicio'); }} className={`flex flex-col items-center gap-1 transition-all ${mainTab === 'inicio' && !activeSecondaryView ? 'text-red-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'}`}><Bell className="w-5 h-5" /><span className="text-[10px]">Inicio</span></button>
        <button onClick={() => { setActiveSecondaryView(null); setMainTab('turno'); }} className={`flex flex-col items-center gap-1 transition-all ${mainTab === 'turno' && !activeSecondaryView ? 'text-amber-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'}`}><Zap className="w-5 h-5" /><span className="text-[10px]">Turno</span></button>
        <div className="w-8"></div>
        <button onClick={() => { setActiveSecondaryView(null); setMainTab('clientes'); }} className={`flex flex-col items-center gap-1 transition-all ${mainTab === 'clientes' && !activeSecondaryView ? 'text-emerald-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'}`}><Users className="w-5 h-5" /><span className="text-[10px]">Clientes</span></button>
        <button onClick={() => { setActiveSecondaryView(null); setMainTab('agenda'); }} className={`flex flex-col items-center gap-1 transition-all ${mainTab === 'agenda' && !activeSecondaryView ? 'text-purple-400 font-bold scale-105' : 'text-slate-500 hover:text-slate-300'}`}><Calendar className="w-5 h-5" /><span className="text-[10px]">Agenda</span></button>
      </nav>

      {showColegasModal && <StaffColegasModal isOpen={showColegasModal} onClose={() => setShowColegasModal(false)} filtroEspecialidad={filtroEspecialidad} setFiltroEspecialidad={setFiltroEspecialidad} colegas={colegas} agenteId={agente?.id} />}
      
      <KudosModal isOpen={showKudosModal} onClose={() => setShowKudosModal(false)} receiverId={kudosTargetId} receiverName={kudosTargetName} onSend={async (tipo: string, mensaje: string) => { if (!agente?.id) return; const ok = await enviarKudos(agente.id, kudosTargetId, tipo, mensaje); if (ok) { showAlert(`✨ Kudos "${tipo}" enviado a ${kudosTargetName}`, 'success'); addXPLocal(XP_REWARDS.KUDOS_ENVIADO); } setShowKudosModal(false); }} />
    </>
  );
}
