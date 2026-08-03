import { createClient } from '@/lib/supabase/client';
import { getNivelPorXP } from './config';

// ─── Perfil de Gamificación para CLIENTES ─────────────────────
export interface ClienteGamProfile {
  id: string;
  cliente_id: string;
  xp_total: number;
  xp_ciclo: number;
  nivel: number;
  titulo: string;
  monedas: number;
  badges: string[];
  stats: Record<string, any>;
  visitas_total: number;
  updated_at: string;
}

// XP por acción de cliente
export const CLIENTE_XP_REWARDS = {
  SERVICIO_COMPLETADO: 30,
  PRIMERA_VISITA: 50,
  VISITA_RECURRENTE: 15,
  REFERIDO_EXITOSO: 100,
  REVIEW_DEJADO: 20,
  COMPRA_PRODUCTO: 10,
};

export const CLIENTE_BADGES = [
  { id: 'primera_visita', nombre: 'Primera Vez', icono: '🌟', descripcion: 'Completaste tu primera visita', visitas_req: 1 },
  { id: 'cliente_5', nombre: 'Cliente Frecuente', icono: '💫', descripcion: '5 visitas al salón', visitas_req: 5 },
  { id: 'cliente_10', nombre: 'VIP Bronce', icono: '🥉', descripcion: '10 visitas al salón', visitas_req: 10 },
  { id: 'cliente_25', nombre: 'VIP Plata', icono: '🥈', descripcion: '25 visitas al salón', visitas_req: 25 },
  { id: 'cliente_50', nombre: 'VIP Oro', icono: '🥇', descripcion: '50 visitas al salón', visitas_req: 50 },
  { id: 'cliente_100', nombre: 'Embajador', icono: '👑', descripcion: '100 visitas al salón', visitas_req: 100 },
];

// ─── Obtener o Crear Perfil de Cliente ────────────────────────
export async function obtenerPerfilCliente(clienteId: string): Promise<ClienteGamProfile | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('gamification_profiles')
    .select('*')
    .eq('cliente_id', clienteId)
    .maybeSingle();

  if (data) {
    return {
      ...data,
      visitas_total: data.stats?.visitas_total || 0,
    } as ClienteGamProfile;
  }

  // Crear perfil nuevo para cliente
  const nivelInfo = getNivelPorXP(0);
  const { data: newProfile, error } = await supabase
    .from('gamification_profiles')
    .insert({
      cliente_id: clienteId,
      rol_tipo: 'CLIENTE',
      xp_total: 0,
      xp_ciclo: 0,
      nivel: 1,
      titulo: nivelInfo.titulo,
      monedas: 0,
      badges: [],
      stats: { visitas_total: 0 },
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error creando perfil de cliente:', error);
    return null;
  }

  return { ...newProfile, visitas_total: 0 } as ClienteGamProfile;
}

// ─── Registrar Visita / Servicio Completado ───────────────────
export async function registrarVisitaCliente(clienteId: string, servicioNombre?: string): Promise<void> {
  const supabase = createClient();
  const profile = await obtenerPerfilCliente(clienteId);
  if (!profile) return;

  const nuevasVisitas = (profile.visitas_total || 0) + 1;
  const esFirstVisit = nuevasVisitas === 1;
  const xpGanado = esFirstVisit
    ? CLIENTE_XP_REWARDS.PRIMERA_VISITA
    : CLIENTE_XP_REWARDS.SERVICIO_COMPLETADO;

  const newXP = profile.xp_total + xpGanado;
  const nivelInfo = getNivelPorXP(newXP);
  const monedasGanadas = Math.floor(xpGanado / 5); // Clientes ganan más monedas

  // Verificar badges por visitas
  const newBadges = [...(profile.badges || [])];
  for (const badge of CLIENTE_BADGES) {
    if (nuevasVisitas >= badge.visitas_req && !newBadges.includes(badge.id)) {
      newBadges.push(badge.id);
    }
  }

  await supabase
    .from('gamification_profiles')
    .update({
      xp_total: newXP,
      xp_ciclo: profile.xp_ciclo + xpGanado,
      nivel: nivelInfo.nivel,
      titulo: nivelInfo.titulo,
      monedas: profile.monedas + monedasGanadas,
      badges: newBadges,
      stats: { ...profile.stats, visitas_total: nuevasVisitas },
      updated_at: new Date().toISOString(),
    })
    .eq('cliente_id', clienteId);

  // Log evento
  await supabase.from('gamification_events').insert({
    cliente_id: clienteId,
    tipo: esFirstVisit ? 'PRIMERA_VISITA' : 'SERVICIO_COMPLETADO',
    cantidad: xpGanado,
    metadata: { servicio: servicioNombre, visita_numero: nuevasVisitas },
  });
}

// ─── Obtener Recompensas Disponibles para Cliente ─────────────
export async function obtenerRecompensasCliente(): Promise<any[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('rewards_catalog')
    .select('*')
    .eq('activo', true)
    .or('tipo_beneficiario.eq.TODOS,tipo_beneficiario.eq.CLIENTE')
    .order('costo_monedas', { ascending: true });

  if (error) {
    console.error('Error obteniendo recompensas:', error);
    return [];
  }
  return data || [];
}

// ─── Canjear Recompensa ───────────────────────────────────────
export async function canjearRecompensa(profileId: string, rewardId: string, costoMonedas: number, monedasActuales: number): Promise<boolean> {
  if (monedasActuales < costoMonedas) return false;

  const supabase = createClient();

  // Descontar monedas
  const { error: updateErr } = await supabase
    .from('gamification_profiles')
    .update({
      monedas: monedasActuales - costoMonedas,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId);

  if (updateErr) {
    console.error('Error descontando monedas:', updateErr);
    return false;
  }

  // Registrar el canje
  const { error: redeemErr } = await supabase
    .from('rewards_redemptions')
    .insert({
      profile_id: profileId,
      reward_id: rewardId,
      estado: 'PENDIENTE',
    });

  if (redeemErr) {
    console.error('Error registrando canje:', redeemErr);
    return false;
  }

  return true;
}
