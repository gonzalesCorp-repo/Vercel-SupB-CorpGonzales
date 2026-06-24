'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, LogOut, LayoutDashboard, Inbox, UserCircle, Briefcase, FileText, Beaker, Truck, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('Cargando...');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || 'Usuario');
      }
    };
    fetchUser();
  }, [supabase.auth]);
  
  const tienePermiso = (modulo: string) => true; // Por ahora todos tienen acceso a todo

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navItemClass = (path: string) => `flex items-center p-2 rounded-lg text-sm transition-colors ${
    pathname.startsWith(path) 
      ? 'bg-primary-50 text-primary-700 font-semibold' 
      : 'text-gray-600 hover:bg-gray-100'
  }`;

  return (
    <div className="relative min-h-screen bg-gray-50">
      
      {/* Navbar Superior */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                className="p-2 text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="ms-2 md:me-24 text-xl font-bold text-primary-700 tracking-tight">
                Gonzales Spa <span className="text-xs font-normal text-gray-500 ml-2">ERP</span>
              </span>
            </div>
            <div className="flex items-center">
                <div className="text-right mr-4 hidden sm:block">
                    <p className="text-sm font-semibold text-gray-900">{userEmail}</p>
                    <p className="text-xs text-primary-600 uppercase">ADMIN</p>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 text-sm bg-red-50 text-red-600 font-medium px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar Lateral Izquierdo */}
      <aside 
        className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white border-r border-gray-200 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
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
                    <Link href="/recepcion/reportes" className={navItemClass('/recepcion/reportes')}>
                      <FileText className="w-5 h-5 mr-3" />
                      Reportes Recepción
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
             
            {/* Otros módulos irán aquí según los roles... */}

          </ul>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="p-4 lg:ml-64 pt-20 min-h-screen">
        {children}
      </div>

    </div>
  );
}
