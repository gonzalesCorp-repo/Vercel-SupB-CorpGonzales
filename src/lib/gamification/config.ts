// ─── Octalysis Gamification Configuration ───────────────────────────
// Basado en el Framework Octalysis de Yu-kai Chou
// Ciclo de Hall de la Fama: Se reinicia el primer miércoles después del día 8 de cada mes

// ─── XP Thresholds ───────────────────────────────────────────
export const XP_THRESHOLDS = [
  0,      // Nivel 1
  100,    // Nivel 2
  250,    // Nivel 3
  500,    // Nivel 4
  850,    // Nivel 5
  1300,   // Nivel 6
  1850,   // Nivel 7
  2500,   // Nivel 8
  3250,   // Nivel 9
  4100,   // Nivel 10
  5050,   // Nivel 11
  6100,   // Nivel 12
  7250,   // Nivel 13
  8500,   // Nivel 14
  9850,   // Nivel 15
  11300,  // Nivel 16
  12850,  // Nivel 17
  14500,  // Nivel 18
  16250,  // Nivel 19
  18100,  // Nivel 20
];

const TITLES = [
  'Novato', 'Aprendiz', 'Promesa', 'Hábil', 'Experto',
  'Veterano', 'Maestro', 'Leyenda', 'Élite', 'Ícono'
];

// ─── XP Awards por Acción ─────────────────────────────────────
export const XP_REWARDS: Record<string, number> = {
  // STAFF
  ATENCION_COMPLETADA: 20,
  ATENCION_EXCELENTE: 35,
  UPSELL_PRODUCTO: 15,
  LLEGADA_PUNTUAL: 10,
  STREAK_BONUS_7: 15,
  STREAK_BONUS_14: 25,
  STREAK_BONUS_30: 50,
  NFC_CHECKIN: 5,
  // RECEPCION
  OATC_CREADA: 10,
  REBOOKING_EXITOSO: 20,
  SLOT_FLASH_COMPLETADO: 30,
  CERO_ESPERA: 25,
  // CAJA
  COBRO_SIN_ERROR: 10,
  ARQUEO_PERFECTO: 30,
  ADDON_POS: 15,
  // DESPACHO
  PREP_RAPIDA: 15,
  STOCK_ALERTA_PROACTIVA: 25,
  DESPERDICIO_CERO: 20,
  // UNIVERSAL
  KUDOS_RECIBIDO: 25,
  KUDOS_ENVIADO: 5,
  BADGE_EARNED_BONUS: 50,
};

// ─── Badge Catalog ────────────────────────────────────────────
export interface Badge {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  xp_required: number;
  role_filter?: string[];
}

export const BADGE_CATALOG: Badge[] = [
  // Badges por XP acumulado
  { id: 'centurion', nombre: 'Centurión', icono: '🛡️', descripcion: 'Alcanzaste 100 XP', xp_required: 100 },
  { id: 'gladiador', nombre: 'Gladiador', icono: '⚔️', descripcion: 'Alcanzaste 500 XP', xp_required: 500 },
  { id: 'titan', nombre: 'Titán', icono: '🏛️', descripcion: 'Alcanzaste 1,000 XP', xp_required: 1000 },
  { id: 'olimpico', nombre: 'Olímpico', icono: '🏅', descripcion: 'Alcanzaste 2,500 XP', xp_required: 2500 },
  { id: 'inmortal', nombre: 'Inmortal', icono: '🔱', descripcion: 'Alcanzaste 5,000 XP', xp_required: 5000 },
  { id: 'cosmico', nombre: 'Cósmico', icono: '🌌', descripcion: 'Alcanzaste 10,000 XP', xp_required: 10000 },

  // Badges por Streaks
  { id: 'racha_7', nombre: 'Semana Perfecta', icono: '🔥', descripcion: '7 días consecutivos de asistencia', xp_required: 0 },
  { id: 'racha_14', nombre: 'Quincena de Hierro', icono: '💪', descripcion: '14 días consecutivos', xp_required: 0 },
  { id: 'racha_30', nombre: 'Mes Inquebrantable', icono: '🏔️', descripcion: '30 días consecutivos', xp_required: 0 },

  // Badges por Rol - STAFF
  { id: 'primera_atencion', nombre: 'Primera Atención', icono: '✂️', descripcion: 'Completaste tu primera atención', xp_required: 0, role_filter: ['STAFF'] },
  { id: 'atencion_50', nombre: 'Medio Centenar', icono: '💈', descripcion: '50 atenciones completadas', xp_required: 0, role_filter: ['STAFF'] },
  { id: 'atencion_100', nombre: 'Club de los 100', icono: '💎', descripcion: '100 atenciones completadas', xp_required: 0, role_filter: ['STAFF'] },
  { id: 'atencion_500', nombre: 'Leyenda del Salón', icono: '👑', descripcion: '500 atenciones completadas', xp_required: 0, role_filter: ['STAFF'] },
  { id: 'vendedor_nato', nombre: 'Vendedor Nato', icono: '💰', descripcion: '20 upsells de productos', xp_required: 0, role_filter: ['STAFF'] },

  // Badges por Rol - RECEPCION
  { id: 'anfitrion', nombre: 'Anfitrión Estrella', icono: '🌟', descripcion: '50 check-ins sin espera', xp_required: 0, role_filter: ['RECEPCION'] },
  { id: 'slot_saver', nombre: 'Salvadora de Slots', icono: '⚡', descripcion: '10 flash quests completados', xp_required: 0, role_filter: ['RECEPCION'] },

  // Badges por Rol - CAJA
  { id: 'precision_total', nombre: 'Precisión Total', icono: '🎯', descripcion: '30 arqueos perfectos consecutivos', xp_required: 0, role_filter: ['CAJA'] },
  { id: 'rayo_cobro', nombre: 'Rayo del Cobro', icono: '⚡', descripcion: 'Velocidad promedio < 45 seg por transacción', xp_required: 0, role_filter: ['CAJA'] },

  // Badges por Rol - DESPACHO
  { id: 'eco_warrior', nombre: 'Eco Warrior', icono: '🌿', descripcion: 'Desperdicio cero por 7 días', xp_required: 0, role_filter: ['DESPACHO'] },
  { id: 'stock_sentinel', nombre: 'Centinela del Stock', icono: '🛡️', descripcion: '10 alertas proactivas de stock', xp_required: 0, role_filter: ['DESPACHO'] },

  // Badge Social
  { id: 'social_star', nombre: 'Estrella Social', icono: '⭐', descripcion: 'Recibiste 10 kudos', xp_required: 0 },
  { id: 'mentor', nombre: 'Mentor', icono: '🎓', descripcion: 'Enviaste 25 kudos a colegas', xp_required: 0 },
];

// ─── Kudos Catalog ────────────────────────────────────────────
export interface KudosType {
  id: string;
  nombre: string;
  icono: string;
  descripcion: string;
  color: string;
}

export const KUDOS_CATALOG: Record<string, KudosType> = {
  TIJERAS_DORADAS: {
    id: 'TIJERAS_DORADAS',
    nombre: 'Tijeras Doradas',
    icono: '✂️',
    descripcion: 'Trabajo técnico excelente',
    color: 'from-amber-500 to-yellow-400',
  },
  ESTRELLA_BRILLANTE: {
    id: 'ESTRELLA_BRILLANTE',
    nombre: 'Estrella Brillante',
    icono: '⭐',
    descripcion: 'Atención al cliente excepcional',
    color: 'from-blue-500 to-cyan-400',
  },
  MANO_AMIGA: {
    id: 'MANO_AMIGA',
    nombre: 'Mano Amiga',
    icono: '🤝',
    descripcion: 'Compañerismo y trabajo en equipo',
    color: 'from-emerald-500 to-green-400',
  },
  CORONA_ORO: {
    id: 'CORONA_ORO',
    nombre: 'Corona de Oro',
    icono: '👑',
    descripcion: 'Liderazgo destacado en el salón',
    color: 'from-purple-500 to-pink-400',
  },
};

// ─── Role Mechanics (Core Drives activos por rol) ─────────────
export interface RolMechanics {
  coreDrives: string[];
  tabs: { id: string; label: string; icono: string }[];
  description: string;
}

export const ROLE_MECHANICS: Record<string, RolMechanics> = {
  STAFF: {
    coreDrives: ['CD2', 'CD3', 'CD4', 'CD5', 'CD7', 'CD8'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'turno', label: 'Turno', icono: '💼' },
      { id: 'clientes', label: 'Clientes', icono: '👥' },
      { id: 'agenda', label: 'Agenda', icono: '📅' },
    ],
    description: 'Operario de piso — Atención, producción y upsell',
  },
  RECEPCION: {
    coreDrives: ['CD1', 'CD2', 'CD5', 'CD6', 'CD8'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'cola', label: 'Cola', icono: '📋' },
      { id: 'clientes', label: 'Clientes', icono: '👥' },
      { id: 'agenda', label: 'Agenda', icono: '📅' },
    ],
    description: 'Recepción — Check-in, re-booking y flujo de clientes',
  },
  CAJA: {
    coreDrives: ['CD2', 'CD4', 'CD7', 'CD8'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'cobros', label: 'Cobros', icono: '💳' },
      { id: 'arqueo', label: 'Arqueo', icono: '📊' },
    ],
    description: 'Caja — Cobros, arqueo y precisión financiera',
  },
  DESPACHO: {
    coreDrives: ['CD1', 'CD2', 'CD3', 'CD8'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'prep', label: 'Preparación', icono: '🧪' },
      { id: 'stock', label: 'Stock', icono: '📦' },
    ],
    description: 'Despacho — Preparación, stock y sustentabilidad',
  },
  ADMIN: {
    coreDrives: ['CD1', 'CD2', 'CD3', 'CD5'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'equipo', label: 'Equipo', icono: '👥' },
      { id: 'retos', label: 'Retos', icono: '🏆' },
      { id: 'recompensas', label: 'Market', icono: '🎁' },
    ],
    description: 'Admin — Dashboard, retos y marketplace',
  },
  SUPERADMIN: {
    coreDrives: ['CD1', 'CD2', 'CD3', 'CD4', 'CD5', 'CD6', 'CD7', 'CD8'],
    tabs: [
      { id: 'inicio', label: 'Inicio', icono: '🏠' },
      { id: 'equipo', label: 'Equipo', icono: '👥' },
      { id: 'retos', label: 'Retos', icono: '🏆' },
      { id: 'recompensas', label: 'Market', icono: '🎁' },
    ],
    description: 'Superadmin — Control total del motor de gamificación',
  },
};

// ─── Cálculo de Ciclo Económico ───────────────────────────────
// El Hall de la Fama se reinicia el primer miércoles posterior al día 8 de cada mes

export function calcularInicioCiclo(date: Date = new Date()): Date {
  const d = new Date(date);
  // Buscar el primer miércoles en o después del 8 del mes actual
  let target = new Date(d.getFullYear(), d.getMonth(), 8);
  while (target.getDay() !== 3) { // 3 = Wednesday
    target.setDate(target.getDate() + 1);
  }

  // Si estamos antes de esa fecha, usar el ciclo del mes anterior
  if (d.getTime() < target.getTime()) {
    target = new Date(d.getFullYear(), d.getMonth() - 1, 8);
    while (target.getDay() !== 3) {
      target.setDate(target.getDate() + 1);
    }
  }

  target.setHours(0, 0, 0, 0);
  return target;
}

export function calcularFinCiclo(date: Date = new Date()): Date {
  const start = calcularInicioCiclo(date);
  // Fin del ciclo = inicio del siguiente ciclo - 1ms
  let nextTarget = new Date(start.getFullYear(), start.getMonth() + 1, 8);
  while (nextTarget.getDay() !== 3) {
    nextTarget.setDate(nextTarget.getDate() + 1);
  }
  nextTarget.setHours(0, 0, 0, 0);
  return new Date(nextTarget.getTime() - 1);
}

// ─── Nivel por XP ─────────────────────────────────────────────
export interface NivelInfo {
  nivel: number;
  titulo: string;
  xpParaSiguiente: number;
  progreso: number;
  xpActualEnNivel: number;
  xpTotalNivel: number;
}

export function getNivelPorXP(xp: number): NivelInfo {
  let nivel = 1;
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) {
      nivel = i + 1;
      break;
    }
  }

  let titulo = TITLES[(nivel - 1) % 10];
  if (nivel > 10) titulo += ' II';

  const xpBaseNivel = XP_THRESHOLDS[nivel - 1];
  const xpSiguienteNivel = nivel < 20 ? XP_THRESHOLDS[nivel] : XP_THRESHOLDS[19];
  const xpActualEnNivel = xp - xpBaseNivel;
  const xpTotalNivel = xpSiguienteNivel - xpBaseNivel;
  const progreso = nivel < 20
    ? (xpActualEnNivel / xpTotalNivel) * 100
    : 100;

  return {
    nivel,
    titulo,
    xpParaSiguiente: xpSiguienteNivel,
    progreso: Math.max(0, Math.min(100, progreso)),
    xpActualEnNivel,
    xpTotalNivel,
  };
}
