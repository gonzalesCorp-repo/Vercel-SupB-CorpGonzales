'use client';

import { useAppStore } from '@/store/useAppStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const userRol = useAppStore((state) => state.userRol);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Si ya cargó el rol y no es SUPERADMIN, patearlo
    if (userRol) {
      if (!userRol.includes('SUPERADMIN')) {
        router.push('/');
      } else {
        setIsAuthorized(true);
      }
    }
  }, [userRol, router]);

  if (!isAuthorized) {
    return <div className="p-10 text-center text-gray-500">Verificando credenciales de desarrollador...</div>;
  }

  return <>{children}</>;
}
