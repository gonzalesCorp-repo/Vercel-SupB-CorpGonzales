import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sede {
  id: string;
  nombre: string;
}

interface AppState {
  sedeActiva: Sede | null;
  userRol: string | null;
  userEmail: string | null;
  setSedeActiva: (sede: Sede) => void;
  setUserRol: (rol: string | null) => void;
  setUserEmail: (email: string | null) => void;
  clearSede: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sedeActiva: null,
      userRol: null,
      userEmail: null,
      setSedeActiva: (sede) => set({ sedeActiva: sede }),
      setUserRol: (rol) => set({ userRol: rol }),
      setUserEmail: (email) => set({ userEmail: email }),
      clearSede: () => set({ sedeActiva: null, userRol: null, userEmail: null })
    }),
    {
      name: 'erp-gonzales-storage',
    }
  )
);
