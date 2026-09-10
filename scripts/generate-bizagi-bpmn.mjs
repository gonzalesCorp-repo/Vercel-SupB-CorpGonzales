import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const outputDir = path.resolve(__dirname, '../docs/procesos_bizagi');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Helper to escape XML special characters
 */
function escapeXml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Builds a complete BPMN 2.0 XML string compatible with Bizagi Modeler
 * Supports: Subprocesses, Intermediate Message & Timer Events, Data Objects & Data Stores
 */
function buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds, dataObjects = [], dataStores = [] }) {
  const processId = `Process_${id}`;
  const collaborationId = `Collaboration_${id}`;
  const participantId = `Participant_${id}`;

  // 1. Process Lanes & Flow Node References
  let laneSetXml = `    <bpmn:laneSet id="LaneSet_${id}">\n`;
  lanes.forEach((lane) => {
    const laneNodeRefs = nodes
      .filter((n) => n.laneId === lane.id)
      .map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
      .join('\n');
    laneSetXml += `      <bpmn:lane id="${lane.id}" name="${escapeXml(lane.name)}">\n${laneNodeRefs}\n      </bpmn:lane>\n`;
  });
  laneSetXml += `    </bpmn:laneSet>\n`;

  // 2. Data Objects & Data Stores definitions in Process
  let dataXml = '';
  dataObjects.forEach((dob) => {
    dataXml += `    <bpmn:dataObject id="DO_${dob.id}" />\n`;
    dataXml += `    <bpmn:dataObjectReference id="${dob.id}" name="${escapeXml(dob.name)}" dataObjectRef="DO_${dob.id}">\n`;
    if (dob.doc) {
      dataXml += `      <bpmn:documentation>${escapeXml(dob.doc)}</bpmn:documentation>\n`;
    }
    dataXml += `    </bpmn:dataObjectReference>\n`;
  });
  dataStores.forEach((ds) => {
    dataXml += `    <bpmn:dataStoreReference id="${ds.id}" name="${escapeXml(ds.name)}">\n`;
    if (ds.doc) {
      dataXml += `      <bpmn:documentation>${escapeXml(ds.doc)}</bpmn:documentation>\n`;
    }
    dataXml += `    </bpmn:dataStoreReference>\n`;
  });

  // 3. Nodes
  let nodesXml = '';
  nodes.forEach((node) => {
    const docXml = node.doc
      ? `\n      <bpmn:documentation>${escapeXml(node.doc)}</bpmn:documentation>`
      : '';
    const incomingXml = flows
      .filter((f) => f.target === node.id)
      .map((f) => `\n      <bpmn:incoming>${f.id}</bpmn:incoming>`)
      .join('');
    const outgoingXml = flows
      .filter((f) => f.source === node.id)
      .map((f) => `\n      <bpmn:outgoing>${f.id}</bpmn:outgoing>`)
      .join('');

    switch (node.type) {
      case 'startEvent':
        nodesXml += `    <bpmn:startEvent id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:startEvent>\n`;
        break;
      case 'endEvent':
        nodesXml += `    <bpmn:endEvent id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:endEvent>\n`;
        break;
      case 'userTask':
        nodesXml += `    <bpmn:userTask id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:userTask>\n`;
        break;
      case 'serviceTask':
        nodesXml += `    <bpmn:serviceTask id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:serviceTask>\n`;
        break;
      case 'manualTask':
        nodesXml += `    <bpmn:manualTask id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:manualTask>\n`;
        break;
      case 'businessRuleTask':
        nodesXml += `    <bpmn:businessRuleTask id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:businessRuleTask>\n`;
        break;
      case 'exclusiveGateway':
        nodesXml += `    <bpmn:exclusiveGateway id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:exclusiveGateway>\n`;
        break;
      case 'parallelGateway':
        nodesXml += `    <bpmn:parallelGateway id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:parallelGateway>\n`;
        break;
      case 'subProcess':
        nodesXml += `    <bpmn:subProcess id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:subProcess>\n`;
        break;
      case 'intermediateCatchMessage':
        nodesXml += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n      <bpmn:messageEventDefinition id="MsgDef_${node.id}" />\n    </bpmn:intermediateCatchEvent>\n`;
        break;
      case 'intermediateThrowMessage':
        nodesXml += `    <bpmn:intermediateThrowEvent id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n      <bpmn:messageEventDefinition id="MsgDef_${node.id}" />\n    </bpmn:intermediateThrowEvent>\n`;
        break;
      case 'intermediateCatchTimer':
        const durationXml = node.duration
          ? `\n        <bpmn:timeDuration xsi:type="bpmn:tFormalExpression">${escapeXml(node.duration)}</bpmn:timeDuration>\n      `
          : '';
        nodesXml += `    <bpmn:intermediateCatchEvent id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n      <bpmn:timerEventDefinition id="TimerDef_${node.id}">${durationXml}</bpmn:timerEventDefinition>\n    </bpmn:intermediateCatchEvent>\n`;
        break;
      default:
        nodesXml += `    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:task>\n`;
    }
  });

  // 4. Sequence Flows
  let flowsXml = '';
  flows.forEach((flow) => {
    const nameAttr = flow.name ? ` name="${escapeXml(flow.name)}"` : '';
    flowsXml += `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.source}" targetRef="${flow.target}"${nameAttr} />\n`;
  });

  // 5. Diagram Visual Layout (BPMNDI)
  let diXml = `  <bpmndi:BPMNDiagram id="BPMNDiagram_${id}">\n`;
  diXml += `    <bpmndi:BPMNPlane id="BPMNPlane_${id}" bpmnElement="${collaborationId}">\n`;

  // Participant shape
  diXml += `      <bpmndi:BPMNShape id="${participantId}_di" bpmnElement="${participantId}" isHorizontal="true">\n`;
  diXml += `        <dc:Bounds x="${poolBounds.x}" y="${poolBounds.y}" width="${poolBounds.width}" height="${poolBounds.height}" />\n`;
  diXml += `      </bpmndi:BPMNShape>\n`;

  // Lane shapes
  lanes.forEach((lane) => {
    diXml += `      <bpmndi:BPMNShape id="${lane.id}_di" bpmnElement="${lane.id}" isHorizontal="true">\n`;
    diXml += `        <dc:Bounds x="${lane.bounds.x}" y="${lane.bounds.y}" width="${lane.bounds.width}" height="${lane.bounds.height}" />\n`;
    diXml += `      </bpmndi:BPMNShape>\n`;
  });

  // Data Objects shapes
  dataObjects.forEach((dob) => {
    diXml += `      <bpmndi:BPMNShape id="${dob.id}_di" bpmnElement="${dob.id}">\n`;
    diXml += `        <dc:Bounds x="${dob.x}" y="${dob.y}" width="${dob.w || 36}" height="${dob.h || 50}" />\n`;
    diXml += `      </bpmndi:BPMNShape>\n`;
  });

  // Data Stores shapes
  dataStores.forEach((ds) => {
    diXml += `      <bpmndi:BPMNShape id="${ds.id}_di" bpmnElement="${ds.id}">\n`;
    diXml += `        <dc:Bounds x="${ds.x}" y="${ds.y}" width="${ds.w || 50}" height="${ds.h || 50}" />\n`;
    diXml += `      </bpmndi:BPMNShape>\n`;
  });

  // Node shapes
  nodes.forEach((node) => {
    const isSubProc = node.type === 'subProcess';
    const subProcAttr = isSubProc ? ' isExpanded="false"' : '';
    diXml += `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}"${subProcAttr}>\n`;
    diXml += `        <dc:Bounds x="${node.x}" y="${node.y}" width="${node.w}" height="${node.h}" />\n`;
    diXml += `      </bpmndi:BPMNShape>\n`;
  });

  // Edge shapes
  flows.forEach((flow) => {
    diXml += `      <bpmndi:BPMNEdge id="${flow.id}_di" bpmnElement="${flow.id}">\n`;
    flow.waypoints.forEach((wp) => {
      diXml += `        <di:waypoint x="${wp.x}" y="${wp.y}" />\n`;
    });
    diXml += `      </bpmndi:BPMNEdge>\n`;
  });

  diXml += `    </bpmndi:BPMNPlane>\n`;
  diXml += `  </bpmndi:BPMNDiagram>\n`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
  id="Definitions_${id}" 
  targetNamespace="http://bpmn.io/schema/bpmn" 
  exporter="Vaikuntha ERP Bizagi BPMN Generator" 
  exporterVersion="2.2">
  <bpmn:collaboration id="${collaborationId}">
    <bpmn:participant id="${participantId}" name="${escapeXml(name)}" processRef="${processId}" />
  </bpmn:collaboration>
  <bpmn:process id="${processId}" name="${escapeXml(name)}" isExecutable="false">
${laneSetXml}
${dataXml}
${nodesXml}
${flowsXml}  </bpmn:process>
${diXml}</bpmn:definitions>`;
}

// =========================================================================
// DIAGRAMA 1: MACROPROCESO OPERATIVO DE SALÓN (ENRIQUECIDO CON SUBPROCESO Y EVENTOS)
// =========================================================================
function generateMacroproceso() {
  const id = 'Macro_Salón';
  const name = 'Macroproceso Operativo de Salón - Vaikuntha ERP (Gloss Salon & Relax)';
  
  const poolBounds = { x: 100, y: 80, width: 3500, height: 1100 };
  const laneHeight = 150;
  
  const lanes = [
    { id: 'Lane_Cli', name: 'Cliente VIP / Visitante', bounds: { x: 130, y: 80, width: 3470, height: laneHeight } },
    { id: 'Lane_Kiosk', name: 'Kiosko Táctil / Concierge Opal AI', bounds: { x: 130, y: 230, width: 3470, height: laneHeight } },
    { id: 'Lane_Recep', name: 'Recepción Central', bounds: { x: 130, y: 380, width: 3470, height: laneHeight } },
    { id: 'Lane_Estil', name: 'Estilista / Cosmiatra en Sillón', bounds: { x: 130, y: 530, width: 3470, height: 180 } },
    { id: 'Lane_Lab', name: 'Laboratorio Químico', bounds: { x: 130, y: 710, width: 3470, height: 130 } },
    { id: 'Lane_Bar', name: 'Bar Boutique & Cafetería', bounds: { x: 130, y: 840, width: 3470, height: 130 } },
    { id: 'Lane_Caja', name: 'Caja POS & Facturación', bounds: { x: 130, y: 970, width: 3470, height: 130 } },
  ];

  const dataObjects = [
    { id: 'DO_TicketOatc', name: 'Ticket OATC Térmico (80mm ESC/POS)', x: 730, y: 335, doc: 'Ticket físico generado con código de barras, QR de seguimiento, estilista y servicios solicitados.' },
    { id: 'DO_FichaCapilar', name: 'Ficha Técnica Capilar', x: 1530, y: 645, doc: 'Diagnóstico biométrico y formulación química registrada en StaffChairsideAssistant.tsx.' },
    { id: 'DO_ComprobanteSunat', name: 'Comprobante SUNAT (Boleta/Factura)', x: 3120, y: 1030, doc: 'Documento tributario emitido electrónicamente con validación fiscal.' }
  ];

  const dataStores = [
    { id: 'DS_SupabaseOatc', name: '(BD) Supabase: public.oatc', x: 900, y: 335, doc: 'Tabla central de órdenes de atención y colas de espera con Realtime Channel.' },
    { id: 'DS_SupabaseColaPet', name: '(BD) Supabase: public.cola_peticiones', x: 1850, y: 645, doc: 'Cola asíncrona para comandas de bar, solicitudes químicas y peticiones WFM.' }
  ];

  const nodes = [
    // 1. Cliente VIP
    { id: 'Start_Cliente', type: 'startEvent', laneId: 'Lane_Cli', name: 'Llegada al Salón', x: 180, y: 135, w: 36, h: 36, doc: 'El cliente VIP o espontáneo ingresa al salón.' },
    { id: 'Task_Cli_CheckIn', type: 'userTask', laneId: 'Lane_Cli', name: 'Interacción en Kiosko / Check-in', x: 260, y: 125, w: 120, h: 60, doc: 'Digita DNI o celular en pantalla táctil del tótem o consulta con recepción.' },
    { id: 'Event_Cli_EsperaTimer', type: 'intermediateCatchTimer', laneId: 'Lane_Cli', name: 'Espera en Lounge (Tiempo Estimado)', x: 650, y: 137, w: 36, h: 36, duration: 'PT10M', doc: 'Espera confortable en lounge; Opal AI estima el tiempo de preparación del sillón.' },
    { id: 'Task_Cli_Sillon', type: 'manualTask', laneId: 'Lane_Cli', name: 'Traslado a Sillón de Estilista', x: 1040, y: 125, w: 120, h: 60, doc: 'El cliente es llamado y se acomoda en la estación del estilista.' },
    { id: 'Task_Cli_Servicio', type: 'manualTask', laneId: 'Lane_Cli', name: 'Recepción de Servicio & Consulta Lumina Club', x: 1720, y: 125, w: 140, h: 60, doc: 'El cliente disfruta su servicio y visualiza en su app móvil recomendaciones y saldo de LuminaCoins.' },
    { id: 'Task_Cli_Pago', type: 'userTask', laneId: 'Lane_Cli', name: 'Validación de Pre-cuenta & Pago', x: 2950, y: 125, w: 130, h: 60, doc: 'El cliente revisa su cuenta en Caja POS y efectúa el pago.' },
    { id: 'End_Cliente', type: 'endEvent', laneId: 'Lane_Cli', name: 'Salida del Salón con Puntos Ganados', x: 3200, y: 135, w: 36, h: 36, doc: 'Atención finalizada satisfactoriamente y acumulación de puntos registrada.' },

    // 2. Kiosko / Concierge Opal AI
    { id: 'Task_Kiosk_Search', type: 'serviceTask', laneId: 'Lane_Kiosk', name: 'Búsqueda de Cliente & Cita en Supabase', x: 260, y: 265, w: 130, h: 60, doc: 'KioskVipCheckIn.tsx consulta public.clientes.' },
    { id: 'Gate_Kiosk_Cita', type: 'exclusiveGateway', laneId: 'Lane_Kiosk', name: '¿Tiene Cita Programada?', x: 430, y: 270, w: 50, h: 50, doc: 'Evalúa si el cliente cuenta con cita en agenda o ingresa por demanda espontánea.' },
    { id: 'Task_Kiosk_Opal', type: 'serviceTask', laneId: 'Lane_Kiosk', name: 'Bienvenida & Sugerencia Opal Concierge', x: 520, y: 265, w: 130, h: 60, doc: 'KioskConciergeAgent.tsx infiere bebida de bienvenida y tiempo estimado.' },
    { id: 'SubProcess_OATC', type: 'subProcess', laneId: 'Lane_Kiosk', name: 'Subproceso: Gestión y Emisión Térmica de OATC', x: 700, y: 255, w: 160, h: 80, doc: 'Subproceso colapsado: Generación de OATC, guardado en Supabase, renderizado ESC/POS y despacho a impresora térmica de sede.' },
    { id: 'Event_Kiosk_MsgLlegada', type: 'intermediateThrowMessage', laneId: 'Lane_Kiosk', name: 'Emitir Llegada de Cliente en Realtime', x: 910, y: 277, w: 36, h: 36, doc: 'Dispara evento en Realtime Channel hacia el monitor central de recepción.' },

    // 3. Recepción Central
    { id: 'Event_Recep_MsgCatch', type: 'intermediateCatchMessage', laneId: 'Lane_Recep', name: 'Recepción Realtime: Cliente en Sala', x: 910, y: 422, w: 36, h: 36, doc: 'QueueMonitor.tsx captura la notificación con aviso sonoro y toast.' },
    { id: 'Gate_Recep_Asig', type: 'exclusiveGateway', laneId: 'Lane_Recep', name: '¿Orden Tiene Estilista Asignado?', x: 1010, y: 415, w: 50, h: 50, doc: 'Verifica si la OATC ya cuenta con especialista asignado.' },
    { id: 'Task_Recep_Asignar', type: 'userTask', laneId: 'Lane_Recep', name: 'Asignación Manual o Reagendamiento', x: 1100, y: 410, w: 130, h: 60, doc: 'Recepción asigna estilista según rotación de piso o brinda tiempo estimado al cliente.' },

    // 4. Estilista / Cosmiatra
    { id: 'Task_Estil_Reclamar', type: 'userTask', laneId: 'Lane_Estil', name: 'Reclamación de Orden en Móvil (TabCola)', x: 1280, y: 560, w: 130, h: 60, doc: 'El estilista visualiza la orden y presiona "Atender en mi Sillón".' },
    { id: 'Task_Estil_Diag', type: 'userTask', laneId: 'Lane_Estil', name: 'Diagnóstico Capilar (StaffChairsideAssistant)', x: 1450, y: 560, w: 140, h: 60, doc: 'Registro de diagnóstico y selección de fórmulas químicas.' },
    { id: 'Gate_Estil_Reqs', type: 'parallelGateway', laneId: 'Lane_Estil', name: 'Requerimientos de Atención', x: 1630, y: 565, w: 50, h: 50, doc: 'Dispara en paralelo solicitud a Laboratorio (químicos) y/o Bar (cortesías).' },
    { id: 'Task_Estil_PedLab', type: 'userTask', laneId: 'Lane_Estil', name: 'Solicitud de Fórmula a Laboratorio', x: 1720, y: 620, w: 130, h: 55, doc: 'Solicita preparación de tintes/decolorantes con gramaje estimado.' },
    { id: 'Task_Estil_PedBar', type: 'userTask', laneId: 'Lane_Estil', name: 'Comanda de Bebida a Bar (TabBar)', x: 1720, y: 520, w: 130, h: 55, doc: 'Comanda de cortesía en cola_peticiones (BAR_BEBIDA).' },
    { id: 'Event_Estil_LabCatch', type: 'intermediateCatchMessage', laneId: 'Lane_Estil', name: 'Aviso: Mezcla Química Lista', x: 2200, y: 630, w: 36, h: 36, doc: 'Captura notificación de que el bowl químico está pesado y listo.' },
    { id: 'Event_Estil_BarCatch', type: 'intermediateCatchMessage', laneId: 'Lane_Estil', name: 'Aviso: Bebida de Bar Lista', x: 2200, y: 530, w: 36, h: 36, doc: 'Captura notificación de que la bebida de cortesía está servida.' },
    { id: 'Event_Estil_Cronometro', type: 'intermediateCatchTimer', laneId: 'Lane_Estil', name: 'Cronómetro Exposición Química (20-45m)', x: 2320, y: 572, w: 36, h: 36, duration: 'PT30M', doc: 'Alarma de exposición química cumplida para enjuague y lavado.' },
    { id: 'Task_Estil_Ejecutar', type: 'manualTask', laneId: 'Lane_Estil', name: 'Finalización de Servicio y Peinado', x: 2420, y: 560, w: 140, h: 60, doc: 'Peinado, brushing y venta cruzada sugerida por Opal Copilot.' },
    { id: 'Task_Estil_FinServ', type: 'userTask', laneId: 'Lane_Estil', name: 'Finalizar Servicio & Derivar a Caja POS', x: 2600, y: 560, w: 130, h: 60, doc: 'Marca orden OATC como COMPLETADO y notifica al módulo de Caja.' },

    // 5. Laboratorio Químico
    { id: 'Task_Lab_Pesar', type: 'userTask', laneId: 'Lane_Lab', name: 'Pesaje en Balanza Web Serial (±2g)', x: 1910, y: 745, w: 130, h: 60, doc: 'Lectura en tiempo real de balanza digital y dosificación exacta.' },
    { id: 'Event_Lab_ThrowDespacho', type: 'intermediateThrowMessage', laneId: 'Lane_Lab', name: 'Notificar Mezcla Química Lista', x: 2100, y: 757, w: 36, h: 36, doc: 'Emite aviso de bowl listo hacia el estilista solicitante.' },

    // 6. Bar Boutique
    { id: 'Task_Bar_Prep', type: 'userTask', laneId: 'Lane_Bar', name: 'Preparación de Bebida / Café Especial', x: 1910, y: 875, w: 130, h: 60, doc: 'BarWorkspaceView.tsx reproduce campana Web Audio y barista prepara.' },
    { id: 'Event_Bar_ThrowListo', type: 'intermediateThrowMessage', laneId: 'Lane_Bar', name: 'Notificar Bebida de Bar Lista', x: 2100, y: 887, w: 36, h: 36, doc: 'Emite aviso de comanda servida hacia el cliente/estilista.' },

    // 7. Caja POS
    { id: 'Task_Caja_Cargar', type: 'userTask', laneId: 'Lane_Caja', name: 'Carga de Orden OATC & Liquidación', x: 2770, y: 1005, w: 130, h: 60, doc: 'Cajero audita orden OATC, ítems de cortesía y servicios ejecutados.' },
    { id: 'Task_Caja_Cobro', type: 'userTask', laneId: 'Lane_Caja', name: 'Cobro Multimoneda & Propinas', x: 2950, y: 1005, w: 130, h: 60, doc: 'Cobro en efectivo/tarjeta/Yape y asignación de propina para staff.' },
    { id: 'Task_Caja_Boleta', type: 'serviceTask', laneId: 'Lane_Caja', name: 'Emisión Boleta SUNAT & Puntos Lumina', x: 3130, y: 1005, w: 140, h: 60, doc: 'Emite comprobante electrónico y suma LuminaCoins en cuenta del cliente.' }
  ];

  const flows = [
    { id: 'Flow_1', source: 'Start_Cliente', target: 'Task_Cli_CheckIn', waypoints: [{ x: 216, y: 153 }, { x: 260, y: 153 }] },
    { id: 'Flow_2', source: 'Task_Cli_CheckIn', target: 'Task_Kiosk_Search', waypoints: [{ x: 320, y: 185 }, { x: 320, y: 265 }] },
    { id: 'Flow_3', source: 'Task_Kiosk_Search', target: 'Gate_Kiosk_Cita', waypoints: [{ x: 390, y: 295 }, { x: 430, y: 295 }] },
    { id: 'Flow_4', source: 'Gate_Kiosk_Cita', target: 'Task_Kiosk_Opal', name: 'Con Cita', waypoints: [{ x: 480, y: 295 }, { x: 520, y: 295 }] },
    { id: 'Flow_5', source: 'Gate_Kiosk_Cita', target: 'SubProcess_OATC', name: 'Sin Cita', waypoints: [{ x: 455, y: 320 }, { x: 455, y: 345 }, { x: 780, y: 345 }, { x: 780, y: 335 }] },
    { id: 'Flow_6', source: 'Task_Kiosk_Opal', target: 'Event_Cli_EsperaTimer', waypoints: [{ x: 585, y: 265 }, { x: 585, y: 155 }, { x: 650, y: 155 }] },
    { id: 'Flow_7', source: 'Task_Kiosk_Opal', target: 'SubProcess_OATC', waypoints: [{ x: 650, y: 295 }, { x: 700, y: 295 }] },
    { id: 'Flow_8', source: 'SubProcess_OATC', target: 'Event_Kiosk_MsgLlegada', waypoints: [{ x: 860, y: 295 }, { x: 910, y: 295 }] },
    { id: 'Flow_9', source: 'Event_Kiosk_MsgLlegada', target: 'Event_Recep_MsgCatch', waypoints: [{ x: 928, y: 313 }, { x: 928, y: 422 }] },
    { id: 'Flow_10', source: 'Event_Recep_MsgCatch', target: 'Gate_Recep_Asig', waypoints: [{ x: 946, y: 440 }, { x: 1010, y: 440 }] },
    { id: 'Flow_11', source: 'Gate_Recep_Asig', target: 'Task_Recep_Asignar', name: 'Sin Asignar', waypoints: [{ x: 1060, y: 440 }, { x: 1100, y: 440 }] },
    { id: 'Flow_12', source: 'Gate_Recep_Asig', target: 'Task_Estil_Reclamar', name: 'Asignado', waypoints: [{ x: 1035, y: 465 }, { x: 1035, y: 505 }, { x: 1345, y: 505 }, { x: 1345, y: 560 }] },
    { id: 'Flow_13', source: 'Task_Recep_Asignar', target: 'Task_Estil_Reclamar', waypoints: [{ x: 1230, y: 440 }, { x: 1345, y: 440 }, { x: 1345, y: 560 }] },
    { id: 'Flow_14', source: 'Task_Estil_Reclamar', target: 'Task_Cli_Sillon', waypoints: [{ x: 1345, y: 560 }, { x: 1345, y: 155 }, { x: 1160, y: 155 }] },
    { id: 'Flow_15', source: 'Task_Estil_Reclamar', target: 'Task_Estil_Diag', waypoints: [{ x: 1410, y: 590 }, { x: 1450, y: 590 }] },
    { id: 'Flow_16', source: 'Task_Estil_Diag', target: 'Gate_Estil_Reqs', waypoints: [{ x: 1590, y: 590 }, { x: 1630, y: 590 }] },
    { id: 'Flow_17', source: 'Gate_Estil_Reqs', target: 'Task_Estil_PedLab', waypoints: [{ x: 1655, y: 615 }, { x: 1655, y: 647 }, { x: 1720, y: 647 }] },
    { id: 'Flow_18', source: 'Gate_Estil_Reqs', target: 'Task_Estil_PedBar', waypoints: [{ x: 1655, y: 565 }, { x: 1655, y: 547 }, { x: 1720, y: 547 }] },
    { id: 'Flow_19', source: 'Gate_Estil_Reqs', target: 'Task_Cli_Servicio', waypoints: [{ x: 1655, y: 565 }, { x: 1655, y: 155 }, { x: 1720, y: 155 }] },
    { id: 'Flow_20', source: 'Task_Estil_PedLab', target: 'Task_Lab_Pesar', waypoints: [{ x: 1850, y: 647 }, { x: 1870, y: 647 }, { x: 1870, y: 775 }, { x: 1910, y: 775 }] },
    { id: 'Flow_21', source: 'Task_Lab_Pesar', target: 'Event_Lab_ThrowDespacho', waypoints: [{ x: 2040, y: 775 }, { x: 2100, y: 775 }] },
    { id: 'Flow_22', source: 'Event_Lab_ThrowDespacho', target: 'Event_Estil_LabCatch', waypoints: [{ x: 2118, y: 757 }, { x: 2118, y: 648 }, { x: 2200, y: 648 }] },
    { id: 'Flow_23', source: 'Task_Estil_PedBar', target: 'Task_Bar_Prep', waypoints: [{ x: 1850, y: 547 }, { x: 1870, y: 547 }, { x: 1870, y: 905 }, { x: 1910, y: 905 }] },
    { id: 'Flow_24', source: 'Task_Bar_Prep', target: 'Event_Bar_ThrowListo', waypoints: [{ x: 2040, y: 905 }, { x: 2100, y: 905 }] },
    { id: 'Flow_25', source: 'Event_Bar_ThrowListo', target: 'Event_Estil_BarCatch', waypoints: [{ x: 2118, y: 887 }, { x: 2118, y: 548 }, { x: 2200, y: 548 }] },
    { id: 'Flow_26', source: 'Event_Estil_LabCatch', target: 'Event_Estil_Cronometro', waypoints: [{ x: 2236, y: 648 }, { x: 2280, y: 648 }, { x: 2280, y: 590 }, { x: 2320, y: 590 }] },
    { id: 'Flow_27', source: 'Event_Estil_BarCatch', target: 'Event_Estil_Cronometro', waypoints: [{ x: 2236, y: 548 }, { x: 2280, y: 548 }, { x: 2280, y: 590 }, { x: 2320, y: 590 }] },
    { id: 'Flow_28', source: 'Event_Estil_Cronometro', target: 'Task_Estil_Ejecutar', waypoints: [{ x: 2356, y: 590 }, { x: 2420, y: 590 }] },
    { id: 'Flow_29', source: 'Task_Estil_Ejecutar', target: 'Task_Estil_FinServ', waypoints: [{ x: 2560, y: 590 }, { x: 2600, y: 590 }] },
    { id: 'Flow_30', source: 'Task_Estil_FinServ', target: 'Task_Caja_Cargar', waypoints: [{ x: 2730, y: 590 }, { x: 2750, y: 590 }, { x: 2750, y: 1035 }, { x: 2770, y: 1035 }] },
    { id: 'Flow_31', source: 'Task_Caja_Cargar', target: 'Task_Caja_Cobro', waypoints: [{ x: 2900, y: 1035 }, { x: 2950, y: 1035 }] },
    { id: 'Flow_32', source: 'Task_Caja_Cobro', target: 'Task_Cli_Pago', waypoints: [{ x: 3015, y: 1005 }, { x: 3015, y: 185 }] },
    { id: 'Flow_33', source: 'Task_Cli_Pago', target: 'Task_Caja_Boleta', waypoints: [{ x: 3080, y: 155 }, { x: 3200, y: 155 }, { x: 3200, y: 1005 }] },
    { id: 'Flow_34', source: 'Task_Caja_Boleta', target: 'End_Cliente', waypoints: [{ x: 3200, y: 1005 }, { x: 3218, y: 1005 }, { x: 3218, y: 171 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds, dataObjects, dataStores });
}

// =========================================================================
// DIAGRAMA 2: SUBPROCESO HIJO DEDICADO: GESTIÓN Y EMISIÓN TÉRMICA DE OATC
// =========================================================================
function generateSubprocesoOatc() {
  const id = 'Sub_OATC';
  const name = 'Subproceso: Gestión del Ciclo de Vida y Emisión Térmica de OATC (80mm ESC/POS)';

  const poolBounds = { x: 100, y: 80, width: 2900, height: 780 };
  const lanes = [
    { id: 'Lane_Sub_Op', name: 'Operador / Kiosko / Recepción', bounds: { x: 130, y: 80, width: 2870, height: 180 } },
    { id: 'Lane_Sub_Back', name: 'Motor Backend Supabase (public.oatc)', bounds: { x: 130, y: 260, width: 2870, height: 200 } },
    { id: 'Lane_Sub_Spool', name: 'Subsistema de Impresión Térmica (ESC/POS)', bounds: { x: 130, y: 460, width: 2870, height: 180 } },
    { id: 'Lane_Sub_Hw', name: 'Hardware Impresora Térmica de Sede', bounds: { x: 130, y: 640, width: 2870, height: 140 } },
  ];

  const dataObjects = [
    { id: 'DO_Sub_TicketRendered', name: 'Ticket OATC ESC/POS Renderizado (80mm)', x: 1550, y: 515, doc: 'Buffer binario con comandos ESC/POS para 80mm, código QR, logo, ítems y corte parcial.' },
    { id: 'DO_Sub_TicketFisico', name: 'Ticket OATC Impreso (Salida Física)', x: 2350, y: 680, doc: 'Documento impreso entregado físicamente para control de salón o comanda.' }
  ];

  const dataStores = [
    { id: 'DS_Sub_SupabaseOATC', name: '(BD) Supabase: public.oatc & public.oatc_items', x: 800, y: 320, doc: 'Persistencia central de la orden y sus detalles con estado auditado.' }
  ];

  const nodes = [
    // Operador / Kiosko
    { id: 'Start_Sub_Oatc', type: 'startEvent', laneId: 'Lane_Sub_Op', name: 'Disparo de Creación/Actualización OATC', x: 180, y: 150, w: 36, h: 36, doc: 'Se inicia por check-in de cliente, apertura de orden en recepción o re-impresión.' },
    { id: 'Task_Sub_SelDestino', type: 'userTask', laneId: 'Lane_Sub_Op', name: 'Selección de Impresora Destino de Sede', x: 260, y: 138, w: 150, h: 60, doc: 'Permite elegir la impresora térmica asignada: Recepción, Bar o Laboratorio.' },
    { id: 'Task_Sub_Confirmar', type: 'userTask', laneId: 'Lane_Sub_Op', name: 'Confirmación de Orden & Servicios', x: 460, y: 138, w: 140, h: 60, doc: 'Operador verifica datos del cliente, estilista asignado y servicios.' },
    { id: 'Task_Sub_EntregarTicket', type: 'manualTask', laneId: 'Lane_Sub_Op', name: 'Toma y Entrega de Ticket a Estilista/Cliente', x: 2450, y: 138, w: 150, h: 60, doc: 'Se entrega el ticket térmico para guiado y control de atención.' },
    { id: 'End_Sub_OatcOk', type: 'endEvent', laneId: 'Lane_Sub_Op', name: 'OATC Emitida e Impresa', x: 2680, y: 150, w: 36, h: 36, doc: 'Ciclo de emisión concluido exitosamente.' },

    // Motor Backend Supabase
    { id: 'Task_Sub_GenCode', type: 'serviceTask', laneId: 'Lane_Sub_Back', name: 'Generación de Código Único OATC-YYYYMMDD-XXX', x: 460, y: 320, w: 150, h: 60, doc: 'Genera correlativo diario garantizando unicidad por sede.' },
    { id: 'Task_Sub_SaveDB', type: 'serviceTask', laneId: 'Lane_Sub_Back', name: 'Persistencia en public.oatc (EN_ESPERA)', x: 670, y: 320, w: 150, h: 60, doc: 'Inserta registro de orden con sede_id, cliente_id y metadata de impresión.' },
    { id: 'Task_Sub_AuditItem', type: 'serviceTask', laneId: 'Lane_Sub_Back', name: 'Registro de Servicios e Insumos en public.oatc_items', x: 880, y: 320, w: 160, h: 60, doc: 'Guarda desglose de servicios programados con precios y tiempos proyectados.' },

    // Subsistema de Impresión Térmica
    { id: 'Task_Sub_BuildPayload', type: 'serviceTask', laneId: 'Lane_Sub_Spool', name: 'Construcción de Template ESC/POS (80mm)', x: 1100, y: 520, w: 160, h: 60, doc: 'Compila texto formateado: Cabecera con logo, QR de validación, cliente, lista y corte de papel.' },
    { id: 'Gate_Sub_CanalPrint', type: 'exclusiveGateway', laneId: 'Lane_Sub_Spool', name: 'Canal de Conexión de Impresora', x: 1320, y: 525, w: 50, h: 50, doc: 'Determina si la impresora es de Red IP/LAN, Web Serial (USB) o Web Bluetooth.' },
    { id: 'Task_Sub_PrintNetwork', type: 'serviceTask', laneId: 'Lane_Sub_Spool', name: 'Envío Socket TCP/RAW (Puerto 9100)', x: 1440, y: 480, w: 150, h: 55, doc: 'Impresora de red ethernet/wifi de la sede.' },
    { id: 'Task_Sub_PrintSerial', type: 'serviceTask', laneId: 'Lane_Sub_Spool', name: 'Envío Web Serial API (USB Directo)', x: 1440, y: 560, w: 150, h: 55, doc: 'Impresora conectada directamente por puerto COM/USB.' },
    { id: 'Gate_Sub_JoinCanal', type: 'exclusiveGateway', laneId: 'Lane_Sub_Spool', name: 'Convergencia de Impresión', x: 1650, y: 525, w: 50, h: 50, doc: 'Unifica canales de despacho hacia la cola física.' },
    { id: 'Task_Sub_CheckStatus', type: 'serviceTask', laneId: 'Lane_Sub_Spool', name: 'Monitoreo de Estado de Impresora (ACK / Status)', x: 1760, y: 520, w: 150, h: 60, doc: 'Comprueba respuesta de la impresora térmica (¿sin papel? ¿cubierta abierta?).' },
    { id: 'Gate_Sub_PrintOk', type: 'exclusiveGateway', laneId: 'Lane_Sub_Spool', name: '¿Impresión Exitosa?', x: 1970, y: 525, w: 50, h: 50, doc: 'Valida confirmación de impresión física.' },
    { id: 'Task_Sub_Reintentar', type: 'userTask', laneId: 'Lane_Sub_Spool', name: 'Alerta en Pantalla & Reintento / Re-enrutamiento', x: 1920, y: 440, w: 150, h: 55, doc: 'Muestra error al operador y permite elegir otra impresora de respaldo.' },

    // Hardware Impresora
    { id: 'Task_Sub_HwPrint', type: 'manualTask', laneId: 'Lane_Sub_Hw', name: 'Impresión de Ticket Térmico & Corte Automático', x: 2150, y: 675, w: 160, h: 60, doc: 'El cabezal térmico imprime 80mm y la guillotina realiza corte parcial.' }
  ];

  const flows = [
    { id: 'SubF_1', source: 'Start_Sub_Oatc', target: 'Task_Sub_SelDestino', waypoints: [{ x: 216, y: 168 }, { x: 260, y: 168 }] },
    { id: 'SubF_2', source: 'Task_Sub_SelDestino', target: 'Task_Sub_Confirmar', waypoints: [{ x: 410, y: 168 }, { x: 460, y: 168 }] },
    { id: 'SubF_3', source: 'Task_Sub_Confirmar', target: 'Task_Sub_GenCode', waypoints: [{ x: 530, y: 198 }, { x: 530, y: 320 }] },
    { id: 'SubF_4', source: 'Task_Sub_GenCode', target: 'Task_Sub_SaveDB', waypoints: [{ x: 610, y: 350 }, { x: 670, y: 350 }] },
    { id: 'SubF_5', source: 'Task_Sub_SaveDB', target: 'Task_Sub_AuditItem', waypoints: [{ x: 820, y: 350 }, { x: 880, y: 350 }] },
    { id: 'SubF_6', source: 'Task_Sub_AuditItem', target: 'Task_Sub_BuildPayload', waypoints: [{ x: 1040, y: 350 }, { x: 1180, y: 350 }, { x: 1180, y: 520 }] },
    { id: 'SubF_7', source: 'Task_Sub_BuildPayload', target: 'Gate_Sub_CanalPrint', waypoints: [{ x: 1260, y: 550 }, { x: 1320, y: 550 }] },
    { id: 'SubF_8', source: 'Gate_Sub_CanalPrint', target: 'Task_Sub_PrintNetwork', name: 'Red LAN/WiFi', waypoints: [{ x: 1345, y: 525 }, { x: 1345, y: 507 }, { x: 1440, y: 507 }] },
    { id: 'SubF_9', source: 'Gate_Sub_CanalPrint', target: 'Task_Sub_PrintSerial', name: 'USB Serial', waypoints: [{ x: 1345, y: 575 }, { x: 1345, y: 587 }, { x: 1440, y: 587 }] },
    { id: 'SubF_10', source: 'Task_Sub_PrintNetwork', target: 'Gate_Sub_JoinCanal', waypoints: [{ x: 1590, y: 507 }, { x: 1675, y: 507 }, { x: 1675, y: 525 }] },
    { id: 'SubF_11', source: 'Task_Sub_PrintSerial', target: 'Gate_Sub_JoinCanal', waypoints: [{ x: 1590, y: 587 }, { x: 1675, y: 587 }, { x: 1675, y: 575 }] },
    { id: 'SubF_12', source: 'Gate_Sub_JoinCanal', target: 'Task_Sub_CheckStatus', waypoints: [{ x: 1700, y: 550 }, { x: 1760, y: 550 }] },
    { id: 'SubF_13', source: 'Task_Sub_CheckStatus', target: 'Gate_Sub_PrintOk', waypoints: [{ x: 1910, y: 550 }, { x: 1970, y: 550 }] },
    { id: 'SubF_14', source: 'Gate_Sub_PrintOk', target: 'Task_Sub_Reintentar', name: 'Falla/Sin Papel', waypoints: [{ x: 1995, y: 525 }, { x: 1995, y: 495 }] },
    { id: 'SubF_15', source: 'Task_Sub_Reintentar', target: 'Task_Sub_SelDestino', waypoints: [{ x: 1920, y: 467 }, { x: 335, y: 467 }, { x: 335, y: 198 }] },
    { id: 'SubF_16', source: 'Gate_Sub_PrintOk', target: 'Task_Sub_HwPrint', name: 'Correcto', waypoints: [{ x: 2020, y: 550 }, { x: 2230, y: 550 }, { x: 2230, y: 675 }] },
    { id: 'SubF_17', source: 'Task_Sub_HwPrint', target: 'Task_Sub_EntregarTicket', waypoints: [{ x: 2310, y: 705 }, { x: 2525, y: 705 }, { x: 2525, y: 198 }] },
    { id: 'SubF_18', source: 'Task_Sub_EntregarTicket', target: 'End_Sub_OatcOk', waypoints: [{ x: 2600, y: 168 }, { x: 2680, y: 168 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds, dataObjects, dataStores });
}

// =========================================================================
// DIAGRAMA 3: WORKFORCE MANAGEMENT (WFM) ENRIQUECIDO CON EVENTOS INTERMEDIOS
// =========================================================================
function generateWfm() {
  const id = 'WFM_Turnos';
  const name = 'Gestión de Asistencia, Turnos NFC y Rotación de Piso (WFM Vaikuntha)';
  
  const poolBounds = { x: 100, y: 80, width: 2900, height: 750 };
  const lanes = [
    { id: 'Lane_Wfm_Staff', name: 'Colaborador (Staff Móvil)', bounds: { x: 130, y: 80, width: 2870, height: 180 } },
    { id: 'Lane_Wfm_Recep', name: 'Recepción Central / Supervisor', bounds: { x: 130, y: 260, width: 2870, height: 180 } },
    { id: 'Lane_Wfm_Engine', name: 'Motor Supabase Realtime & PostgreSQL', bounds: { x: 130, y: 440, width: 2870, height: 200 } },
    { id: 'Lane_Wfm_Piso', name: 'Rotación de Piso (Queue Engine)', bounds: { x: 130, y: 640, width: 2870, height: 150 } },
  ];

  const dataStores = [
    { id: 'DS_Wfm_ColaPet', name: '(BD) Supabase: public.cola_peticiones', x: 800, y: 580, doc: 'Cola de peticiones con REPLICA IDENTITY FULL.' },
    { id: 'DS_Wfm_Asistencias', name: '(BD) Supabase: public.asistencias_turnos', x: 2050, y: 580, doc: 'Historial inmutable de asistencias auditado.' }
  ];

  const nodes = [
    // Staff Móvil
    { id: 'Start_Staff', type: 'startEvent', laneId: 'Lane_Wfm_Staff', name: 'Llegada del Colaborador', x: 180, y: 150, w: 36, h: 36, doc: 'Colaborador se presenta a laborar en su sede asignada.' },
    { id: 'Gate_Metodo_Marc', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Staff', name: '¿Dispone de Tag NFC?', x: 260, y: 143, w: 50, h: 50, doc: 'Evalúa si el teléfono cuenta con Web NFC y tag físico en puerta/comedor.' },
    { id: 'Task_Scan_NFC', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Escaneo de Tag NFC (Puerta/Comedor)', x: 360, y: 105, w: 140, h: 60, doc: 'useNfcBackgroundListener.ts sanitiza payload (PUERTA_PRINCIPAL / COMEDOR).' },
    { id: 'Task_Sol_Manual', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Solicitud Táctil en Móvil (TabEstacion)', x: 360, y: 195, w: 140, h: 60, doc: 'Presiona botón para solicitar inicio de turno, refrigerio o salida.' },
    { id: 'Task_Sel_Mov', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Selección Desambiguada de Movimiento', x: 550, y: 138, w: 140, h: 60, doc: 'Modal táctil de 1 toque: Entrada, Salir a Almorzar, Retorno Refrigerio o Fin Jornada.' },
    { id: 'Event_Staff_ThrowSol', type: 'intermediateThrowMessage', laneId: 'Lane_Wfm_Staff', name: 'Emitir Solicitud a Cola de Peticiones', x: 740, y: 150, w: 36, h: 36, doc: 'Dispara inserción en cola_peticiones y activa banner reactivo.' },
    { id: 'Event_Staff_CatchDecision', type: 'intermediateCatchMessage', laneId: 'Lane_Wfm_Staff', name: 'Notificación Háptica & Realtime de Decisión', x: 1800, y: 150, w: 36, h: 36, doc: 'Captura el evento WAL Realtime con vibración del dispositivo y toast.' },
    { id: 'Gate_Staff_Feedback', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Staff', name: '¿Resultado Aprobado?', x: 1900, y: 143, w: 50, h: 50, doc: 'Determina si la solicitud fue autorizada o rechazada.' },
    { id: 'Task_Staff_Rechazo', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Banner Carmesí con Motivo de Rechazo', x: 2010, y: 105, w: 150, h: 60, doc: 'TabEstacion.tsx muestra motivo recibido y botón "Volver a Solicitar".' },
    { id: 'Task_Staff_Activo', type: 'manualTask', laneId: 'Lane_Wfm_Staff', name: 'Turno Activo & Disponibilidad en Sillón', x: 2220, y: 138, w: 140, h: 60, doc: 'Colaborador listo para recibir órdenes de clientes.' },
    { id: 'End_Staff_Ok', type: 'endEvent', laneId: 'Lane_Wfm_Staff', name: 'Jornada Iniciada', x: 2430, y: 150, w: 36, h: 36, doc: 'Turno operativo iniciado con sincronización en tiempo real.' },

    // Recepción Central
    { id: 'Event_Recep_CatchWfm', type: 'intermediateCatchMessage', laneId: 'Lane_Wfm_Recep', name: 'Recepción de Alerta WFM (Campana Sonora)', x: 970, y: 332, w: 36, h: 36, doc: 'QueueMonitor.tsx reproduce sonido agradable de campana y toast.' },
    { id: 'Task_Recep_Eval', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Auditoría de Horario y Presencia Física', x: 1060, y: 320, w: 140, h: 60, doc: 'Recepcionista verifica si el colaborador está presente y programado para hoy.' },
    { id: 'Gate_Recep_Decide', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Recep', name: '¿Aprobar Marcación?', x: 1260, y: 325, w: 50, h: 50, doc: 'Decisión supervisada de asistencia.' },
    { id: 'Task_Recep_ModalRech', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Modal de Rechazo con Motivo Parametrizado', x: 1380, y: 280, w: 150, h: 60, doc: 'Selección de motivo rápido (horario no programado, sede equivocada, etc.).' },
    { id: 'Task_Recep_Aprobar', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Confirmación 1-Clic de Aprobación', x: 1380, y: 380, w: 140, h: 60, doc: 'Acepta la marcación y muta la cola_peticiones a APROBADO.' },

    // Supabase Realtime & Engine
    { id: 'Task_DB_InsertPet', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Inserción en cola_peticiones (PENDIENTE)', x: 760, y: 505, w: 150, h: 60, doc: 'peticiones.ts inserta con sede_id verificado y agente_id autenticado.' },
    { id: 'Event_DB_ThrowWal', type: 'intermediateThrowMessage', laneId: 'Lane_Wfm_Engine', name: 'Emisión WAL Realtime (REPLICA IDENTITY FULL)', x: 1680, y: 517, w: 36, h: 36, doc: 'PostgreSQL emite todas las columnas al canal suscrito.' },
    { id: 'Task_DB_Audit', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Registro Inmutable en asistencias_turnos', x: 1970, y: 505, w: 150, h: 60, doc: 'Guarda timestamp UTC/Perú, método (NFC/DIGITAL) y metadata de auditoría laboral.' },
    { id: 'Task_DB_SyncEstado', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Auto-sanación de Estado Operativo Diario', x: 2170, y: 505, w: 150, h: 60, doc: 'obtenerEstadoOperativoDinamicoAgente actualiza public.agentes con estado dinámico hoy.' },

    // Rotación de Piso
    { id: 'Task_Piso_Recalc', type: 'businessRuleTask', laneId: 'Lane_Wfm_Piso', name: 'Recálculo de Posición en Piso (#X de Y)', x: 2170, y: 685, w: 150, h: 60, doc: 'Algoritmo de rotación asigna turno para clientes a demanda y actualiza TabCola.tsx.' }
  ];

  const flows = [
    { id: 'Wfm_F1', source: 'Start_Staff', target: 'Gate_Metodo_Marc', waypoints: [{ x: 216, y: 168 }, { x: 260, y: 168 }] },
    { id: 'Wfm_F2', source: 'Gate_Metodo_Marc', target: 'Task_Scan_NFC', name: 'NFC Disponible', waypoints: [{ x: 285, y: 143 }, { x: 285, y: 135 }, { x: 360, y: 135 }] },
    { id: 'Wfm_F3', source: 'Gate_Metodo_Marc', target: 'Task_Sol_Manual', name: 'Sin NFC', waypoints: [{ x: 285, y: 193 }, { x: 285, y: 225 }, { x: 360, y: 225 }] },
    { id: 'Wfm_F4', source: 'Task_Scan_NFC', target: 'Task_Sel_Mov', waypoints: [{ x: 500, y: 135 }, { x: 525, y: 135 }, { x: 525, y: 168 }, { x: 550, y: 168 }] },
    { id: 'Wfm_F5', source: 'Task_Sol_Manual', target: 'Task_Sel_Mov', waypoints: [{ x: 500, y: 225 }, { x: 525, y: 225 }, { x: 525, y: 168 }, { x: 550, y: 168 }] },
    { id: 'Wfm_F6', source: 'Task_Sel_Mov', target: 'Event_Staff_ThrowSol', waypoints: [{ x: 690, y: 168 }, { x: 740, y: 168 }] },
    { id: 'Wfm_F7', source: 'Event_Staff_ThrowSol', target: 'Task_DB_InsertPet', waypoints: [{ x: 758, y: 186 }, { x: 758, y: 350 }, { x: 835, y: 350 }, { x: 835, y: 505 }] },
    { id: 'Wfm_F8', source: 'Task_DB_InsertPet', target: 'Event_Recep_CatchWfm', waypoints: [{ x: 835, y: 505 }, { x: 835, y: 350 }, { x: 970, y: 350 }] },
    { id: 'Wfm_F9', source: 'Event_Recep_CatchWfm', target: 'Task_Recep_Eval', waypoints: [{ x: 1006, y: 350 }, { x: 1060, y: 350 }] },
    { id: 'Wfm_F10', source: 'Task_Recep_Eval', target: 'Gate_Recep_Decide', waypoints: [{ x: 1200, y: 350 }, { x: 1260, y: 350 }] },
    { id: 'Wfm_F11', source: 'Gate_Recep_Decide', target: 'Task_Recep_ModalRech', name: 'Rechazar', waypoints: [{ x: 1285, y: 325 }, { x: 1285, y: 310 }, { x: 1380, y: 310 }] },
    { id: 'Wfm_F12', source: 'Gate_Recep_Decide', target: 'Task_Recep_Aprobar', name: 'Aprobar', waypoints: [{ x: 1285, y: 375 }, { x: 1285, y: 410 }, { x: 1380, y: 410 }] },
    { id: 'Wfm_F13', source: 'Task_Recep_ModalRech', target: 'Event_DB_ThrowWal', waypoints: [{ x: 1530, y: 310 }, { x: 1698, y: 310 }, { x: 1698, y: 517 }] },
    { id: 'Wfm_F14', source: 'Task_Recep_Aprobar', target: 'Event_DB_ThrowWal', waypoints: [{ x: 1520, y: 410 }, { x: 1698, y: 410 }, { x: 1698, y: 517 }] },
    { id: 'Wfm_F15', source: 'Event_DB_ThrowWal', target: 'Event_Staff_CatchDecision', waypoints: [{ x: 1698, y: 517 }, { x: 1698, y: 168 }, { x: 1800, y: 168 }] },
    { id: 'Wfm_F16', source: 'Event_Staff_CatchDecision', target: 'Gate_Staff_Feedback', waypoints: [{ x: 1836, y: 168 }, { x: 1900, y: 168 }] },
    { id: 'Wfm_F17', source: 'Gate_Staff_Feedback', target: 'Task_Staff_Rechazo', name: 'Rechazado', waypoints: [{ x: 1925, y: 143 }, { x: 1925, y: 135 }, { x: 2010, y: 135 }] },
    { id: 'Wfm_F18', source: 'Gate_Staff_Feedback', target: 'Task_DB_Audit', name: 'Aprobado', waypoints: [{ x: 1925, y: 193 }, { x: 1925, y: 535 }, { x: 1970, y: 535 }] },
    { id: 'Wfm_F19', source: 'Task_DB_Audit', target: 'Task_DB_SyncEstado', waypoints: [{ x: 2120, y: 535 }, { x: 2170, y: 535 }] },
    { id: 'Wfm_F20', source: 'Task_DB_SyncEstado', target: 'Task_Staff_Activo', waypoints: [{ x: 2245, y: 505 }, { x: 2245, y: 198 }] },
    { id: 'Wfm_F21', source: 'Task_DB_SyncEstado', target: 'Task_Piso_Recalc', waypoints: [{ x: 2245, y: 565 }, { x: 2245, y: 685 }] },
    { id: 'Wfm_F22', source: 'Task_Staff_Activo', target: 'End_Staff_Ok', waypoints: [{ x: 2360, y: 168 }, { x: 2430, y: 168 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds, dataStores });
}

// =========================================================================
// DIAGRAMA 4: LABORATORIO QUÍMICO Y CADENA DE SUMINISTRO
// =========================================================================
function generateLaboratorio() {
  const id = 'Lab_Suministros';
  const name = 'Cadena de Suministro y Laboratorio Químico - Vaikuntha ERP';
  
  const poolBounds = { x: 100, y: 80, width: 2700, height: 750 };
  const lanes = [
    { id: 'Lane_Lab_Estil', name: 'Estilista Solicitante', bounds: { x: 130, y: 80, width: 2670, height: 180 } },
    { id: 'Lane_Lab_Quimico', name: 'Encargado de Laboratorio', bounds: { x: 130, y: 260, width: 2670, height: 200 } },
    { id: 'Lane_Lab_Kardex', name: 'Motor de Inventario & Kardex', bounds: { x: 130, y: 460, width: 2670, height: 150 } },
    { id: 'Lane_Lab_Compras', name: 'Administración & Compras', bounds: { x: 130, y: 610, width: 2670, height: 140 } },
  ];

  const dataObjects = [
    { id: 'DO_Lab_Formula', name: 'Ticket de Fórmula Química (Gramaje)', x: 380, y: 220, doc: 'Especificación de tintes, decolorantes y peróxidos solicitados.' }
  ];

  const dataStores = [
    { id: 'DS_Lab_Kardex', name: '(BD) Supabase: public.inventario_movimientos', x: 1190, y: 585, doc: 'Kardex continuo con auditoría de salidas por consumo de salón.' }
  ];

  const nodes = [
    // Estilista
    { id: 'Start_Lab_Req', type: 'startEvent', laneId: 'Lane_Lab_Estil', name: 'Necesidad de Mezcla Química', x: 180, y: 150, w: 36, h: 36, doc: 'Estilista diagnostica servicio (tinte, decoloración, plex).' },
    { id: 'Task_Estil_Formulacion', type: 'userTask', laneId: 'Lane_Lab_Estil', name: 'Selección de Fórmula & Gramaje en Móvil', x: 260, y: 138, w: 140, h: 60, doc: 'Ingreso de código de producto y gramos proyectados en app.' },
    { id: 'Task_Estil_RecibeBowl', type: 'manualTask', laneId: 'Lane_Lab_Estil', name: 'Recepción de Bowl de Mezcla', x: 1350, y: 138, w: 130, h: 60, doc: 'Estilista recibe el bowl listo para aplicar en el cliente.' },
    { id: 'Task_Estil_Aplicar', type: 'manualTask', laneId: 'Lane_Lab_Estil', name: 'Aplicación en Cabello', x: 1540, y: 138, w: 130, h: 60, doc: 'Aplicación química en el sillón.' },
    { id: 'Event_Estil_TimerExp', type: 'intermediateCatchTimer', laneId: 'Lane_Lab_Estil', name: 'Cronómetro Químico (20-45 min)', x: 1720, y: 150, w: 36, h: 36, duration: 'PT35M', doc: 'Control estricto de tiempo de exposición para no maltratar la hebra capilar.' },
    { id: 'Task_Estil_Sobrante', type: 'userTask', laneId: 'Lane_Lab_Estil', name: 'Declaración de Sobrante o Merma', x: 1810, y: 138, w: 130, h: 60, doc: 'Registra si sobró producto para auditoría de desperdicio.' },
    { id: 'End_Lab_Serv', type: 'endEvent', laneId: 'Lane_Lab_Estil', name: 'Aplicación Química Concluida', x: 2000, y: 150, w: 36, h: 36, doc: 'Servicio químico aplicado exitosamente.' },

    // Encargado de Laboratorio
    { id: 'Task_Lab_MonitorDespacho', type: 'userTask', laneId: 'Lane_Lab_Quimico', name: 'Monitor de Despacho (/lab/despacho)', x: 450, y: 330, w: 140, h: 60, doc: 'Visualiza pedido entrante con detalles de producto y gramaje solicitado.' },
    { id: 'Task_Lab_ConnectBalanza', type: 'serviceTask', laneId: 'Lane_Lab_Quimico', name: 'Lectura Web Serial Balanza Digital', x: 650, y: 330, w: 140, h: 60, doc: 'Web Serial API lee puerto COM / USB (precisión ±2g).' },
    { id: 'Task_Lab_TaraPesaje', type: 'manualTask', laneId: 'Lane_Lab_Quimico', name: 'Tara de Bowl y Dosificación de Químicos', x: 850, y: 330, w: 140, h: 60, doc: 'Coloca bowl, tara a 0.0g y añade tintes/peróxidos.' },
    { id: 'Gate_Lab_Tolerancia', type: 'exclusiveGateway', laneId: 'Lane_Lab_Quimico', name: '¿Pesaje Dentro de Tolerancia (±2g)?', x: 1040, y: 335, w: 50, h: 50, doc: 'Valida si el peso real coincide con la fórmula química.' },
    { id: 'Task_Lab_ConfirmarDespacho', type: 'userTask', laneId: 'Lane_Lab_Quimico', name: 'Confirmación y Despacho Físico', x: 1150, y: 330, w: 140, h: 60, doc: 'Registra el peso exacto real y despacha el bowl.' },

    // Motor de Inventario & Kardex
    { id: 'Task_Kardex_Deduccion', type: 'serviceTask', laneId: 'Lane_Lab_Kardex', name: 'Deducción Automática en Kardex', x: 1150, y: 505, w: 140, h: 60, doc: 'Inserta fila en public.inventario_movimientos con tipo SALIDA_CONSUMO.' },
    { id: 'Gate_Kardex_Minimo', type: 'exclusiveGateway', laneId: 'Lane_Lab_Kardex', name: '¿Stock < Umbral Mínimo?', x: 1350, y: 510, w: 50, h: 50, doc: 'Compara stock restante vs. punto de reorden configurado.' },
    { id: 'Task_Kardex_Alerta', type: 'serviceTask', laneId: 'Lane_Lab_Kardex', name: 'Emisión de Alerta de Reabastecimiento', x: 1470, y: 505, w: 140, h: 60, doc: 'Notifica al administrador y activa badge de insumo por agotarse.' },

    // Administración & Compras
    { id: 'Task_Compras_OpalPredictor', type: 'serviceTask', laneId: 'Lane_Lab_Compras', name: 'Proyección de Demanda 7 Días con Opal AI', x: 1470, y: 650, w: 150, h: 60, doc: 'LabInsumosPredictorOpal.tsx proyecta consumo por citas agendadas.' },
    { id: 'Task_Compras_GenerarOC', type: 'userTask', laneId: 'Lane_Lab_Compras', name: 'Generación de Orden de Compra o Traslado', x: 1680, y: 650, w: 150, h: 60, doc: 'Aprobación de orden a proveedor o transferencia entre sedes.' },
    { id: 'End_Lab_StockOk', type: 'endEvent', laneId: 'Lane_Lab_Compras', name: 'Reposición Programada', x: 1900, y: 662, w: 36, h: 36, doc: 'Insumo reabastecido en Kardex.' }
  ];

  const flows = [
    { id: 'Lab_F1', source: 'Start_Lab_Req', target: 'Task_Estil_Formulacion', waypoints: [{ x: 216, y: 168 }, { x: 260, y: 168 }] },
    { id: 'Lab_F2', source: 'Task_Estil_Formulacion', target: 'Task_Lab_MonitorDespacho', waypoints: [{ x: 400, y: 168 }, { x: 425, y: 168 }, { x: 425, y: 360 }, { x: 450, y: 360 }] },
    { id: 'Lab_F3', source: 'Task_Lab_MonitorDespacho', target: 'Task_Lab_ConnectBalanza', waypoints: [{ x: 590, y: 360 }, { x: 650, y: 360 }] },
    { id: 'Lab_F4', source: 'Task_Lab_ConnectBalanza', target: 'Task_Lab_TaraPesaje', waypoints: [{ x: 790, y: 360 }, { x: 850, y: 360 }] },
    { id: 'Lab_F5', source: 'Task_Lab_TaraPesaje', target: 'Gate_Lab_Tolerancia', waypoints: [{ x: 990, y: 360 }, { x: 1040, y: 360 }] },
    { id: 'Lab_F6', source: 'Gate_Lab_Tolerancia', target: 'Task_Lab_TaraPesaje', name: 'Fuera de Tolerancia', waypoints: [{ x: 1065, y: 335 }, { x: 1065, y: 290 }, { x: 920, y: 290 }, { x: 920, y: 330 }] },
    { id: 'Lab_F7', source: 'Gate_Lab_Tolerancia', target: 'Task_Lab_ConfirmarDespacho', name: 'Dentro de ±2g', waypoints: [{ x: 1090, y: 360 }, { x: 1150, y: 360 }] },
    { id: 'Lab_F8', source: 'Task_Lab_ConfirmarDespacho', target: 'Task_Estil_RecibeBowl', waypoints: [{ x: 1220, y: 330 }, { x: 1220, y: 168 }, { x: 1350, y: 168 }] },
    { id: 'Lab_F9', source: 'Task_Lab_ConfirmarDespacho', target: 'Task_Kardex_Deduccion', waypoints: [{ x: 1220, y: 390 }, { x: 1220, y: 505 }] },
    { id: 'Lab_F10', source: 'Task_Estil_RecibeBowl', target: 'Task_Estil_Aplicar', waypoints: [{ x: 1480, y: 168 }, { x: 1540, y: 168 }] },
    { id: 'Lab_F11', source: 'Task_Estil_Aplicar', target: 'Event_Estil_TimerExp', waypoints: [{ x: 1670, y: 168 }, { x: 1720, y: 168 }] },
    { id: 'Lab_F12', source: 'Event_Estil_TimerExp', target: 'Task_Estil_Sobrante', waypoints: [{ x: 1756, y: 168 }, { x: 1810, y: 168 }] },
    { id: 'Lab_F13', source: 'Task_Estil_Sobrante', target: 'End_Lab_Serv', waypoints: [{ x: 1940, y: 168 }, { x: 2000, y: 168 }] },
    { id: 'Lab_F14', source: 'Task_Kardex_Deduccion', target: 'Gate_Kardex_Minimo', waypoints: [{ x: 1290, y: 535 }, { x: 1350, y: 535 }] },
    { id: 'Lab_F15', source: 'Gate_Kardex_Minimo', target: 'Task_Kardex_Alerta', name: 'Stock Bajo', waypoints: [{ x: 1400, y: 535 }, { x: 1470, y: 535 }] },
    { id: 'Lab_F16', source: 'Task_Kardex_Alerta', target: 'Task_Compras_OpalPredictor', waypoints: [{ x: 1545, y: 565 }, { x: 1545, y: 650 }] },
    { id: 'Lab_F17', source: 'Task_Compras_OpalPredictor', target: 'Task_Compras_GenerarOC', waypoints: [{ x: 1620, y: 680 }, { x: 1680, y: 680 }] },
    { id: 'Lab_F18', source: 'Task_Compras_GenerarOC', target: 'End_Lab_StockOk', waypoints: [{ x: 1830, y: 680 }, { x: 1900, y: 680 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds, dataObjects, dataStores });
}

// =========================================================================
// MAIN RUNNER
// =========================================================================
function main() {
  console.log('🚀 Iniciando generación de diagramas BPMN 2.0 avanzados para Bizagi Modeler...');

  // 1. Macroproceso
  const macroXml = generateMacroproceso();
  const macroPath = path.join(outputDir, 'macroproceso_operativo_vaikuntha.bpmn');
  fs.writeFileSync(macroPath, macroXml, 'utf-8');
  console.log(`✅ [1/4] Macroproceso Generado: ${macroPath} (${(macroXml.length / 1024).toFixed(1)} KB)`);

  // 2. Subproceso OATC
  const oatcXml = generateSubprocesoOatc();
  const oatcPath = path.join(outputDir, 'subproceso_oatc_impresion_termica.bpmn');
  fs.writeFileSync(oatcPath, oatcXml, 'utf-8');
  console.log(`✅ [2/4] Subproceso OATC & Impresión Generado: ${oatcPath} (${(oatcXml.length / 1024).toFixed(1)} KB)`);

  // 3. WFM
  const wfmXml = generateWfm();
  const wfmPath = path.join(outputDir, 'wfm_control_asistencia_turnos.bpmn');
  fs.writeFileSync(wfmPath, wfmXml, 'utf-8');
  console.log(`✅ [3/4] WFM Generado: ${wfmPath} (${(wfmXml.length / 1024).toFixed(1)} KB)`);

  // 4. Laboratorio
  const labXml = generateLaboratorio();
  const labPath = path.join(outputDir, 'laboratorio_cadena_suministro.bpmn');
  fs.writeFileSync(labPath, labXml, 'utf-8');
  console.log(`✅ [4/4] Laboratorio & Suministros Generado: ${labPath} (${(labXml.length / 1024).toFixed(1)} KB)`);

  console.log('\n🎉 Los 4 diagramas BPMN 2.0 fueron generados exitosamente.');
}

main();
