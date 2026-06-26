'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, LayoutDashboard, Inbox, UserCircle, Briefcase, FileText, Beaker, Truck, Settings, Activity, Shield, MapPin, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAppStore } from '@/store/useAppStore';
import { obtenerSedesUsuario, Sede } from '@/services/sedes';
import { NotificationTicker } from './NotificationTicker';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
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
    const roles = userRol.split(',');
    
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
    clearSede();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItemClass = (path: string) => `flex items-center p-2 rounded-lg text-sm transition-colors ${
    pathname.startsWith(path) 
      ? 'bg-primary-50 text-primary-700 font-semibold' 
      : 'text-gray-600 hover:bg-gray-100'
  }`;

  // Si no se encontró el rol del usuario (No está en la tabla agentes)
  if (!loadingSedes && !userRol && userEmail !== 'Cargando...') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-500 mb-6">Tu cuenta de acceso <b>({userEmail})</b> existe, pero no ha sido vinculada al ERP. No tienes ningún rol asignado en la base de datos.</p>
          <div className="bg-orange-50 text-orange-800 text-sm p-4 rounded-lg mb-6 text-left border border-orange-200">
            <strong>Solución:</strong><br/>
            Ve a tu SQL Editor en Supabase y asegúrate de ejecutar exitosamente el script <code>supabase_fase8_sync_final.sql</code>.
          </div>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
            Cerrar Sesión e Intentar de Nuevo
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA DE SELECCIÓN OBLIGATORIA DE SEDE (Si no ha elegido y tiene múltiples)
  if (!loadingSedes && !sedeActiva && misSedes.length > 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Bienvenido</h1>
          <p className="text-gray-500 mb-6">Por favor, selecciona la unidad de negocio a la que deseas ingresar hoy.</p>
          
          <div className="space-y-3">
            {misSedes.map(sede => (
              <button
                key={sede.id}
                onClick={() => setSedeActiva(sede)}
                className="w-full bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-gray-200 text-gray-800 font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-between"
              >
                <span>{sede.nombre}</span>
              </button>
            ))}
          </div>
          <button onClick={handleLogout} className="mt-8 text-sm text-gray-400 hover:text-red-500 transition-colors">
            Cerrar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gray-50">
      
      {/* Navbar Superior */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button 
                onClick={() => { setSidebarOpen(!sidebarOpen); setDesktopSidebarCollapsed(!desktopSidebarCollapsed); }} 
                className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 transition-colors"
                title="Alternar Menú"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 ms-2 md:me-24">
                <img src="/vaikuntha-logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                <span className="text-xl font-bold text-primary-700 tracking-tight whitespace-nowrap">
                  {sedeActiva ? sedeActiva.nombre : 'Vaikuntha'} <span className="text-xs font-normal text-gray-500 ml-1">ERP</span>
                </span>
              </div>
            </div>
            
            <NotificationTicker />

            <div className="flex items-center gap-4">
                {/* Selector Dropdown de Sede Superior */}
                {sedeActiva && misSedes.length > 1 && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowSedesDropdown(!showSedesDropdown)}
                      className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-indigo-600" />
                      {sedeActiva.nombre}
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>
                    
                    {showSedesDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                        {misSedes.map(sede => (
                          <button
                            key={sede.id}
                            onClick={() => {
                              setSedeActiva(sede);
                              setShowSedesDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors ${sede.id === sedeActiva.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            {sede.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-right hidden sm:block border-l border-gray-200 pl-4">
                    <p className="text-sm font-semibold text-gray-900">{userEmail}</p>
                    <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
                        Cerrar Sesión
                    </button>
                </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Lateral Izquierdo */}
      <aside 
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white border-r border-gray-200 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${desktopSidebarCollapsed ? 'lg:-translate-x-full' : 'lg:translate-x-0'}`}
      >
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-4 font-medium">
             
            {/* MÓDULO: RECEPCIÓN */}
            {tienePermiso('recepcion') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Recepción CRM</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/recepcion" className={navItemClass('/recepcion')}>
                      <LayoutDashboard className="w-5 h-5 mr-3" />
                      Workspace Recepción
                    </Link>
                  </li>
                  <li>
                    <Link href="/recepcion/agenda" className={navItemClass('/recepcion/agenda')}>
                      <UserCircle className="w-5 h-5 mr-3" />
                      Agenda CRM
                    </Link>
                  </li>
                  <li>
                    <Link href="/recepcion/directorio" className={navItemClass('/recepcion/directorio')}>
                      <UserCircle className="w-5 h-5 mr-3" />
                      Directorio Clientes
                    </Link>
                  </li>
                  <li>
                    <Link href="/recepcion/reportes" className={navItemClass('/recepcion/reportes')}>
                      <FileText className="w-5 h-5 mr-3" />
                      Reportes Recepción
                    </Link>
                  </li>
                  <li>
                    <Link href="/wfm" className={navItemClass('/wfm')}>
                      <LayoutDashboard className="w-5 h-5 mr-3" />
                      Mapa WFM
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* MÓDULO: CAJA POS */}
            {tienePermiso('caja') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Caja y Cobros</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/caja" className={navItemClass('/caja')}>
                      <Briefcase className="w-5 h-5 mr-3" />
                      Punto de Venta (POS)
                    </Link>
                  </li>
                </ul>
              </li>
            )}
             
            {/* MÓDULO: DESPACHO / LABORATORIO */}
            {tienePermiso('despacho') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Despacho e Insumos</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/despacho" className={navItemClass('/despacho')}>
                      <Beaker className="w-5 h-5 mr-3" />
                      Laboratorio Central
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* MÓDULO: OPERACIONES (Staff) */}
            {tienePermiso('operaciones') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Operaciones de Piso</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/operaciones" className={navItemClass('/operaciones')}>
                      <Briefcase className="w-5 h-5 mr-3" />
                      Workspace Operativo
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* MÓDULO: ADMINISTRACIÓN */}
            {tienePermiso('admin') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Administración</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/admin/reportes" className={navItemClass('/admin/reportes')}>
                      <Activity className="w-5 h-5 mr-3" />
                      Dashboard Global
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/usuarios" className={navItemClass('/admin/usuarios')}>
                      <Shield className="w-5 h-5 mr-3" />
                      Gestión de Usuarios
                    </Link>
                  </li>
                </ul>
              </li>
            )}
            
            {/* MÓDULO: DEVELOPER */}
            {tienePermiso('dev') && (
              <li>
                <span className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Desarrollador</span>
                <ul className="mt-2 space-y-1">
                  <li>
                    <Link href="/dev" className={navItemClass('/dev')}>
                      <Settings className="w-5 h-5 mr-3" />
                      System Logs
                    </Link>
                  </li>
                </ul>
              </li>
            )}

            {/* Otros módulos irán aquí según los roles... */}

          </ul>
          
          {/* MÓVIL: Cerrar Sesión (Solo visible en pantallas pequeñas) */}
          <div className="mt-8 border-t border-gray-100 pt-6 sm:hidden">
            <p className="text-xs font-semibold text-gray-500 mb-2 px-2 text-center break-words">{userEmail}</p>
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className={`p-4 pt-20 min-h-screen transition-all ${desktopSidebarCollapsed ? 'lg:ml-0' : 'lg:ml-64'}`}>
        {children}
      </div>

    </div>
  );
}
