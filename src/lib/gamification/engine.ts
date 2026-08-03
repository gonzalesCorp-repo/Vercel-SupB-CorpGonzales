import { createClient } from '@/lib/supabase/client';
import { getNivelPorXP, BADGE_CATALOG, calcularInicioCiclo } from './config';

export interface GamificationProfile {
  id: string;
  agente_id: string | null;
  cliente_id: string | null;
  rol_tipo: string;
  xp_total: number;
  xp_ciclo: number;
  nivel: number;
  titulo: string;
  streak_asistencia: number;
  streak_max: number;
  monedas: number;
  badges: string[];
  stats: Record<string, any>;
  hall_of_fame_rank: number;
  ciclo_inicio: string | null;
  updated_at: string;
  created_at: string;
}

// ─── Obtener o Crear Perfil ───────────────────────────────────
export async function obtenerPerfil(agenteId: string): Promise<GamificationProfile | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gamification_profiles')
    .select('*')
    .eq('agente_id', agenteId)
    .maybeSingle();

  if (data) return data as GamificationProfile;

  if (!data && (!error || error.code === 'PGRST116')) {
    const nivelInfo = getNivelPorXP(0);
    const { data: newProfile, error: insertError } = await supabase
      .from('gamification_profiles')
      .insert({
        agente_id: agenteId,
        rol_tipo: 'STAFF',
        xp_total: 0,
        xp_ciclo: 0,
        nivel: 1,
        titulo: nivelInfo.titulo,
        streak_asistencia: 0,
        streak_max: 0,
        monedas: 0,
        badges: [],
        stats: {},
        ciclo_inicio: calcularInicioCiclo().toISOString(),
      })
      .select('*')
      .single();

    if (insertError) {
      console.error('Error creando perfil de gamificación:', insertError);
      return null;
    }
    return newProfile as GamificationProfile;
  }

  if (error) console.error('Error obteniendo perfil:', error);
  return null;
}

// ─── Otorgar XP ───────────────────────────────────────────────
export async function otorgarXP(
  agenteId: string,
  cantidad: number,
  tipo: string,
  metadata?: Record<string, any>
): Promise<{ levelUp: boolean; newLevel: number; newTitle: string } | null> {
  const supabase = createClient();
  const profile = await obtenerPerfil(agenteId);
  if (!profile) return null;

  const prevNivel = getNivelPorXP(profile.xp_total);
  const newXpTotal = profile.xp_total + cantidad;
  const newXpCiclo = profile.xp_ciclo + cantidad;
  const newNivel = getNivelPorXP(newXpTotal);
  const levelUp = newNivel.nivel > prevNivel.nivel;

  // Calcular monedas: 1 moneda por cada 10 XP ganado
  const monedasGanadas = Math.floor(cantidad / 10);

  await supabase
    .from('gamification_profiles')
    .update({
      xp_total: newXpTotal,
      xp_ciclo: newXpCiclo,
      nivel: newNivel.nivel,
      titulo: newNivel.titulo,
      monedas: profile.monedas + monedasGanadas,
      updated_at: new Date().toISOString(),
    })
    .eq('agente_id', agenteId);

  // Log del evento
  await supabase.from('gamification_events').insert({
    agente_id: agenteId,
    tipo,
    cantidad,
    metadata: { ...metadata, level_up: levelUp, new_level: newNivel.nivel },
  });

  // Auto-otorgar badges por XP
  await verificarBadgesPorXP(agenteId, newXpTotal);

  return { levelUp, newLevel: newNivel.nivel, newTitle: newNivel.titulo };
}

// ─── Actualizar Streak de Asistencia ──────────────────────────
export async function actualizarStreak(agenteId: string): Promise<number> {
  const supabase = createClient();
  const profile = await obtenerPerfil(agenteId);
  if (!profile) return 0;

  const newStreak = profile.streak_asistencia + 1;
  const newMax = Math.max(newStreak, profile.streak_max);

  await supabase
    .from('gamification_profiles')
    .update({
      streak_asistencia: newStreak,
      streak_max: newMax,
      updated_at: new Date().toISOString(),
    })
    .eq('agente_id', agenteId);

  // Bonus XP por streak largo
  let bonusXP = 5; // Base por asistencia
  if (newStreak >= 7) bonusXP = 15;
  if (newStreak >= 14) bonusXP = 25;
  if (newStreak >= 30) bonusXP = 50;

  await otorgarXP(agenteId, bonusXP, 'STREAK_BONUS', { streak: newStreak });

  return newStreak;
}

// ─── Resetear Streak (si falta un día) ────────────────────────
export async function resetearStreak(agenteId: string): Promise<void> {
  const supabase = createClient();
  await supabase
    .from('gamification_profiles')
    .update({ streak_asistencia: 0, updated_at: new Date().toISOString() })
    .eq('agente_id', agenteId);
}

// ─── Otorgar Badge ────────────────────────────────────────────
export async function otorgarBadge(agenteId: string, badgeId: string): Promise<boolean> {
  const supabase = createClient();
  const profile = await obtenerPerfil(agenteId);
  if (!profile) return false;

  const currentBadges: string[] = profile.badges || [];
  if (currentBadges.includes(badgeId)) return false; // Ya lo tiene

  const updatedBadges = [...currentBadges, badgeId];
  await supabase
    .from('gamification_profiles')
    .update({ badges: updatedBadges, updated_at: new Date().toISOString() })
    .eq('agente_id', agenteId);

  // Log evento
  await supabase.from('gamification_events').insert({
    agente_id: agenteId,
    tipo: 'BADGE_EARNED',
    cantidad: 0,
    metadata: { badge_id: badgeId },
  });

  return true;
}

// ─── Verificar Badges por XP ──────────────────────────────────
async function verificarBadgesPorXP(agenteId: string, xpTotal: number): Promise<void> {
  for (const badge of BADGE_CATALOG) {
    if (badge.xp_required > 0 && xpTotal >= badge.xp_required) {
      await otorgarBadge(agenteId, badge.id);
    }
  }
}

// ─── Enviar Kudos ─────────────────────────────────────────────
export async function enviarKudos(
  senderId: string,
  receiverId: string,
  tipo: string,
  mensaje?: string
): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from('kudos').insert({
    sender_id: senderId,
    receiver_id: receiverId,
    tipo,
    mensaje: mensaje || null,
  });

  if (error) {
    console.error('Error enviando kudos:', error);
    return false;
  }

  // Otorgar XP al receptor
  await otorgarXP(receiverId, 25, 'KUDOS_RECIBIDO', { tipo, sender_id: senderId });
  // Otorgar un poco de XP al emisor por participar
  await otorgarXP(senderId, 5, 'KUDOS_ENVIADO', { tipo, receiver_id: receiverId });

  return true;
}

// ─── Hall of Fame del Ciclo Actual ────────────────────────────
export async function obtenerHallOfFame(): Promise<any[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('gamification_profiles')
    .select(`
      agente_id,
      xp_ciclo,
      xp_total,
      nivel,
      titulo,
      streak_asistencia,
      badges,
      agentes!gamification_profiles_agente_id_fkey ( nombre, rol, email )
    `)
    .order('xp_ciclo', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error obteniendo Hall of Fame:', error);
    return [];
  }

  return (data || []).map((entry: any, index: number) => ({
    ...entry,
    nombre: entry.agentes?.nombre || 'Desconocido',
    rol: entry.agentes?.rol || '',
    rank: index + 1,
  }));
}

// ─── Kudos Recibidos ──────────────────────────────────────────
export async function obtenerKudosRecibidos(agenteId: string): Promise<any[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('kudos')
    .select(`
      id,
      tipo,
      mensaje,
      created_at,
      sender:sender_id ( nombre )
    `)
    .eq('receiver_id', agenteId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error obteniendo kudos recibidos:', error);
    return [];
  }

  return data || [];
}

// ─── Resetear Ciclo (para ADMIN/cron) ─────────────────────────
export async function resetearCiclo(): Promise<void> {
  const supabase = createClient();
  const nuevoCicloInicio = calcularInicioCiclo().toISOString();

  await supabase
    .from('gamification_profiles')
    .update({
      xp_ciclo: 0,
      hall_of_fame_rank: 0,
      ciclo_inicio: nuevoCicloInicio,
      updated_at: new Date().toISOString(),
    })
    .neq('agente_id', null); // Aplica a todos
}
