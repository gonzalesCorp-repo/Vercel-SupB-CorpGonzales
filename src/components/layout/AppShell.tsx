'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, LogOut, LayoutDashboard, Inbox, UserCircle, Briefcase, FileText, 
  Beaker, Truck, Settings, Activity, Shield, MapPin, ChevronDown, 
  User, PackageSearch, ArrowRightLeft, Layers, Download, BarChart3, 
  Database, Sliders, Calculator, Zap, Calendar, Users, Award, Sparkles, Landmark,
  Scissors, ShieldCheck
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { NotificationTicker } from './NotificationTicker';
import { LiveFeedDrawer } from './LiveFeedDrawer';
import { registrarLog } from '@/services/logger';
import { GlobalUI } from '@/components/ui/GlobalUI';
import { useThemeStore } from '@/store/useThemeStore';
import { obtenerHerramientasAgente, CATALOGO_HERRAMIENTAS, HerramientaDefinicion } from '@/services/permisos';
import { obtenerConfiguracionSede } from '@/services/sedesConfig';
import { IncidenciasGlobalBell } from './IncidenciasGlobalBell';

const ICON_MAP: Record<string, any> = {
  Inbox,
  CreditCard: Briefcase,
  Beaker,
  Calendar,
  Users,
  FileText,
  Calculator,
  BarChart3,
  PackageSearch,
  Layers,
  Activity,
  Award,
  Sliders,
  Settings,
  Shield,
  Database,
  Sparkles,
  Landmark,
  Scissors,
  ShieldCheck
};

const NavItem = ({ href, icon: Icon, label, disabled = false, pathname, isExpanded, badge }: any) => {
  const isActive = (pathname.startsWith(href) && href !== '/') || (href === '/' && pathname === '/');
  return (
    <li>
      <Link 
        href={disabled ? '#' : href} 
        className={`relative flex items-center p-3 rounded-2xl transition-all duration-300 group ${
          isActive 
            ? 'bg-slate-800/80 shadow-xs' 
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={isActive ? { 
          color: 'var(--active-theme-accent, #4f46e5)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)'
        } : {}}
      >
        {isActive && (
          <motion.div 
            layoutId="activeNavIndicator" 
            className="absolute left-0 w-1 h-8 rounded-r-full shadow-sm"
            style={{ backgroundColor: 'var(--active-theme-accent, #4f46e5)' }}
          />
        )}
        {Icon && <Icon className="w-5 h-5 shrink-0 transition-colors" style={isActive ? { color: 'var(--active-theme-accent, #4f46e5)' } : {}} />}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              className="flex items-center justify-between flex-1 overflow-hidden"
            >
              <span className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                {label}
              </span>
              {badge && (
                <span 
                  className="ml-auto text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 shadow-xs shrink-0"
                >
                  {badge}
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Link>
    </li>
  );
};

const NavSection = ({ title, children, isExpanded, icon: SectionIcon }: any) => (
  <div className="mb-5">
    <AnimatePresence>
      {isExpanded && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 mb-2 flex items-center gap-1.5"
        >
          {SectionIcon && <SectionIcon className="w-3 h-3 text-gray-400" />}
          <span className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
        </motion.div>
      )}
    </AnimatePresence>
    <ul className="space-y-1 px-2">
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isExpanded } as any);
        }
        return child;
      })}
    </ul>
  </div>
);

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userEmail, setUserEmailLocal] = useState<string>('Cargando...');
  const [agenteId, setAgenteId] = useState<string | null>(null);
  const [herramientasPermitidas, setHerramientasPermitidas] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const sedeActiva = useAppStore((state) => state.sedeActiva);
  const setSedeActiva = useAppStore((state) => state.setSedeActiva);
  const clearSede = useAppStore((state) => state.clearSede);
  const userRol = useAppStore((state) => state.userRol);
  const setUserRol = useAppStore((state) => state.setUserRol);
  const setUserEmail = useAppStore((state) => state.setUserEmail);
  const { themeMode } = useThemeStore();
  
  const [misSedes, setMisSedes] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [showSedesDropdown, setShowSedesDropdown] = useState(false);
  const [pluginLuminaHqActivo, setPluginLuminaHqActivo] = useState(false);
  const [isLiveFeedDrawerOpen, setIsLiveFeedDrawerOpen] = useState(false);

  useEffect(() => {
    const cargarToggles = async () => {
      const toggles = await obtenerConfiguracionSede();
      setPluginLuminaHqActivo(!!toggles.pluginLuminaHqActivo);
    };
    cargarToggles();
  }, [sedeActiva?.id]);

  useEffect(() => {
    const fetchUserAndSedes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmailLocal(user.email);
        setUserEmail(user.email);
        
        const { data: agente, error: errAgente } = await supabase
          .from('agentes')
          .select('id, rol')
          .ilike('email', user.email.trim())
          .maybeSingle();
        
        if (errAgente) console.error('Error fetching agente:', errAgente);

        if (agente && agente.rol) {
          // Normalizar rol si contiene legado
          let rolNormalizado = agente.rol.toUpperCase();
          if (['RECEPCION', 'CAJA', 'DESPACHO'].includes(rolNormalizado)) {
            rolNormalizado = 'SOPORTE';
          }
          setUserRol(rolNormalizado);
          setAgenteId(agente.id);

          // Cargar herramientas delegadas
          const keys = await obtenerHerramientasAgente(agente.id);
          setHerramientasPermitidas(keys);
        } else {
          setUserRol(null);
        }
        
        // Cargar sedes permitidas
        const sedes = await obtenerSedesUsuario(user.email);
        setMisSedes(sedes);
        
        if (sedes.length > 0) {
          const SedeActualValida = useAppStore.getState().sedeActiva;
          if (!SedeActualValida || !sedes.some(s => s.id === SedeActualValida.id)) {
            setSedeActiva(sedes[0]);
          }
        }
      }
      setLoadingSedes(false);
    };
    fetchUserAndSedes();
  }, [userEmail]);
  
  const esSuperAdmin = userRol === 'SUPERADMIN';
  const esAdmin = userRol === 'ADMIN' || esSuperAdmin;
  const esJefeOperativo = userRol === 'JEFE_OPERATIVO' || userRol === 'JEFE_OPERACIONES' || userRol === 'SUPERVISOR';
  const esSoporte = userRol === 'SOPORTE';

  // Guardia de Seguridad: STAFF no tiene acceso a vistas de escritorio (Recepción, Caja, Admin, etc.)
  useEffect(() => {
    if (userRol === 'STAFF' && !pathname.startsWith('/mobile') && !pathname.startsWith('/kiosk')) {
      router.replace('/mobile/operacion');
    }
  }, [userRol, pathname, router]);

  const handleLogout = async () => {
    await registrarLog('AUTH', 'Cierre de sesión');
    clearSede();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isExpanded = mobileMenuOpen || isHovered;

  if (pathname.startsWith('/mobile') || pathname.startsWith('/kiosk')) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <GlobalUI />
        {children}
      </div>
    );
  }

  // Filtrar herramientas habilitadas sin duplicar
  const herramientasHabilitadasObj = CATALOGO_HERRAMIENTAS.filter(h => 
    herramientasPermitidas.includes(h.key)
  );

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
      <GlobalUI />
      
      {/* Live Feed Drawer Deslizable */}
      <LiveFeedDrawer 
        isOpen={isLiveFeedDrawerOpen} 
        onClose={() => setIsLiveFeedDrawerOpen(false)} 
        sedeId={sedeActiva?.id || null} 
      />
      
      {/* Floating Glass Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 mx-4 mt-4 lg:ml-24 lg:mr-4 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl transition-all duration-300">
        <div className="h-full px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
              className="lg:hidden p-2 text-gray-500 rounded-xl hover:bg-gray-100/50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <NotificationTicker onOpenDrawer={() => setIsLiveFeedDrawerOpen(true)} />
          </div>

          <div className="flex items-center gap-4">
            {/* Sede Selector */}
            {sedeActiva && misSedes.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSedesDropdown(!showSedesDropdown)}
                  className="flex items-center gap-2 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-gray-100/50 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
                >
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  {sedeActiva.nombre}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>
                
                <AnimatePresence>
                  {showSedesDropdown && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-56 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-slate-700 overflow-hidden z-50 p-2"
                    >
                      {misSedes.map(sede => (
                        <button
                          key={sede.id}
                          onClick={() => { setSedeActiva(sede); setShowSedesDropdown(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors flex items-center gap-2 ${sede.id === sedeActiva.id ? 'bg-indigo-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100/50'}`}
                        >
                          {sede.id === sedeActiva.id && <motion.div layoutId="activeSede" className="w-1.5 h-1.5 bg-white rounded-full" />}
                          {sede.nombre}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Buzón de Incidencias Operativas Global */}
            <IncidenciasGlobalBell />
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200/50 dark:border-slate-800">
              <div 
                className="w-8 h-8 rounded-full p-[2px] transition-all shadow-sm"
                style={{ background: 'linear-gradient(135deg, var(--active-theme-primary, #4f46e5), var(--active-theme-accent, #ec4899))' }}
              >
                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5" style={{ color: 'var(--active-theme-accent, #4f46e5)' }} />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 dark:text-slate-100 leading-none">{userEmail.split('@')[0]}</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--active-theme-accent, #4f46e5)' }}>{userRol || 'SOPORTE'}</span>
                <button onClick={handleLogout} className="text-[10px] font-bold text-gray-400 hover:text-red-500 text-left transition-colors mt-0.5 cursor-pointer">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Híbrido Deduplicado */}
      <motion.aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: isExpanded ? 260 : 80 }}
        className={`fixed top-0 left-0 z-[60] h-screen bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/20 shadow-[8px_0_30px_rgb(0,0,0,0.04)] transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-24 border-b border-gray-100/50 dark:border-white/5">
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg shrink-0 transition-all"
            style={{ 
              background: 'linear-gradient(135deg, var(--active-theme-primary, #4f46e5), var(--active-theme-accent, #7c3aed))',
              boxShadow: '0 4px 14px var(--active-theme-glow, rgba(79, 70, 229, 0.4))'
            }}
          >
            <span className="text-white font-black text-lg">V</span>
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="text-lg font-black text-gray-900 dark:text-slate-100 tracking-tight whitespace-nowrap">Vaikuntha</span>
                <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap" style={{ color: 'var(--active-theme-accent, #4f46e5)' }}>
                  Enterprise ERP
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden py-6 scrollbar-hide">
          
          {/* 1. SECCIÓN PERSONAL (Mi Cuenta - Disponible para Todos) */}
          <NavSection title="Personal" isExpanded={isExpanded}>
            <NavItem href="/perfil" icon={User} label="Mi Cuenta" pathname={pathname} badge="Base" />
          </NavSection>

          {/* 2. SI ES USUARIO SOPORTE: Mostrar solo sus herramientas delegadas */}
          {esSoporte && (
            <NavSection title="Herramientas Habilitadas" isExpanded={isExpanded} icon={Zap}>
              {herramientasHabilitadasObj.length > 0 ? (
                herramientasHabilitadasObj.map(h => (
                  <NavItem 
                    key={h.key} 
                    href={h.ruta} 
                    icon={ICON_MAP[h.icono] || Sparkles} 
                    label={h.nombre} 
                    pathname={pathname} 
                    badge="Activo" 
                  />
                ))
              ) : (
                <NavItem href="/recepcion" icon={Inbox} label="Recepción Básica" pathname={pathname} badge="Default" />
              )}
            </NavSection>
          )}

          {/* 3. SI ES JEFE OPERATIVO: Mostrar Recepción, Operaciones, CRM y Logística */}
          {esJefeOperativo && (
            <>
              {/* WORKSPACES */}
              <NavSection title="Workspaces" isExpanded={isExpanded}>
                <NavItem href="/recepcion" icon={Inbox} label="Workspace Recepción" pathname={pathname} />
                <NavItem href="/caja" icon={Briefcase} label="Workspace Venta" pathname={pathname} />
                <NavItem href="/lab/despacho" icon={Beaker} label="Workspace Taller" pathname={pathname} />
                <NavItem href="/kiosk" icon={Sparkles} label="Lanzar Kiosko Totem" pathname={pathname} badge="Totem" />
              </NavSection>
 
              {/* OPERACIONES */}
              <NavSection title="Operaciones" isExpanded={isExpanded} icon={Shield}>
                <NavItem href="/operaciones/jefe" icon={Shield} label="Panel Jefe Operativo" pathname={pathname} badge="Piso" />
                <NavItem href="/operaciones" icon={Briefcase} label="Workspace Operativo" pathname={pathname} />
                <NavItem href="/wfm" icon={Activity} label="Mapa WFM" pathname={pathname} />
              </NavSection>
 
              {/* CRM & FRONT */}
              <NavSection title="CRM & Front" isExpanded={isExpanded}>
                <NavItem href="/recepcion/crm" icon={Users} label="Directorio CRM" pathname={pathname} />
                <NavItem href="/recepcion/agenda" icon={UserCircle} label="Agenda CRM" pathname={pathname} />
                <NavItem href="/recepcion/historial" icon={FileText} label="Historial OATC" pathname={pathname} />
              </NavSection>
 
              {/* LOGÍSTICA */}
              <NavSection title="Logística" isExpanded={isExpanded}>
                <NavItem href="/lab/kardex" icon={Activity} label="Kardex IoT" pathname={pathname} />
                <NavItem href="/lab/transferencia" icon={ArrowRightLeft} label="Transferencias" pathname={pathname} />
                <NavItem href="/lab/stock" icon={Layers} label="Stock Central" pathname={pathname} />
              </NavSection>
            </>
          )}

          {/* 4. SI ES ADMIN O SUPERADMIN: Mostrar toda la estructura maestra */}
          {esAdmin && (
            <>
              {/* WORKSPACES GENERALES */}
              <NavSection title="Workspaces" isExpanded={isExpanded}>
                <NavItem href="/recepcion" icon={Inbox} label="Workspace Recepción" pathname={pathname} />
                <NavItem href="/caja" icon={Briefcase} label="Workspace Venta" pathname={pathname} />
                <NavItem href="/lab/despacho" icon={Beaker} label="Workspace Taller" pathname={pathname} />
                <NavItem href="/kiosk" icon={Sparkles} label="Lanzar Kiosko Totem" pathname={pathname} badge="Totem" />
              </NavSection>

              {/* SECCIONES TRADICIONALES */}
              <NavSection title="CRM & Front" isExpanded={isExpanded}>
                <NavItem href="/recepcion/crm" icon={Users} label="Directorio CRM" pathname={pathname} />
                <NavItem href="/recepcion/agenda" icon={UserCircle} label="Agenda CRM" pathname={pathname} />
                <NavItem href="/recepcion/historial" icon={FileText} label="Historial OATC" pathname={pathname} />
                <NavItem href="/wfm" icon={Activity} label="Mapa WFM" pathname={pathname} />
              </NavSection>

              <NavSection title="Finanzas & Bancos" isExpanded={isExpanded}>
                <NavItem href="/finanzas" icon={Landmark} label="Caja & Bancos / Tesorería" pathname={pathname} badge="Nuevo" />
                <NavItem href="/finanzas/liquidaciones-staff" icon={Scissors} label="Liquidaciones Staff (Piso)" pathname={pathname} badge="Caja" />
                <NavItem href="/finanzas/liquidaciones-soporte" icon={ShieldCheck} label="Liquidaciones Soporte" pathname={pathname} badge="Admin" />
                <NavItem href="/caja/arqueo" icon={Calculator} label="Arqueo Ciego" pathname={pathname} />
                <NavItem href="/caja/productividad" icon={Activity} label="Productividad" pathname={pathname} />
                <NavItem href="/caja/comprobantes" icon={FileText} label="Comprobantes SUNAT" pathname={pathname} />
              </NavSection>

              <NavSection title="Logística" isExpanded={isExpanded}>
                <NavItem href="/lab/kardex" icon={Activity} label="Kardex IoT" pathname={pathname} />
                <NavItem href="/lab/transferencia" icon={ArrowRightLeft} label="Transferencias" pathname={pathname} />
                <NavItem href="/lab/stock" icon={Layers} label="Stock Central" pathname={pathname} />
                <NavItem href="/lab/ingreso" icon={Download} label="Ingreso Central" pathname={pathname} />
              </NavSection>

              <NavSection title="Operaciones" isExpanded={isExpanded}>
                <NavItem href="/operaciones" icon={Briefcase} label="Workspace Operativo" pathname={pathname} />
                <NavItem href="/operaciones/jefe" icon={Shield} label="Panel Jefe Operativo" pathname={pathname} badge="Piso" />
              </NavSection>

              {/* SISTEMA & GOBERNANZA */}
              <NavSection title="Sistema" isExpanded={isExpanded} icon={Shield}>
                <NavItem href="/admin/reportes" icon={Activity} label="Dashboard Global" pathname={pathname} />
                <NavItem href="/admin/usuarios" icon={Users} label="Usuarios & Delegación" pathname={pathname} badge="Admin" />
                <NavItem href="/admin/config" icon={Sliders} label="Configuración Sede" pathname={pathname} badge="Admin" />
                <NavItem href="/admin/reglas-clientes" icon={Award} label="Reglas de Clientes" pathname={pathname} badge="Insignias" />
                <NavItem href="/admin/catalogo" icon={Database} label="Catálogo de Bienes" pathname={pathname} />
              </NavSection>
            </>
          )}

          {/* 4. PLUG-IN LUMINA-HQ AI SUITE (Visible si el plugin está activado en Configuración) */}
          {pluginLuminaHqActivo && (
            <NavSection title="LuminaHQ AI Suite" isExpanded={isExpanded} icon={Sparkles}>
              <NavItem href="/luminahq/diagnostico" icon={Sparkles} label="Diagnóstico IA Capilar/Piel" pathname={pathname} badge="IA" />
              <NavItem href="/luminahq/fichas" icon={FileText} label="Fichas Clínicas Inteligentes" pathname={pathname} />
              <NavItem href="/luminahq/copilot" icon={Sparkles} label="Copiloto V.AI & Ventas" pathname={pathname} badge="V.AI" />
            </NavSection>
          )}

          {/* SuperAdmin Developer Controls */}
          {esSuperAdmin && (
            <NavSection title="Desarrollador" isExpanded={isExpanded}>
              <NavItem href="/dev" icon={Settings} label="System Logs & Debug" pathname={pathname} badge="Dev" />
            </NavSection>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className={`transition-all duration-300 pt-28 pb-10 px-4 sm:px-6 lg:px-8 ${isExpanded ? 'lg:ml-[260px]' : 'lg:ml-20'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      </main>
      
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-50 bg-gray-900/20 backdrop-blur-sm lg:hidden" 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
