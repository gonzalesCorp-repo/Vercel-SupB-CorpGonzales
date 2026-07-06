'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, LogOut, LayoutDashboard, Inbox, UserCircle, Briefcase, FileText, Beaker, Truck, Settings, Activity, Shield, MapPin, ChevronDown, Palette, User, PackageSearch, ArrowRightLeft, Layers, Download, BarChart3, Database } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { NotificationTicker } from './NotificationTicker';
import { registrarLog } from '@/services/logger';
import { GlobalUI } from '@/components/ui/GlobalUI';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('Cargando...');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { sedeActiva, setSedeActiva, clearSede, userRol, setUserRol } = useAppStore();
  
  
  const [misSedes, setMisSedes] = useState<Sede[]>([]);
  const [loadingSedes, setLoadingSedes] = useState(true);
  const [showSedesDropdown, setShowSedesDropdown] = useState(false);

  useEffect(() => {
    const fetchUserAndSedes = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        setUserEmail(user.email);
        
        // Cargar rol desde la DB siempre para evitar bugs de caché entre usuarios
        // Usamos maybeSingle() para evitar el error 406 si el usuario aún no existe en la tabla agentes
        // Usamos ilike y trim() para evitar problemas de mayúsculas/minúsculas y espacios invisibles en el correo
        const { data: agente, error: errAgente } = await supabase.from('agentes').select('rol').ilike('email', user.email.trim()).maybeSingle();
        
        if (errAgente) console.error('Error fetching agente:', errAgente);

        if (agente && agente.rol) {
          // Guardamos el rol en mayúsculas para evitar errores de tipeo en la BD (ej. 'admin' vs 'ADMIN')
          setUserRol(agente.rol.toUpperCase());
        } else {
          // Si no tiene rol en la base de datos, forzamos a null para mostrar la pantalla de error
          setUserRol(null);
        }
        
        // Cargar sedes permitidas
        const sedes = await obtenerSedesUsuario(user.email);
        setMisSedes(sedes);
        
        // Si no hay sede activa en Zustand y tiene sedes, autoseleccionar la primera
        if (!sedeActiva && sedes.length === 1) {
          setSedeActiva(sedes[0]);
        }
      }
      setLoadingSedes(false);
    };
    fetchUserAndSedes();
  }, [supabase.auth, sedeActiva, setSedeActiva, userRol, setUserRol]);
  
  const tienePermiso = (modulo: string) => {
    if (!userRol) return false;
    const roles = userRol.split(',').map(r => r.trim());
    
    if (roles.includes('SUPERADMIN')) return true;
    if (roles.includes('ADMIN') && modulo !== 'dev') return true;
    
    switch (modulo) {
      case 'recepcion': return roles.includes('RECEPCION');
      case 'caja': return roles.includes('CAJA');
      case 'despacho': return roles.includes('DESPACHO');
      case 'operaciones': return roles.includes('STAFF');
      case 'wfm': return roles.includes('WFM') || roles.includes('RECEPCION');
      case 'admin': return false; // Administradores ya cubiertos
      case 'dev': return false; // Devs ya cubiertos
      case 'perfil': return true; // Acceso global
      case 'configuracion': return true; // Acceso global
      default: return false;
    }
  };

  // Bloqueo Forzoso de Rutas
  useEffect(() => {
    if (!loadingSedes && userRol && pathname !== '/') {
      const pathModulo = pathname.split('/')[1] || '';
      
      if (pathModulo && !tienePermiso(pathModulo)) {
        // Redirigir al primer módulo al que sí tenga acceso
        if (tienePermiso('recepcion')) router.push('/recepcion');
        else if (tienePermiso('operaciones')) router.push('/operaciones');
        else if (tienePermiso('caja')) router.push('/caja');
        else if (tienePermiso('despacho')) router.push('/despacho');
        else if (tienePermiso('admin')) router.push('/admin/reportes');
        else if (tienePermiso('dev')) router.push('/dev');
      }
    }
  }, [pathname, loadingSedes, userRol, router]);

  const handleLogout = async () => {
    await registrarLog('AUTH', 'Cierre de sesión');
    clearSede();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isExpanded = mobileMenuOpen || isHovered;

  const NavItem = ({ href, icon: Icon, label, disabled = false }: any) => {
    const isActive = pathname.startsWith(href);
    return (
      <li>
        <Link href={disabled ? '#' : href} className={`relative flex items-center p-3 rounded-2xl transition-all duration-300 group ${isActive ? 'bg-indigo-600/10 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isActive && (
            <motion.div layoutId="activeNavIndicator" className="absolute left-0 w-1 h-8 bg-indigo-600 rounded-r-full" />
          )}
          <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-900'}`} />
          <AnimatePresence>
            {isExpanded && (
              <motion.span 
                initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                animate={{ opacity: 1, width: 'auto', marginLeft: 12 }}
                exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                className="font-semibold text-sm whitespace-nowrap overflow-hidden"
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </li>
    );
  };

  const NavSection = ({ title, children }: any) => (
    <div className="mb-6">
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 mb-2"
          >
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <ul className="space-y-1 px-2">
        {children}
      </ul>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#fafafa] dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
      <GlobalUI />
      
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
            <NotificationTicker />
          </div>

          <div className="flex items-center gap-4">
            {/* Sede Selector */}
            {sedeActiva && misSedes.length > 1 && (
              <div className="relative">
                <button 
                  onClick={() => setShowSedesDropdown(!showSedesDropdown)}
                  className="flex items-center gap-2 bg-white/50 hover:bg-white border border-gray-100/50 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
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
                      className="absolute right-0 mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden z-50 p-2"
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
            
            <div className="hidden sm:flex items-center gap-3 pl-4 border-l border-gray-200/50 dark:border-slate-800">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-[2px]">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-gray-900 leading-none">{userEmail.split('@')[0]}</span>
                <button onClick={handleLogout} className="text-[10px] font-bold text-gray-400 hover:text-red-500 text-left transition-colors mt-0.5">Logout</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Ultra-thin Sidebar (Aceternity Style) */}
      <motion.aside 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: isExpanded ? 260 : 80 }}
        className={`fixed top-0 left-0 z-[60] h-screen bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/20 shadow-[8px_0_30px_rgb(0,0,0,0.04)] transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-24 border-b border-gray-100/50">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
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
                <span className="text-lg font-black text-gray-900 tracking-tight whitespace-nowrap">Vaikuntha</span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest whitespace-nowrap">Enterprise ERP</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="h-[calc(100vh-6rem)] overflow-y-auto overflow-x-hidden py-6 scrollbar-hide">
          {tienePermiso('recepcion') && (
            <NavSection title="CRM & Front">
              <NavItem href="/recepcion" icon={LayoutDashboard} label="Workspace Recepción" />
              <NavItem href="/recepcion/historial" icon={FileText} label="Historial de OATC" />
              <NavItem href="/recepcion/agenda" icon={UserCircle} label="Agenda CRM" />
              <NavItem href="/recepcion/reportes" icon={FileText} label="Reportes Recepción" />
              <NavItem href="/wfm" icon={Activity} label="Mapa WFM" />
            </NavSection>
          )}

          {tienePermiso('caja') && (
            <NavSection title="Finanzas">
              <NavItem href="/caja" icon={Briefcase} label="Punto de Venta" />
              <NavItem href="/caja/arqueo" icon={FileText} label="Arqueo" />
              <NavItem href="/caja/productividad" icon={Activity} label="Productividad" />
              <NavItem href="/caja/comprobantes" icon={FileText} label="Comprobantes" />
              <NavItem href="/caja/facturas" icon={Layers} label="Facturas" />
              <NavItem href="/caja/cuentas" icon={Briefcase} label="Gestión de Cuentas" />
            </NavSection>
          )}

          {tienePermiso('despacho') && (
            <NavSection title="Logística">
              <NavItem href="/lab/despacho" icon={PackageSearch} label="Despacho (ODI)" />
              <NavItem href="/lab/kardex" icon={Activity} label="Kardex" />
              <NavItem href="/lab/transferencia" icon={ArrowRightLeft} label="Transferencias" />
              <NavItem href="/lab/stock" icon={Layers} label="Stock" />
              <NavItem href="/lab/ingreso" icon={Download} label="Ingreso Central" />
              <NavItem href="/lab/metricas" icon={BarChart3} label="Métricas" />
            </NavSection>
          )}

          {tienePermiso('operaciones') && (
            <NavSection title="Operaciones">
              <NavItem href="/operaciones" icon={Briefcase} label="Workspace Operativo" />
            </NavSection>
          )}

          {tienePermiso('admin') && (
            <NavSection title="Sistema">
              <NavItem href="/admin/reportes" icon={Activity} label="Dashboard Global" />
              <NavItem href="/admin/catalogo" icon={Database} label="Catálogo Maestro" />
              <NavItem href="/admin/usuarios" icon={Shield} label="Usuarios" />
              <NavItem href="/admin/configuracion" icon={Settings} label="Configuración WFM" />
              <NavItem href="/admin/caja-config" icon={Settings} label="Configuración Caja" />
            </NavSection>
          )}

          {tienePermiso('dev') && (
            <NavSection title="Desarrollador">
              <NavItem href="/dev" icon={Settings} label="System Logs" />
            </NavSection>
          )}

          <NavSection title="Personal">
            <NavItem href="/perfil" icon={User} label="Mi Perfil" />
            <NavItem href="/configuracion" icon={Palette} label="Configuración Visual" />
          </NavSection>
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
