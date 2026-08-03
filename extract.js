const fs = require('fs');

const pageContent = fs.readFileSync('src/app/mobile/page.tsx', 'utf8');

// The original imports in page.tsx:
const importsToKeepForStaff = `
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Coffee, Zap, Users, Calendar, Plus, RefreshCw, 
  Search, History, User, Sun, Edit3, Users2,
  Award, X, BarChart2, UserPlus, CalendarPlus, Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useUIStore } from '@/store/useUIStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import { cambiarEstadoAgente } from '@/services/agentes';
import { obtenerTicketsAsignados, solicitarInicioAtencion, solicitarFinAtencion, solicitarPreCobro } from '@/services/operaciones';
import { buscarClientes, crearCliente, Cliente } from '@/services/clientes';
import { OATC, Agente, obtenerAgentesDisponibles } from '@/services/recepcion';
import { otorgarXP, actualizarStreak, enviarKudos } from '@/lib/gamification/engine';
import { calcularFinCiclo, BADGE_CATALOG, KUDOS_CATALOG, XP_REWARDS, getNivelPorXP } from '@/lib/gamification/config';

import StreakCounter from '@/components/mobile/StreakCounter';
import HallOfFameBanner from '@/components/mobile/HallOfFameBanner';
import BadgeCollection from '@/components/mobile/BadgeCollection';
import KudosModal from '@/components/mobile/KudosModal';

interface OATCExtended extends OATC {
  codigo_ticket?: string;
  monto_total?: number;
}

interface StaffMobileViewProps {
  agente: any;
  sedeId: string;
}
`;

const staffHeader = `
export default function StaffMobileView({ agente, sedeId }: StaffMobileViewProps) {
`;

// Extract states from the page.tsx Component body
const stateMatches = pageContent.match(/\/\/ Tabs Principales[\s\S]*?const router = useRouter\(\);/);
let states = stateMatches ? stateMatches[0].replace('const router = useRouter();', '') : '';

// Replace some hooks that we handle differently in Staff
states = states.replace('const supabase = createClient();', `const supabase = createClient();
  const { showAlert } = useUIStore();
  const { profile: gamProfile, loadProfile: loadGamProfile, refreshHallOfFame, hallOfFame, addXP: addXPLocal } = useGamificationStore();
`);

states = states.replace(/const \{ showAlert \} = useUIStore\(\);\s*const sedeActiva = useAppStore[^\n]*\n\s*const \{ profile: gamProfile[^\n]*/, '');

const funcsMatch = pageContent.match(/const cargarDatosMobile = async \(\) => \{[\s\S]*?const colegasFiltrados = colegas\.filter[^\}]*\}\);/);
let funcs = funcsMatch ? funcsMatch[0] : '';
// Fix cargarDatosMobile to use props.agente
funcs = funcs.replace(/const \{ data: \{ user \} \} = await supabase\.auth\.getUser\(\);[\s\S]*?if \(agenteData\) \{/, 'if (agente) {\n      const agenteData = agente;');

const renderMatch = pageContent.match(/\{\/\* 📱 Main Body Content \*\/\}([\s\S]*?)<\/div>\n\s*\);\n\}/);
let renderBody = renderMatch ? renderMatch[1] : '';

// Render body contains:
// {(!agente?.rol || agente.rol === 'STAFF') && (
//   <main ...
//
// We need to extract the inside of that condition for the main content, plus the FAB and Nav and Modals which are outside.
renderBody = renderBody.replace(/\{\(!agente\?\.rol \|\| agente\.rol === 'STAFF'\) && \(\s*<main/, '<main');
renderBody = renderBody.replace(/<\/main>\n\s*\)\}/, '</main>');

const fullStaff = `${importsToKeepForStaff}
${staffHeader}
${states}
${funcs}

  return (
    <>
      ${renderBody}
    </>
  );
}
`;

fs.writeFileSync('src/components/mobile/StaffMobileView.tsx', fullStaff);

const pageReplacement = `'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { useGamificationStore } from '@/store/useGamificationStore';
import GamificationHeader from '@/components/mobile/GamificationHeader';
import CajaMobileView from '@/components/mobile/CajaMobileView';
import RecepcionMobileView from '@/components/mobile/RecepcionMobileView';
import DespachoMobileView from '@/components/mobile/DespachoMobileView';
import AdminMobileView from '@/components/mobile/AdminMobileView';
import StaffMobileView from '@/components/mobile/StaffMobileView';

export default function DedicatedMobileViewPage() {
  const [agente, setAgente] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const { profile: gamProfile, loadProfile: loadGamProfile } = useGamificationStore();

  const cargarDatosAgente = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || !user.email) {
      router.push('/login');
      return;
    }

    const { data: agenteData } = await supabase
      .from('agentes')
      .select('*')
      .ilike('email', user.email.trim())
      .single();

    if (agenteData) {
      setAgente(agenteData);
      await loadGamProfile(agenteData.id);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    cargarDatosAgente();

    const channel = supabase.channel('realtime-mobile-agente')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agentes' }, () => cargarDatosAgente())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Cargando...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-28 select-none font-sans">
      <GamificationHeader
        agente={agente}
        profile={gamProfile ? {
          xp_total: gamProfile.xp_total,
          nivel: gamProfile.nivel,
          titulo: gamProfile.titulo,
          streak_asistencia: gamProfile.streak_asistencia,
          monedas: gamProfile.monedas
        } : { xp_total: 0, nivel: 1, titulo: 'Novato', streak_asistencia: 0, monedas: 0 }}
        sedeNombre={sedeActiva?.nombre || 'Sede'}
      />

      <div className="fixed top-3 right-3 z-50">
        <button 
          onClick={async () => {
            await supabase.auth.signOut();
            router.push('/login');
          }}
          className="px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold text-[10px] active:scale-95 transition-all backdrop-blur-xl"
        >
          Salir
        </button>
      </div>

      {(!agente?.rol || agente?.rol === 'STAFF') ? (
        <StaffMobileView agente={agente} sedeId={sedeActiva?.id || ''} />
      ) : (
        <main className="flex-1 p-4 max-w-md mx-auto w-full">
          {agente.rol === 'CAJA' && <CajaMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {agente.rol === 'RECEPCION' && <RecepcionMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {agente.rol === 'DESPACHO' && <DespachoMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
          {(agente.rol === 'ADMIN' || agente.rol === 'SUPERADMIN') && <AdminMobileView agente={agente} sedeId={sedeActiva?.id || ''} />}
        </main>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/app/mobile/page.tsx', pageReplacement);

console.log("Extraction complete.");
