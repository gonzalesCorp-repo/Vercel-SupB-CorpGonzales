import { createClient } from '@/lib/supabase/client';
import { 
  PreferenciaSensorialCliente, 
  VitalidadCapilarStitch, 
  RutinaClimatologicaOpal, 
  PredictorCicloCapilarOpal, 
  LuminaHqPluginConfig, 
  MensajeLuminaCopilot,
  MetaSaludCapilar 
} from '@/types/clienteLifestyle';

// ==========================================
// 🔔 1. SINTETIZADOR WEB AUDIO API (CAMPANAS ZEN)
// ==========================================

export function reproducirCampanaZen(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Frecuencias armónicas de cuenco tibetano (432 Hz - Armónico Aéreo)
    const frecuencias = [432, 864, 1296];
    const ganancias = [0.35, 0.15, 0.08];

    frecuencias.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      // Envolvente de decaimiento exponencial natural de campana
      gain.gain.setValueAtTime(ganancias[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 4.0);
    });

    // Vibración háptica en móviles si está soportada
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  } catch (e) {
    console.warn('Web Audio no disponible en este entorno:', e);
  }
}

export function reproducirChimeInicio(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // 528 Hz (Tono Solfeggio de equilibrio)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.3);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);

    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  } catch (e) {
    console.warn('Web Audio no disponible:', e);
  }
}

// ==========================================
// 🔮 2. MOTORES GOOGLE OPAL AI
// ==========================================

export function procesarRutinaClimatologicaOpal(
  meta: MetaSaludCapilar,
  diasPostServicio: number
): RutinaClimatologicaOpal {
  // Clima dinámico o simulado para estética costera / Lima
  const humedad = 78;
  const temp = 21;
  const uv = 6;

  let alertaAmbiental = 'Humedad relativa moderada-alta (78%). Mayor propensión al encrespamiento.';
  let consejoZen = 'Tu cabello refleja tu serenidad. Tómate 3 minutos al anochecer para masajear las raíces con suavidad.';

  const rutinaAm = [
    {
      id: 'am-1',
      orden: 1,
      titulo: 'Sellado y Protección Cuticular',
      descripcion: 'Aplica 2 a 3 gotas de sérum botánico de medios a puntas con las palmas tibias.',
      duracion_minutos: 2,
      producto_sugerido: meta === 'MANTENER_COLOR' ? 'Aceite protector de pigmento' : 'Sérum de Argán & Camelia',
      es_mascarilla_o_masaje: false
    },
    {
      id: 'am-2',
      orden: 2,
      titulo: 'Escudo Térmico & Anti-Frizz',
      descripcion: 'Pulveriza bruma con filtro UV antes de salir o utilizar herramientas de calor.',
      duracion_minutos: 1,
      producto_sugerido: 'Bruma Termo-Protectora Ligera',
      es_mascarilla_o_masaje: false
    }
  ];

  const rutinaPm = [
    {
      id: 'pm-1',
      orden: 1,
      titulo: 'Descompresión Capilar & Cepillado Consciente',
      descripcion: 'Desenreda desde las puntas hacia la raíz con cepillo de cerdas naturales para distribuir los aceites orgánicos.',
      duracion_minutos: 3,
      producto_sugerido: 'Cepillo desenredante de madera',
      es_mascarilla_o_masaje: true
    },
    {
      id: 'pm-2',
      orden: 2,
      titulo: 'Nutrición Nocturna Restauradora',
      descripcion: 'Tratamiento intensivo sin enjuague para permitir la absorción lipídica durante el descanso.',
      duracion_minutos: 5,
      producto_sugerido: meta === 'RECONSTRUCCION' ? 'Mascarilla nocturna de péptidos' : 'Fluido reconstructor de puntas',
      es_mascarilla_o_masaje: true
    }
  ];

  if (diasPostServicio > 25) {
    alertaAmbiental += ' La cutícula muestra signos de desgaste por lavados frecuentes post-salón.';
    consejoZen = 'Es un momento ideal para mimar tu hebra con una mascarilla tibia de nutrición profunda.';
  }

  return {
    clima: {
      temperatura_celsius: temp,
      humedad_relativa: humedad,
      indice_uv: uv,
      condicion_texto: 'Parcialmente nublado con bruma fresca'
    },
    alerta_ambiental: alertaAmbiental,
    rutina_am: rutinaAm,
    rutina_pm: rutinaPm,
    consejo_zen: consejoZen
  };
}

export function calcularPredictorCicloCapilarOpal(
  historialServicios: any[] = []
): PredictorCicloCapilarOpal {
  let diasDesdeUltimo = 18;
  let ultimoServicio = 'Tratamiento Iluminación & Balayage';

  if (historialServicios && historialServicios.length > 0) {
    const ultimo = historialServicios[0];
    if (ultimo.created_at) {
      const diffMs = Date.now() - new Date(ultimo.created_at).getTime();
      diasDesdeUltimo = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }
    if (ultimo.oatc_tickets && ultimo.oatc_tickets.length > 0) {
      ultimoServicio = ultimo.oatc_tickets[0].descripcion || ultimoServicio;
    }
  }

  if (diasDesdeUltimo >= 40) {
    return {
      dias_desde_ultimo_servicio: diasDesdeUltimo,
      ultimo_servicio_nombre: ultimoServicio,
      proximo_servicio_recomendado: 'Baño de Brillo & Retoque de Raíz',
      dias_restantes_estimados: 0,
      nivel_urgencia: 'RECOMENDADO_URGENTE',
      motivo_tecnico: 'La oxidación natural por luz y lavados ha alcanzado las 6 semanas. La cutícula requiere reposición de pigmento y lípidos.',
      accion_sugerida: 'Agendar cita de matiz y rescate de brillo esta semana.'
    };
  } else if (diasDesdeUltimo >= 20) {
    return {
      dias_desde_ultimo_servicio: diasDesdeUltimo,
      ultimo_servicio_nombre: ultimoServicio,
      proximo_servicio_recomendado: 'Nutrición Molecular Profunda en Salón',
      dias_restantes_estimados: Math.max(1, 30 - diasDesdeUltimo),
      nivel_urgencia: 'IDEAL',
      motivo_tecnico: 'El sellado del servicio previo comienza a descender. Una terapia de hidratación en salón prolongará el color y evitará puntas abiertas.',
      accion_sugerida: 'Ventana óptima para reservar una sesión zen de nutrición capilar.'
    };
  } else {
    return {
      dias_desde_ultimo_servicio: diasDesdeUltimo,
      ultimo_servicio_nombre: ultimoServicio,
      proximo_servicio_recomendado: 'Mantenimiento Preventivo en Santuario Casa',
      dias_restantes_estimados: 25 - diasDesdeUltimo,
      nivel_urgencia: 'PREVENTIVO',
      motivo_tecnico: 'Tu fibra se encuentra en su fase óptima post-servicio. Mantén el cuidado con tus rutinas AM/PM.',
      accion_sugerida: 'Continúa con tus mascarillas semanales en casa.'
    };
  }
}

export function procesarLuminaCopilotChatOpal(
  historial: MensajeLuminaCopilot[],
  mensajeUsuario: string
): MensajeLuminaCopilot {
  const q = mensajeUsuario.toLowerCase();
  let respuesta = '';
  let accion = '';

  if (q.includes('sulfato') || q.includes('shampoo') || q.includes('lavar')) {
    respuesta = 'Los sulfatos agresivos (SLS/SLES) arrastran los lípidos naturales de la hebra y aceleran el deslave del color. Te recomiendo limpiadores botánicos con tensioactivos suaves derivados del coco o manzana y pH ácido (4.5 a 5.5).';
    accion = 'Ver productos sin sulfatos recomendados';
  } else if (q.includes('decolor') || q.includes('rubio') || q.includes('cenizo') || q.includes('tinte')) {
    respuesta = 'Tras un proceso de decoloración o aclarado, los puentes de disulfuro necesitan soporte con tecnología Plex. Evita el agua excesivamente caliente y utiliza una mascarilla con pigmentos violetas o azules solo una vez cada 10 días para no sobrecargar de cenizo.';
    accion = 'Revisar diagnóstico de porosidad';
  } else if (q.includes('frizz') || q.includes('humedad') || q.includes('volumen')) {
    respuesta = 'El frizz es un síntoma de que la cutícula tiene sed y busca la humedad del aire ambiental. Sellar con un aceite hidrofóbico ligero (jojoba o argán) sobre el cabello ligeramente húmedo creará una barrera protectora invisible.';
    accion = 'Iniciar temporizador de mascarilla anti-frizz (10 min)';
  } else if (q.includes('caida') || q.includes('cuero') || q.includes('crecimiento')) {
    respuesta = 'La salud capilar nace en el folículo. Estimular la microcirculación mediante un masaje con yemas de dedos durante 3 minutos todas las noches oxigena la raíz y favorece un crecimiento fuerte y resistente.';
    accion = 'Comenzar masaje capilar guiado (3 min)';
  } else {
    respuesta = `Comprendo tu inquietud sobre el cuidado de tu cabello. Como tu asesor biotecnológico LuminaHQ, sugiero mantener una rutina balanceada entre nutrición lipídica (para flexibilidad) e hidratación (para brillo). ¿Deseas analizar un ingrediente específico o tu diagnóstico capilar?`;
  }

  return {
    id: `lumina-ai-${Date.now()}`,
    emisor: 'LUMINA_AI',
    texto: respuesta,
    timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
    sugerencia_accion: accion
  };
}

// ==========================================
// 💎 3. PERSISTENCIA & CONFIGURACIÓN
// ==========================================

const DEFAULT_PREFERENCIA: PreferenciaSensorialCliente = {
  modo_interaccion: 'ZEN_SILENCIO',
  bebida_preferida: 'Café de especialidad americano',
  aroma_preferido: 'Eucalipto & Lavanda',
  sensibilidades_alergias: ['Cuero cabelludo reactivo', 'Preferencia sin sulfatos'],
  tipo_cabello: 'ONDULADO',
  frecuencia_lavado: 'CADA_2_DIAS',
  exposicion_calor: 'MODERADA',
  meta_principal: 'HIDRATACION_PROFUNDA',
  notas_personales: 'Prefiero ambiente relajante y música suave durante mi atención.'
};

export function cargarPreferenciaSensorial(
  clienteId: string,
  notasExistentes?: string
): PreferenciaSensorialCliente {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCIA;

  const storageKey = `vaikuntha_lifestyle_pref_${clienteId}`;
  const saved = localStorage.getItem(storageKey);

  if (saved) {
    try {
      return { ...DEFAULT_PREFERENCIA, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error parseando preferencias lifestyle guardadas:', e);
    }
  }

  // Intentar parsear de notas si tiene formato JSON
  if (notasExistentes && notasExistentes.startsWith('{') && notasExistentes.includes('modo_interaccion')) {
    try {
      return { ...DEFAULT_PREFERENCIA, ...JSON.parse(notasExistentes) };
    } catch (e) {
      // Notas libres regulares
    }
  }

  return DEFAULT_PREFERENCIA;
}

export async function guardarPreferenciaSensorial(
  clienteId: string,
  preferencias: PreferenciaSensorialCliente
): Promise<boolean> {
  if (typeof window !== 'undefined') {
    const storageKey = `vaikuntha_lifestyle_pref_${clienteId}`;
    localStorage.setItem(storageKey, JSON.stringify(preferencias));
  }

  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('clientes')
      .update({
        notas: JSON.stringify(preferencias)
      })
      .eq('id', clienteId);

    if (error) {
      console.warn('Advertencia al guardar preferencias en Supabase:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.error('Error al sincronizar preferencias de cliente:', e);
    return false;
  }
}

export function calcularVitalidadCapilarStitch(
  preferencias: PreferenciaSensorialCliente,
  diasUltimoServicio: number
): VitalidadCapilarStitch {
  let score = 88;
  let hidratacion = 85;
  let nutricion = 82;
  let proteccion = 90;

  if (preferencias.exposicion_calor === 'DIARIA') {
    proteccion -= 18;
    score -= 8;
  } else if (preferencias.exposicion_calor === 'MODERADA') {
    proteccion -= 6;
  }

  if (preferencias.frecuencia_lavado === 'DIARIA') {
    nutricion -= 10;
  }

  if (diasUltimoServicio > 30) {
    hidratacion -= 14;
    nutricion -= 12;
    score -= 10;
  } else if (diasUltimoServicio > 15) {
    hidratacion -= 6;
  }

  const cuticula: 'SELLADA' | 'LIGERAMENTE_ABIERTA' | 'POROSA' = 
    score >= 80 ? 'SELLADA' : score >= 65 ? 'LIGERAMENTE_ABIERTA' : 'POROSA';

  return {
    score_general: Math.max(30, Math.min(99, score)),
    hidratacion: Math.max(30, Math.min(99, hidratacion)),
    nutricion_lipidica: Math.max(30, Math.min(99, nutricion)),
    proteccion_termica: Math.max(30, Math.min(99, proteccion)),
    estado_cuticula: cuticula,
    ultimo_calculo: new Date().toLocaleDateString('es-PE')
  };
}

export function obtenerConfiguracionLuminaHq(): LuminaHqPluginConfig {
  if (typeof window === 'undefined') {
    return {
      activo: false,
      version: '2.4.0-biotech',
      modulos_habilitados: {
        scanner_biometrico: true,
        copilot_ai: true,
        expediente_clinico: true
      }
    };
  }

  const saved = localStorage.getItem('vaikuntha_luminahq_plugin_config');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }

  return {
    activo: false,
    version: '2.4.0-biotech',
    modulos_habilitados: {
      scanner_biometrico: true,
      copilot_ai: true,
      expediente_clinico: true
    }
  };
}

export function guardarConfiguracionLuminaHq(config: LuminaHqPluginConfig): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('vaikuntha_luminahq_plugin_config', JSON.stringify(config));
}
