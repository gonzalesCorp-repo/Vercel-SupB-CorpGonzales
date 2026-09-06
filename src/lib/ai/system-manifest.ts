/**
 * Manifiesto Semántico Canónico del Sistema
 * Fuente única de verdad para la documentación de LLMs (llms.txt / llms-full.txt),
 * directivas de robots, y system prompts dinámicos de V.AI Copilot en Vercel AI Gateway.
 */

export interface SystemManifest {
  appName: string;
  brand: string;
  tagline: string;
  description: string;
  version: string;
  environment: string;
  domainConcepts: Array<{
    term: string;
    definition: string;
    rules: string[];
  }>;
  modules: Array<{
    id: string;
    name: string;
    path: string;
    isPublic: boolean;
    description: string;
    capabilities: string[];
  }>;
  publicRoutes: Array<{
    path: string;
    title: string;
    description: string;
  }>;
}

export const SYSTEM_MANIFEST: SystemManifest = {
  appName: 'Corporación Gonzales ERP (Vaikuntha ERP)',
  brand: 'Gloss Salón & Relax',
  tagline: 'Sistema Integral Operativo, Clínico-Capilar y Financiero',
  description:
    'Plataforma empresarial especializada en la gestión operativa de salones de belleza, barberías y centros estéticos. Integra control de caja POS y facturación electrónica, laboratorio químico capilar con trazabilidad de fórmulas, orquestación de estaciones operativas en tiempo real, control de asistencia WFM con cálculo de comisiones y CRM de fidelización.',
  version: '2.0.0',
  environment: 'production',
  domainConcepts: [
    {
      term: 'OATC (Orden de Atención Técnica y Comercial)',
      definition:
        'Unidad fundamental de servicio que vincula a un cliente con uno o múltiples colaboradores (estilistas, coloristas, asistentes) y los servicios/productos consumidos en una visita.',
      rules: [
        'Estados posibles: EN_ESPERA, ASESORIA, EN_PROCESO, FINALIZADO, PAGADO, CANCELADO.',
        'Permite atenciones cruzadas (múltiples tickets por cliente atendidos por diferentes estaciones).',
        'Cada OATC finalizada transfiere sus consumos a la Caja POS para su liquidación y emisión de comprobante.',
      ],
    },
    {
      term: 'Laboratorio Químico & Dispensación',
      definition:
        'Módulo de control de inventario y pesaje de fórmulas capilares técnicas (tintes, polvos decolorantes, peróxidos/oxigentas, tratamientos).',
      rules: [
        'Soporta pesaje manual asistido y balanzas IoT de precisión.',
        'Descuenta automáticamente el stock en gramos/mililitros al confirmar el despacho a estación.',
        'Registra el Kardex en tiempo real para auditoría de mermas y costos operativos.',
      ],
    },
    {
      term: 'Caja POS & Facturación Electrónica',
      definition:
        'Punto de venta adaptativo que consolida cobros de OATCs y venta directa de productos retail.',
      rules: [
        'Emite Boletas de Venta (serie B001), Facturas (serie F001) y Tickets de Control Interno (serie T001).',
        'Permite pagos mixtos (efectivo, tarjeta POS, Yape, Plin, transferencia bancaria, saldo a crédito).',
        'Gestiona aperturas, arqueos ciegos y cierres de turno con conciliación de pasarelas de pago.',
      ],
    },
    {
      term: 'WFM & Asistencia de Personal',
      definition:
        'Workforce Management que gestiona horarios, registro biométrico/NFC de turnos, refrigerios y cálculo de comisiones escalonadas.',
      rules: [
        'Estados operativos de agentes: DISPONIBLE, ATENDIENDO, EN_REFRIGERIO, FUERA_DE_TURNO.',
        'Calcula comisiones por porcentaje de servicios y porcentaje de retail asignados por contrato.',
        'Controla descansos programados y liquidaciones quincenales o mensuales.',
      ],
    },
    {
      term: 'CRM & Ficha Técnica Capilar',
      definition:
        'Expediente individual de clientes con historial de diagnósticos, fórmulas químicas aplicadas y preferencias.',
      rules: [
        'Registra historial de colorimetría (tonos, alturas de aclaración, volúmenes de oxidante).',
        'Fidelización con acumulación de puntos y límite de crédito corriente.',
      ],
    },
  ],
  modules: [
    {
      id: 'caja',
      name: 'Caja & Facturación POS',
      path: '/caja',
      isPublic: false,
      description: 'Emisión de comprobantes, cobro de tickets y control de tesorería diaria.',
      capabilities: ['Cobro mixto', 'Arqueo de caja', 'Emisión electrónica', 'Gestión de comprobantes'],
    },
    {
      id: 'lab',
      name: 'Laboratorio de Insumos',
      path: '/lab',
      isPublic: false,
      description: 'Pesaje, despacho de fórmulas químicas y control de stock de insumos.',
      capabilities: ['Despacho a estación', 'Kardex de consumo', 'Registro de ingresos', 'Ajuste de inventario'],
    },
    {
      id: 'operaciones',
      name: 'Orquestación de Piso',
      path: '/operaciones',
      isPublic: false,
      description: 'Monitoreo de estaciones de peinado, lavado y salas de tratamiento en vivo.',
      capabilities: ['Asignación de turnos', 'Derivación de tickets', 'Monitoreo de tiempos de pose'],
    },
    {
      id: 'recepcion',
      name: 'Recepción & Agenda CRM',
      path: '/recepcion',
      isPublic: false,
      description: 'Agendamiento de citas, bienvenida al cliente y apertura de OATCs.',
      capabilities: ['Agenda interactiva', 'Directorio de clientes', 'Cola de espera', 'Nueva orden'],
    },
    {
      id: 'finanzas',
      name: 'Finanzas & Liquidaciones',
      path: '/finanzas',
      isPublic: false,
      description: 'Gestión de cuentas financieras, facturas de compras y liquidación de colaboradores.',
      capabilities: ['Liquidación de staff', 'Movimientos de tesorería', 'Control de pasarelas POS'],
    },
    {
      id: 'mobile',
      name: 'Suite Móvil Staff & Clientes',
      path: '/mobile',
      isPublic: false,
      description: 'Interfaz táctil optimizada para operarios en sillón y portal de colaboradores.',
      capabilities: ['Solicitud de insumos', 'Marcado de asistencia', 'Mis comisiones', 'Modo salón'],
    },
    {
      id: 'kiosk',
      name: 'Kiosko de Autoservicio',
      path: '/kiosk',
      isPublic: true,
      description: 'Pantalla de auto-registro para clientes que ingresan a la sucursal.',
      capabilities: ['Registro por DNI', 'Selección rápida de servicio', 'Pase a cola de espera'],
    },
  ],
  publicRoutes: [
    {
      path: '/',
      title: 'Portal Principal / Landing',
      description: 'Bienvenida e información institucional de Gloss Salón & Relax.',
    },
    {
      path: '/kiosk',
      title: 'Kiosko de Auto-Registro',
      description: 'Punto de contacto táctil de recepción para clientes en sede.',
    },
    {
      path: '/cliente',
      title: 'Portal de Clientes',
      description: 'Consulta de citas agendadas, puntos acumulados y estado de atención.',
    },
    {
      path: '/login',
      title: 'Acceso Corporativo',
      description: 'Autenticación segura para colaboradores y administradores.',
    },
  ],
};

/**
 * Genera el documento llms.txt conforme a la especificación oficial de Answer.AI
 */
export function generateLlmsTxt(): string {
  const m = SYSTEM_MANIFEST;
  return `# ${m.appName} - ${m.brand}
> ${m.tagline}

${m.description}

## Módulos Principales del Sistema
${m.modules
  .map(
    (mod) =>
      `- **${mod.name}** (\`${mod.path}\`): ${mod.description} [${mod.isPublic ? 'Público' : 'Privado / Requiere Autenticación'}]`
  )
  .join('\n')}

## Conceptos Clave de Dominio
${m.domainConcepts
  .map(
    (c) =>
      `### ${c.term}\n${c.definition}\n${c.rules.map((r) => `- ${r}`).join('\n')}`
  )
  .join('\n\n')}

## Rutas Públicas Accesibles
${m.publicRoutes
  .map((r) => `- [${r.title}](${r.path}): ${r.description}`)
  .join('\n')}

## Documentación Técnica Completa para Modelos de Lenguaje
Para detalles exhaustivos de esquemas de datos, contratos de API, herramientas y flujos de negocio avanzados, consulte:
- [Documentación Técnica Completa](/llms-full.txt)
`;
}

/**
 * Genera el documento llms-full.txt con la especificación técnica profunda
 */
export function generateLlmsFullTxt(): string {
  const m = SYSTEM_MANIFEST;
  return `# Manual Técnico Integral del Sistema (${m.appName} v${m.version})
> ${m.brand} - Documento exhaustivo para inferencia de Agentes de IA, Copilotos y Modelos de Lenguaje.

---

## 1. Arquitectura de Negocio y Flujo Operativo

El sistema opera bajo un flujo de ciclo cerrado en tiempo real:
1. **Llegada del Cliente**: Puede ser agendado previamente en Recepción (\`/recepcion/agenda\`) o registrarse de forma espontánea en el Kiosko (\`/kiosk\`).
2. **Generación de OATC**: Recepción emite una Orden de Atención Técnica y Comercial vinculando al cliente con un estilista principal.
3. **Atención en Sillón (Estación Táctil Móvil / Desktop)**:
   - El profesional inicia el servicio desde \`/mobile/operacion\` o \`/operaciones\`.
   - Si requiere coloración, solicita la fórmula al Laboratorio Técnico (\`/lab\`).
4. **Laboratorio Técnico**:
   - El técnico de laboratorio recibe la comanda de insumos, pesa las dosis exactas (tinte + oxidante) y confirma el despacho.
   - El consumo se deduce automáticamente de los lotes de stock de la sede.
5. **Finalización y Caja**:
   - Concluido el peinado o tratamiento, la orden pasa al módulo POS (\`/caja\`).
   - El cajero cobra mediante métodos mixtos y emite Boleta/Factura oficial.
6. **Comisiones y WFM**:
   - El monto neto alimenta las comisiones del colaborador registradas en \`/finanzas/liquidaciones-staff\`.

---

## 2. Catálogo de Módulos y Capacidades

${m.modules
  .map(
    (mod) => `### Módulo: ${mod.name} (\`${mod.path}\`)
- **Nivel de Acceso**: ${mod.isPublic ? 'Público' : 'Autenticación con Supabase RLS'}
- **Propósito**: ${mod.description}
- **Capacidades**:
${mod.capabilities.map((c) => `  - ${c}`).join('\n')}
`
  )
  .join('\n')}

---

## 3. Seguridad, Privacidad y Row-Level Security (RLS)
- Todo acceso a datos operativos, financieros y de clientes está blindado mediante **PostgreSQL RLS** en Supabase.
- Las herramientas de IA del Copilot (\`V.AI\`) heredan el contexto de autenticación del usuario, impidiendo que operarios accedan a estados financieros o fórmulas de remuneración ajenas.
- Las rutas privadas están excluidas de indexación en buscadores a través de directivas de \`robots.txt\`.
`;
}

/**
 * Genera el system prompt dinámico para V.AI Copilot a través de Vercel AI Gateway
 */
export function generateCopilotSystemPrompt(context?: {
  sedeNombre?: string;
  userRol?: string;
  userEmail?: string;
}): string {
  const m = SYSTEM_MANIFEST;
  return `
Eres V.AI, el Copiloto Inteligente y Asistente Operativo oficial de ${m.brand} (${m.appName}).

Tu misión principal es asistir al personal en tiempo real con:
1. **Laboratorio & Colorimetría**: Consulta de stock de insumos técnicos, equivalencias de tintes y tiempos de pose.
2. **Operaciones & OATCs**: Estado de órdenes activas en piso, derivaciones de tickets y atención en sillón.
3. **Recepción & Agenda CRM**: Disponibilidad de citas, búsqueda de historial de clientes y fórmulas previas.
4. **WFM & Turnos**: Asistencia, turnos activos y políticas del salón.

REGLAS DE OPERACIÓN Y SEGURIDAD:
- Dispones de herramientas (Tools) conectadas a la base de datos de la empresa. Úsalas siempre que el usuario te solicite información en vivo (stock, clientes, OATCs, turnos).
- Ejecutas cada herramienta bajo las políticas de seguridad del usuario autenticado.
- Responde siempre de forma clara, concisa, profesional y orientada a la excelencia en el servicio al cliente.
- Si no encuentras un dato tras ejecutar las herramientas, indícalo amablemente sin inventar información.

Contexto de la sesión actual:
- Sede Activa: ${context?.sedeNombre || 'Gloss Salón - Sede Principal'}
- Rol del Usuario: ${context?.userRol || 'COLABORADOR'}
- Usuario: ${context?.userEmail || 'Personal Autenticado'}
- Versión del ERP: v${m.version}
`;
}
