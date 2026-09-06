import { createClient } from '@/lib/supabase/client';
import { 
  AdminExecutiveBriefingInput, 
  AdminExecutiveBriefingOutput, 
  PedidoFormulaLabInput, 
  FormulaLabDespachoOutput,
  PinAutorizacionRequest,
  PinAutorizacionResponse,
  InsumoFormulaReceta
} from '@/types/opalMobile';

/**
 * Agente Opal Executive Copilot para la Suite Móvil de ADMIN.
 * Sintetiza el estado de la sede, detecta cuellos de botella y recomienda acciones gerenciales.
 */
export async function procesarAdminExecutiveBriefingOpal(
  input: AdminExecutiveBriefingInput
): Promise<AdminExecutiveBriefingOutput> {
  const meta = input.meta_ventas_hoy || 2500;
  const pctMeta = Math.min(100, Math.round((input.total_ventas_hoy / Math.max(1, meta)) * 100));

  const totalColabs = Math.max(1, input.colaboradores_activos_count);
  const ocupacion = Math.min(100, Math.round((input.colaboradores_en_atencion_count / totalColabs) * 100));

  let estado: 'OPTIMO' | 'ALTA_DEMANDA' | 'CUELLO_BOTELLA' | 'ATENCION_REQUERIDA' = 'OPTIMO';
  let alertaCuello: string | undefined = undefined;
  const acciones: string[] = [];

  // 1. Detección de cuellos de botella
  if (input.clientes_en_espera_count >= 3 && ocupacion >= 80) {
    estado = 'CUELLO_BOTELLA';
    alertaCuello = `Saturación en piso: ${input.clientes_en_espera_count} clientes en cola con ${ocupacion}% de sillones ocupados.`;
    acciones.push('Agilizar servicios próximos a finalizar y ofrecer cortesía del bar a clientes en espera.');
  } else if (ocupacion >= 75) {
    estado = 'ALTA_DEMANDA';
    acciones.push('Alta afluencia de clientes. Monitorear tiempos de exposición en sillón.');
  }

  // 2. Liquidaciones pendientes
  if (input.liquidaciones_pendientes_count > 0) {
    acciones.push(`Tienes ${input.liquidaciones_pendientes_count} solicitudes de liquidación pendientes de autorización.`);
  }

  // 3. Resumen Ejecutivo
  const resumen = `Hoy la sede ${input.sede_nombre} registra S/ ${input.total_ventas_hoy.toFixed(2)} (${pctMeta}% de la meta), con ${input.oatcs_activas_count} órdenes en curso y ${input.colaboradores_en_atencion_count} de ${input.colaboradores_activos_count} especialistas atendiendo.`;

  return {
    resumen_ejecutivo: resumen,
    alerta_cuello_botella: alertaCuello,
    porcentaje_cumplimiento_meta: pctMeta,
    tasa_ocupacion_sillones: ocupacion,
    estado_operativo_sede: estado,
    acciones_recomendadas: acciones.length > 0 ? acciones : ['Operación equilibrada en piso y tiempos normales de atención.']
  };
}

/**
 * Agente Opal Floor & Lab Assistant para la Suite Móvil de SOPORTE.
 * Desglosa fórmulas químicas complejas en recetas medibles para la balanza asistida.
 */
export async function procesarFormulaLabDespachoOpal(
  input: PedidoFormulaLabInput
): Promise<FormulaLabDespachoOutput> {
  const query = (input.formula_solicitada + ' ' + input.servicio_nombre).toUpperCase();

  let receta: InsumoFormulaReceta[] = [];
  let ratio = '1:2';
  let tiempoPose = 35;
  let consejo = 'Mezclar con espátula no metálica hasta lograr consistencia homogénea sin grumos.';

  if (query.includes('DECOLORA') || query.includes('BALAYAGE') || query.includes('MECHAS')) {
    const vol = query.includes('30') ? '30 Vol.' : query.includes('40') ? '40 Vol.' : '20 Vol.';
    receta = [
      {
        id: 'ins-01',
        nombre: 'Polvo Decolorante Premium Dust-Free',
        gramos_requeridos: 30,
        categoria: 'POLVO_DECOLORANTE',
        instruccion: 'Tarar el bowl plástico a 0.0g y verter el polvo.'
      },
      {
        id: 'ins-02',
        nombre: `Oxidante en Crema ${vol}`,
        gramos_requeridos: 60,
        categoria: 'OXIDANTE',
        instruccion: 'Añadir el peróxido lentamente hasta alcanzar el peso objetivo.'
      },
      {
        id: 'ins-03',
        nombre: 'Protector Plex Anti-Quiebre',
        gramos_requeridos: 4,
        categoria: 'TRATAMIENTO',
        instruccion: 'Incorporar y homogeneizar antes de entregar al sillón.'
      }
    ];
    ratio = '1:2';
    tiempoPose = 45;
    consejo = 'Verificar con cronómetro activo en sillón. No exceder 50 minutos de exposición.';
  } else if (query.includes('TINTE') || query.includes('COLOR') || query.includes('CANAS')) {
    receta = [
      {
        id: 'ins-04',
        nombre: 'Tubo de Coloración Permanente',
        gramos_requeridos: 50,
        categoria: 'TINTE',
        instruccion: 'Pesar la crema colorante en el bowl de tinte.'
      },
      {
        id: 'ins-05',
        nombre: 'Oxidante en Crema 20 Vol.',
        gramos_requeridos: 75,
        categoria: 'OXIDANTE',
        instruccion: 'Verter oxidante respetando la proporción 1:1.5.'
      }
    ];
    ratio = '1:1.5';
    tiempoPose = 35;
    consejo = 'Aplicar inmediatamente después del batido para no perder potencia oxidativa.';
  } else {
    // Tratamiento capilar / Botox
    receta = [
      {
        id: 'ins-06',
        nombre: 'Fórmula Reconstructora / Ampolla Nutritiva',
        gramos_requeridos: 40,
        categoria: 'TRATAMIENTO',
        instruccion: 'Dosificar crema concentrada.'
      },
      {
        id: 'ins-07',
        nombre: 'Activador Térmico Sellador',
        gramos_requeridos: 10,
        categoria: 'TRATAMIENTO',
        instruccion: 'Emulsionar enérgicamente.'
      }
    ];
    ratio = '4:1';
    tiempoPose = 20;
    consejo = 'Recomendar lavado con agua tibia en el lavadero de bacha.';
  }

  return {
    receta_desglosada: receta,
    ratio_mezcla: ratio,
    tolerancia_gramos: 2,
    tiempo_pose_recomendado_min: tiempoPose,
    consejo_tecnico: consejo
  };
}

/**
 * Validador de PIN de Seguridad Gerencial de 4 Dígitos.
 * Protege pagos de liquidaciones, anulaciones y modificaciones de personal en móvil.
 */
export async function validarPinGerencialOpal(
  req: PinAutorizacionRequest
): Promise<PinAutorizacionResponse> {
  const pin = req.pin_ingresado?.trim();
  if (!pin || pin.length !== 4) {
    return {
      autorizado: false,
      mensaje: 'El PIN debe contener exactamente 4 dígitos numéricos.',
      timestamp: new Date().toISOString()
    };
  }

  try {
    const supabase = createClient();
    if (req.agente_id) {
      const { data: ag } = await supabase
        .from('agentes')
        .select('id, pin, rol')
        .eq('id', req.agente_id)
        .maybeSingle();

      // Si el agente tiene PIN configurado en BD
      if (ag?.pin) {
        if (ag.pin === pin) {
          return {
            autorizado: true,
            mensaje: 'PIN Gerencial validado con éxito.',
            timestamp: new Date().toISOString()
          };
        }
      }
    }

    // PIN Maestro de Contingencia para Admin/Superadmin ('1234' o variable de entorno)
    const pinMaestro = process.env.NEXT_PUBLIC_ADMIN_PIN || '1234';
    if (pin === pinMaestro) {
      return {
        autorizado: true,
        mensaje: 'PIN Maestro autorizado para operación gerencial.',
        timestamp: new Date().toISOString()
      };
    }

    return {
      autorizado: false,
      mensaje: 'PIN incorrecto. Verifica los dígitos e intenta nuevamente.',
      timestamp: new Date().toISOString()
    };
  } catch (err: any) {
    console.error('Error validando PIN gerencial:', err);
    return {
      autorizado: false,
      mensaje: 'Error de conexión al validar PIN.',
      timestamp: new Date().toISOString()
    };
  }
}
