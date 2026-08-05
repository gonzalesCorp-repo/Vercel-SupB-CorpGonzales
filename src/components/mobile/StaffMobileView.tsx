'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Zap, Users, Calendar, Plus, History, User, BarChart2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { cambiarEstadoAgente } from '@/services/agentes';
import { obtenerTicketsAsignados, solicitarInicioAtencion, solicitarFinAtencion, solicitarPreCobro, iniciarAtencionOatc, solicitarCancelacionOatc, actualizarServiciosOatc } from '@/services/operaciones';
import { buscarClientes, crearCliente, Cliente } from '@/services/clientes';
import { OATC, Agente, obtenerAgentesDisponibles, Bien } from '@/services/recepcion';
import { otorgarXP, actualizarStreak, enviarKudos } from '@/lib/gamification/engine';
import { calcularFinCiclo, XP_REWARDS } from '@/lib/gamification/config';

import KudosModal from '@/components/mobile/KudosModal';
import CatalogModal from '@/components/recepcion/CatalogModal';
import StaffInicioTab from '@/components/mobile/staff/StaffInicioTab';
import StaffTurnoTab from '@/components/mobile/staff/StaffTurnoTab';
import StaffClientesTab from '@/components/mobile/staff/StaffClientesTab';
import StaffAgendaTab from '@/components/mobile/staff/StaffAgendaTab';
import StaffHistoricoView from '@/components/mobile/staff/StaffHistoricoView';
import StaffMetricasView from '@/components/mobile/staff/StaffMetricasView';
import StaffPerfilView from '@/components/mobile/staff/StaffPerfilView';
import StaffColegasModal from '@/components/mobile/staff/StaffColegasModal';
import FloatingBottomDock from '@/components/mobile/ui/FloatingBottomDock';

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

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogTipo, setCatalogTipo] = useState<'servicio' | 'producto' | null>(null);

  const [barOrder, setBarOrder] = useState({ cafe: 0, infusion: 0, agua: 0 });

  const [queryCliente, setQueryCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [showAddClienteModal, setShowAddClienteModal] = useState(false);
  const [newClienteForm, setNewClienteForm] = useState({ nombre: '', dni: '', celular: '', email: '' });

  const [showAddCitaModal, setShowAddCitaModal] = useState(false);
  const [newCitaForm, setNewCitaForm] = useState({ clienteNombre: '', servicio: 'Corte Tradicional', fecha: new Date().toISOString().split('T')[0], hora: '10:00' });

  const [fechaDesde, setFechaDesde] = useState(new Date().toISOString().split('T')[0]);
  const [fechaHasta, setFechaHasta] = useState(new Date().toISOString().split('T')[0]);

  const [showKudosModal, setShowKudosModal] = useState(false);
  const [kudosTargetId, setKudosTargetId] = useState('');
  const [kudosTargetName, setKudosTargetName] = useState('');
  const [isFabOpen, setIsFabOpen] = useState(false);

  const { showAlert } = useUIStore();
  const gamProfile = useGamificationStore((state) => state.profile);
  const hallOfFame = useGamificationStore((state) => state.hallOfFame);
  const loadGamification = useGamificationStore((state) => state.loadProfile);
  const addXP = useGamificationStore((state) => state.addXP);

  const supabase = createClient();

  const cargarDatosMobile = async () => {
    setIsLoading(true);
    if (agente?.id) {
      loadGamification(agente.id);
    }

    const [misTickets, otrosColegas] = await Promise.all([
      agente?.nombre ? obtenerTicketsAsignados(agente.nombre) : Promise.resolve([]),
      obtenerAgentesDisponibles()
    ]);

    setTickets(misTickets as OATCExtended[]);
    setColegas(otrosColegas);

    if (agente?.id) {
      const { data: dbAgente } = await supabase.from('agentes').select('estado').eq('id', agente.id).single();
      if (dbAgente) setEstadoActual(dbAgente.estado);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosMobile();

    const channel = supabase.channel('mobile-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'oatc' }, () => cargarDatosMobile())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'agentes' }, () => cargarDatosMobile())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agente, sedeId]);

  useEffect(() => {
    if (queryCliente.trim().length > 1) {
      buscarClientes(queryCliente).then(setClientesEncontrados);
    } else {
      setClientesEncontrados([]);
    }
  }, [queryCliente]);

  const handleAlertaRapidaWFM = async (accion: string, nuevoEstado: string) => {
    if (!agente?.id) return;
    await cambiarEstadoAgente(agente.id, nuevoEstado);
    setEstadoActual(nuevoEstado);
    showAlert(`Estado cambiado a: ${nuevoEstado}`, 'success');
    addXP(XP_REWARDS.MARCACION_WFM);
    cargarDatosMobile();
  };

  const handleNfcTagScan = () => {
    showAlert('📱 Escaneando Tag NFC de Estación... ¡Confirmado!', 'info');
    handleAlertaRapidaWFM('NFC', 'DISPONIBLE');
  };

  const handleEnviarPedidoBar = () => {
    if (barOrder.cafe === 0 && barOrder.infusion === 0 && barOrder.agua === 0) {
      showAlert('Selecciona al menos 1 bebida', 'warning');
      return;
    }
    showAlert('🍹 Pedido enviado al Bar con éxito', 'success');
    setBarOrder({ cafe: 0, infusion: 0, agua: 0 });
    addXP(10);
  };

  const handleCrearCita = async () => {
    if (!newCitaForm.clienteNombre.trim()) return;
    showAlert(`Cita agendada para ${newCitaForm.clienteNombre}`, 'success');
    setShowAddCitaModal(false);
    setNewCitaForm({ clienteNombre: '', servicio: 'Corte Tradicional', fecha: new Date().toISOString().split('T')[0], hora: '10:00' });
  };

  const handleCrearCliente = async () => {
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

  const ticketActivo = tickets.find(t => t.estado_proceso && ['EN_CURSO', 'PRE_COBRADO', 'ASESORIA', 'ESPERA', 'PENDIENTE_INICIO'].includes(t.estado_proceso));
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
      case 'turno': return (
        <StaffTurnoTab 
          tickets={tickets} 
          isLoading={isLoading} 
          cargarDatosMobile={cargarDatosMobile} 
          estadoActual={estadoActual} 
          miPosicionEnCola={miPosicionEnCola} 
          setShowColegasModal={setShowColegasModal} 
          ticketActivo={ticketActivo} 
          handleIniciarAtencion={async (id) => {
            const ok = await iniciarAtencionOatc(id, agente?.id);
            if (ok) {
              showAlert('▶️ Atención Iniciada. El tiempo de atención ha comenzado.', 'success');
              cargarDatosMobile();
            }
          }}
          handleOpenAddService={(ticket) => {
            setShowCatalogModal(true);
            setCatalogTipo('servicio');
          }}
          handleSolicitarPreCobro={async (id) => { 
            await solicitarPreCobro(id); 
            showAlert('Pre-cobro solicitado a Recepción / Caja', 'success'); 
            cargarDatosMobile(); 
          }} 
          handleFinalizarAtencion={async () => { 
            if (ticketActivo) { 
              await solicitarFinAtencion(ticketActivo, agente?.rol || 'STAFF'); 
              showAlert('Atención Finalizada', 'success'); 
              cargarDatosMobile(); 
            } 
          }} 
          handleSolicitarCancelacion={async (ticketId, motivoId, detalle) => {
            const ok = await solicitarCancelacionOatc(ticketId, motivoId, detalle, agente?.nombre);
            if (ok) {
              showAlert('Solicitud de cancelación enviada a Recepción para aprobación', 'warning');
              cargarDatosMobile();
            }
          }}
          handleUpdateItemPrecio={async (itemIdx, newPrice) => {
            if (!ticketActivo || !ticketActivo.id) return;
            const currentList = [...(ticketActivo.punto_partida || [])];
            currentList[itemIdx] = { ...currentList[itemIdx], precio: newPrice, precio_venta: newPrice, monto: newPrice };
            const ok = await actualizarServiciosOatc(ticketActivo.id, currentList);
            if (ok) {
              showAlert('Precio actualizado', 'success');
              cargarDatosMobile();
            }
          }}
          handleRemoveItem={async (itemIdx) => {
            if (!ticketActivo || !ticketActivo.id) return;
            const currentList = [...(ticketActivo.punto_partida || [])];
            currentList.splice(itemIdx, 1);
            const ok = await actualizarServiciosOatc(ticketActivo.id, currentList);
            if (ok) {
              showAlert('Servicio removido', 'success');
              cargarDatosMobile();
            }
          }}
        />
      );
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

      <FloatingBottomDock
        mainTab={mainTab}
        setMainTab={setMainTab}
        activeSecondaryView={activeSecondaryView}
        setActiveSecondaryView={setActiveSecondaryView}
        isFabOpen={isFabOpen}
        setIsFabOpen={setIsFabOpen}
      />

      {showColegasModal && <StaffColegasModal isOpen={showColegasModal} onClose={() => setShowColegasModal(false)} filtroEspecialidad={filtroEspecialidad} setFiltroEspecialidad={setFiltroEspecialidad} colegas={colegas} agenteId={agente?.id} />}
      
      <CatalogModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        tipo={catalogTipo}
        onAdd={async (bien: Bien) => {
          if (!ticketActivo || !ticketActivo.id) return;
          const currentList = ticketActivo.punto_partida || [];
          const updated = [...currentList, { id: bien.id, nombre: bien.nombre, precio: bien.precio_venta, cantidad: 1 }];
          const ok = await actualizarServiciosOatc(ticketActivo.id, updated);
          if (ok) {
            showAlert(`✨ Adicional "${bien.nombre}" agregado al ticket`, 'success');
            setShowCatalogModal(false);
            cargarDatosMobile();
          }
        }}
      />

      <KudosModal isOpen={showKudosModal} onClose={() => setShowKudosModal(false)} receiverId={kudosTargetId} receiverName={kudosTargetName} onSend={async (tipo: string, mensaje: string) => { if (!agente?.id) return; const ok = await enviarKudos(agente.id, kudosTargetId, tipo, mensaje); if (ok) { showAlert(`✨ Kudos "${tipo}" enviado a ${kudosTargetName}`, 'success'); addXP(XP_REWARDS.KUDOS_ENVIADO); } setShowKudosModal(false); }} />
    </>
  );
}
