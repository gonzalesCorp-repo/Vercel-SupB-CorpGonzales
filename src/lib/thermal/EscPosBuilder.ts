/**
 * ==============================================================================
 * ESC/POS THERMAL PRINTER BINARY BUILDER (VAIKUNTHA ERP ENGINE)
 * ==============================================================================
 * Generador universal e isomórfico de secuencias binarias ESC/POS (Uint8Array).
 * Compatible con impresoras térmicas genéricas de AliExpress (58mm y 80mm),
 * Epson, Xprinter, Rongta, GOOJPRT y POS-58/POS-80 vía USB, BLE o TCP 9100.
 */

export type AnchoPapel = '58mm' | '80mm';
export type Alineacion = 'left' | 'center' | 'right';
export type FuenteTipo = 'FontA' | 'FontB';

export interface OpcionesTicket {
  ancho: AnchoPapel;
  abrirCajon?: boolean;
  cortarPapel?: boolean;
  tamanoFuente?: 'normal' | 'pequena';
  margenIzquierdoEspacios?: number; // 0 a 8 espacios para calibración
  fuenteTipo?: FuenteTipo; // Font A (12x24) vs Font B (9x17)
  columnasCustom?: number; // 30, 32, 38, 42, 48
}

// Comandos ESC/POS estándar
const CMD = {
  INIT: [0x1b, 0x40], // ESC @ - Inicializar impresora
  CODEPAGE_CP437: [0x1b, 0x74, 0x00], // ESC t 0 - Tabla de caracteres estándar CP437
  RESET_LEFT_MARGIN: [0x1d, 0x4c, 0x00, 0x00], // GS L 0 0 - Forzar margen izquierdo a 0 dots
  SET_PRINT_AREA_58MM: [0x1d, 0x57, 0x80, 0x01], // GS W 384 dots - Ancho 100% en 58mm
  SET_PRINT_AREA_80MM: [0x1d, 0x57, 0x40, 0x02], // GS W 576 dots - Ancho 100% en 80mm
  SELECT_FONT_A: [0x1b, 0x4d, 0x00], // ESC M 0 - Fuente A (Estándar 12x24)
  SELECT_FONT_B: [0x1b, 0x4d, 0x01], // ESC M 1 - Fuente B (Compacta 9x17)
  ALIGN_LEFT: [0x1b, 0x61, 0x00], // ESC a 0
  ALIGN_CENTER: [0x1b, 0x61, 0x01], // ESC a 1
  ALIGN_RIGHT: [0x1b, 0x61, 0x02], // ESC a 2
  BOLD_ON: [0x1b, 0x45, 0x01], // ESC E 1
  BOLD_OFF: [0x1b, 0x45, 0x00], // ESC E 0
  DOUBLE_HEIGHT_ON: [0x1b, 0x21, 0x10], // ESC ! 16
  DOUBLE_WIDTH_ON: [0x1b, 0x21, 0x20], // ESC ! 32
  DOUBLE_SIZE_ON: [0x1b, 0x21, 0x30], // ESC ! 48 (Doble alto y ancho)
  NORMAL_SIZE: [0x1b, 0x21, 0x00], // ESC ! 0 (Tamaño normal)
  DRAWER_KICK: [0x1b, 0x70, 0x00, 0x19, 0xfa], // ESC p 0 25 250 - Pulso para abrir cajón
  CUT_FULL: [0x1d, 0x56, 0x00], // GS V 0 - Corte total
  CUT_PARTIAL: [0x1d, 0x56, 0x01], // GS V 1 - Corte parcial
  FEED_LINES: (n: number) => [0x1b, 0x64, n], // ESC d n - Alimentar n líneas
};

/**
 * Sanitiza texto para impresoras térmicas de bajo costo reemplazando caracteres diacríticos
 */
export function sanitizarTextoTermico(texto: string): string {
  if (!texto) return '';
  return texto
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/[ÁÀÄÂ]/g, 'A')
    .replace(/[ÉÈËÊ]/g, 'E')
    .replace(/[ÍÌÏÎ]/g, 'I')
    .replace(/[ÓÒÖÔ]/g, 'O')
    .replace(/[ÚÙÜÛ]/g, 'U')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/[–—]/g, '-')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
}

export class EscPosBuilder {
  private buffer: number[] = [];
  private ancho: AnchoPapel;
  private maxColumnas: number;
  private margenOffset: string;
  private encoder: TextEncoder;

  constructor(opciones: OpcionesTicket = { ancho: '58mm' }) {
    this.ancho = opciones.ancho;
    const margenSpaces = Math.max(0, Math.min(10, opciones.margenIzquierdoEspacios || 0));
    this.margenOffset = ' '.repeat(margenSpaces);

    // Si se especifican columnas custom, usar esas; sino según el ancho y tipo de fuente
    if (opciones.columnasCustom && opciones.columnasCustom > 0) {
      this.maxColumnas = Math.max(20, opciones.columnasCustom - margenSpaces);
    } else if (opciones.fuenteTipo === 'FontB') {
      this.maxColumnas = (opciones.ancho === '58mm' ? 42 : 56) - margenSpaces;
    } else {
      this.maxColumnas = (opciones.ancho === '58mm' ? 32 : 48) - margenSpaces;
    }

    this.encoder = new TextEncoder();
    this.inicializar(opciones);
  }

  private inicializar(opciones: OpcionesTicket) {
    this.buffer.push(...CMD.INIT);
    this.buffer.push(...CMD.CODEPAGE_CP437);
    this.buffer.push(...CMD.RESET_LEFT_MARGIN);

    // Fijar el ancho del área imprimible al 100%
    if (opciones.ancho === '80mm') {
      this.buffer.push(...CMD.SET_PRINT_AREA_80MM);
    } else {
      this.buffer.push(...CMD.SET_PRINT_AREA_58MM);
    }

    // Seleccionar tipo de fuente
    if (opciones.fuenteTipo === 'FontB') {
      this.buffer.push(...CMD.SELECT_FONT_B);
    } else {
      this.buffer.push(...CMD.SELECT_FONT_A);
    }

    this.buffer.push(...CMD.NORMAL_SIZE);

    if (opciones.abrirCajon) {
      this.buffer.push(...CMD.DRAWER_KICK);
    }
  }

  public alinear(alineacion: Alineacion): this {
    if (alineacion === 'center') this.buffer.push(...CMD.ALIGN_CENTER);
    else if (alineacion === 'right') this.buffer.push(...CMD.ALIGN_RIGHT);
    else this.buffer.push(...CMD.ALIGN_LEFT);
    return this;
  }

  public negrita(activar: boolean = true): this {
    this.buffer.push(...(activar ? CMD.BOLD_ON : CMD.BOLD_OFF));
    return this;
  }

  public tamanoDoble(activar: boolean = true): this {
    this.buffer.push(...(activar ? CMD.DOUBLE_SIZE_ON : CMD.NORMAL_SIZE));
    return this;
  }

  public texto(str: string): this {
    const seguro = sanitizarTextoTermico(str);
    const bytes = this.encoder.encode(seguro);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  public linea(str: string = ''): this {
    if (this.margenOffset.length > 0 && str.length > 0) {
      this.texto(this.margenOffset);
    }
    this.texto(str);
    this.buffer.push(0x0a); // LF (Line Feed)
    return this;
  }

  public alimentarLineas(n: number = 2): this {
    this.buffer.push(...CMD.FEED_LINES(n));
    return this;
  }

  public separador(caracter: string = '-'): this {
    const lineaGuiones = caracter.repeat(this.maxColumnas);
    return this.linea(lineaGuiones);
  }

  public filaDosColumnas(colIzquierda: string, colDerecha: string): this {
    const izq = sanitizarTextoTermico(colIzquierda);
    const der = sanitizarTextoTermico(colDerecha);
    const espacioDisponible = this.maxColumnas - der.length;

    if (espacioDisponible <= 0) {
      this.linea(izq);
      this.linea(' '.repeat(Math.max(0, this.maxColumnas - der.length)) + der);
      return this;
    }

    const izqTruncado = izq.substring(0, Math.max(0, espacioDisponible - 1));
    const espacios = ' '.repeat(Math.max(1, this.maxColumnas - izqTruncado.length - der.length));
    return this.linea(izqTruncado + espacios + der);
  }

  public filaItem(cantidad: number, nombre: string, total: string): this {
    const cantStr = `${cantidad}x `;
    const totalStr = ` ${total}`;
    const espacioNombre = this.maxColumnas - cantStr.length - totalStr.length;
    const nombreLimpio = sanitizarTextoTermico(nombre);

    if (nombreLimpio.length <= espacioNombre) {
      const espacios = ' '.repeat(Math.max(1, espacioNombre - nombreLimpio.length + 1));
      return this.linea(cantStr + nombreLimpio + espacios + total.trim());
    }

    // Si el nombre es largo, imprimir en dos líneas
    this.linea(cantStr + nombreLimpio.substring(0, espacioNombre));
    const resto = nombreLimpio.substring(espacioNombre);
    const padding = ' '.repeat(Math.max(1, this.maxColumnas - resto.length - totalStr.length));
    return this.linea(resto + padding + total.trim());
  }

  public cortePapel(parcial: boolean = false): this {
    this.alimentarLineas(4);
    this.buffer.push(...(parcial ? CMD.CUT_PARTIAL : CMD.CUT_FULL));
    return this;
  }

  public abrirCajon(): this {
    this.buffer.push(...CMD.DRAWER_KICK);
    return this;
  }

  /**
   * Genera el arreglo de bytes Uint8Array listo para despachar por Web Serial, Web BLE o Socket TCP
   */
  public compilar(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}
