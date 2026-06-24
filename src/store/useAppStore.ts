import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Sede {
  id: string;
  nombre: string;
}

interface AppState {
  sedeActiva: Sede | null;
  setSedeActiva: (sede: Sede) => void;
  clearSede: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sedeActiva: null,
      setSedeActiva: (sede) => set({ sedeActiva: sede }),
      clearSede: () => set({ sedeActiva: null })
    }),
    {
      name: 'erp-gonzales-storage', // name of the item in the storage (must be unique)
    }
  )
);
