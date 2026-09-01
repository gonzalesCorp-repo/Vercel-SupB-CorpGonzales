/**
 * Utilidades para formatear horarios y seriales de tiempo provenientes de Google Sheets / Excel
 */

/**
 * Convierte un serial numérico de tiempo de hoja de cálculo (fracción de 24 horas, ej. 0.4166667 = 10:00 AM)
 * a formato legible 'hh:mm am/pm'.
 */
export function formatSheetTimeToAmPm(serialOrString: number | string | null | undefined): string {
  if (serialOrString === null || serialOrString === undefined || serialOrString === '') {
    return '--:--';
  }

  // Si ya es un string con formato de hora (ej: "09:00", "09:00:00", "10:00 AM")
  if (typeof serialOrString === 'string') {
    const trimmed = serialOrString.trim();
    if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
      return trimmed;
    }
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return formatHoursMinutesToAmPm(h, m);
      }
    }
    const num = parseFloat(trimmed);
    if (!isNaN(num) && num >= 0 && num <= 1) {
      return formatFractionDayToAmPm(num);
    }
    return trimmed;
  }

  // Si es número (fracción de día entre 0 y 1 o mayor si incluye fecha)
  if (typeof serialOrString === 'number') {
    const fraction = serialOrString % 1;
    return formatFractionDayToAmPm(fraction === 0 && serialOrString > 0 ? serialOrString : fraction);
  }

  return '--:--';
}

function formatFractionDayToAmPm(fraction: number): string {
  const totalMinutes = Math.round(fraction * 24 * 60);
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return formatHoursMinutesToAmPm(hours24, minutes);
}

function formatHoursMinutesToAmPm(hours24: number, minutes: number): string {
  const period = hours24 >= 12 ? 'pm' : 'am';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours12}:${minStr} ${period}`;
}

/**
 * Formatea el horario completo de un colaborador a partir de sus atributos JSONB
 */
export function formatHorarioAgente(atributos: any): string {
  if (!atributos?.horario) return 'Horario regular';
  const h = atributos.horario;
  const entrada = formatSheetTimeToAmPm(h.entrada);
  const salida = formatSheetTimeToAmPm(h.salida);
  if (entrada === '--:--' && salida === '--:--') {
    return 'Horario flexible';
  }
  return `${entrada} - ${salida}`;
}

/**
 * Formatea el día de descanso del colaborador
 */
export function formatDescansoAgente(atributos: any): string {
  if (!atributos?.horario) return 'Según programación';
  const descanso = atributos.horario.descanso;
  if (!descanso) return 'Según programación';
  if (typeof descanso === 'string') return descanso;
  return String(descanso);
}
