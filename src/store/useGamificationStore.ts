import { create } from 'zustand';
import { obtenerPerfil, obtenerHallOfFame, obtenerKudosRecibidos, GamificationProfile } from '@/lib/gamification/engine';
import { getNivelPorXP, NivelInfo } from '@/lib/gamification/config';

export interface GamificationProfileState {
  xp_total: number;
  xp_ciclo: number;
  nivel: number;
  titulo: string;
  streak_asistencia: number;
  streak_max: number;
  monedas: number;
  badges: string[];
  xpParaSiguiente: number;
  progreso: number;
  xpActualEnNivel: number;
  xpTotalNivel: number;
}

export interface HallOfFameEntry {
  agente_id: string;
  nombre: string;
  rol: string;
  xp_ciclo: number;
  xp_total: number;
  nivel: number;
  titulo: string;
  streak_asistencia: number;
  badges: string[];
  rank: number;
}

export interface KudosRecibido {
  id: string;
  tipo: string;
  mensaje: string | null;
  created_at: string;
  sender: { nombre: string } | null;
}

export interface GamificationState {
  profile: GamificationProfileState | null;
  rawProfile: GamificationProfile | null;
  hallOfFame: HallOfFameEntry[];
  kudosRecibidos: KudosRecibido[];
  isLoading: boolean;
  loadProfile: (agenteId: string) => Promise<void>;
  refreshHallOfFame: () => Promise<void>;
  refreshKudos: (agenteId: string) => Promise<void>;
  addXP: (amount: number) => void;
}

export const useGamificationStore = create<GamificationState>((set, get) => ({
  profile: null,
  rawProfile: null,
  hallOfFame: [],
  kudosRecibidos: [],
  isLoading: false,

  loadProfile: async (agenteId: string) => {
    set({ isLoading: true });
    try {
      const rawProfile = await obtenerPerfil(agenteId);
      if (rawProfile) {
        const nivelInfo = getNivelPorXP(rawProfile.xp_total);
        set({
          rawProfile,
          profile: {
            xp_total: rawProfile.xp_total,
            xp_ciclo: rawProfile.xp_ciclo,
            streak_asistencia: rawProfile.streak_asistencia,
            streak_max: rawProfile.streak_max,
            monedas: rawProfile.monedas,
            badges: rawProfile.badges || [],
            ...nivelInfo,
          },
        });
      }
    } catch (err) {
      console.error('Error cargando perfil de gamificación:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  refreshHallOfFame: async () => {
    try {
      const data = await obtenerHallOfFame();
      set({ hallOfFame: data as HallOfFameEntry[] });
    } catch (err) {
      console.error('Error refrescando Hall of Fame:', err);
    }
  },

  refreshKudos: async (agenteId: string) => {
    try {
      const data = await obtenerKudosRecibidos(agenteId);
      set({ kudosRecibidos: data as KudosRecibido[] });
    } catch (err) {
      console.error('Error refrescando kudos:', err);
    }
  },

  addXP: (amount: number) => {
    const { profile } = get();
    if (profile) {
      const newXpTotal = profile.xp_total + amount;
      const nivelInfo = getNivelPorXP(newXpTotal);
      set({
        profile: {
          ...profile,
          xp_total: newXpTotal,
          xp_ciclo: profile.xp_ciclo + amount,
          monedas: profile.monedas + Math.floor(amount / 10),
          ...nivelInfo,
        },
      });
    }
  },
}));
