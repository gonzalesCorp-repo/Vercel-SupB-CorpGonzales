import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sede {
  id: string;
  nombre: string;
}

interface AppState {
  sedeActiva: Sede | null;
  userRol: string | null;
  setSedeActiva: (sede: Sede) => void;
  setUserRol: (rol: string | null) => void;
  clearSede: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sedeActiva: null,
      userRol: null,
      setSedeActiva: (sede) => set({ sedeActiva: sede }),
      setUserRol: (rol) => set({ userRol: rol }),
      clearSede: () => set({ sedeActiva: null, userRol: null })
    }),
    {
      name: 'erp-gonzales-storage', // name of the item in the storage (must be unique)
    }
  )
);
