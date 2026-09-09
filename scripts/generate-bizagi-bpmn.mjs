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
 */
function buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds }) {
  const processId = `Process_${id}`;
  const collaborationId = `Collaboration_${id}`;
  const participantId = `Participant_${id}`;

  // 1. Process Lanes & Elements
  let laneSetXml = `    <bpmn:laneSet id="LaneSet_${id}">\n`;
  lanes.forEach((lane) => {
    const laneNodeRefs = nodes
      .filter((n) => n.laneId === lane.id)
      .map((n) => `        <bpmn:flowNodeRef>${n.id}</bpmn:flowNodeRef>`)
      .join('\n');
    laneSetXml += `      <bpmn:lane id="${lane.id}" name="${escapeXml(lane.name)}">\n${laneNodeRefs}\n      </bpmn:lane>\n`;
  });
  laneSetXml += `    </bpmn:laneSet>\n`;

  // 2. Nodes
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
      default:
        nodesXml += `    <bpmn:task id="${node.id}" name="${escapeXml(node.name)}">${docXml}${incomingXml}${outgoingXml}\n    </bpmn:task>\n`;
    }
  });

  // 3. Sequence Flows
  let flowsXml = '';
  flows.forEach((flow) => {
    const nameAttr = flow.name ? ` name="${escapeXml(flow.name)}"` : '';
    flowsXml += `    <bpmn:sequenceFlow id="${flow.id}" sourceRef="${flow.source}" targetRef="${flow.target}"${nameAttr} />\n`;
  });

  // 4. Diagram Visual Layout (BPMNDI)
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

  // Node shapes
  nodes.forEach((node) => {
    diXml += `      <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">\n`;
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
  exporterVersion="2.0">
  <bpmn:collaboration id="${collaborationId}">
    <bpmn:participant id="${participantId}" name="${escapeXml(name)}" processRef="${processId}" />
  </bpmn:collaboration>
  <bpmn:process id="${processId}" name="${escapeXml(name)}" isExecutable="false">
${laneSetXml}
${nodesXml}
${flowsXml}  </bpmn:process>
${diXml}</bpmn:definitions>`;
}

// =========================================================================
// DIAGRAMA 1: MACROPROCESO OPERATIVO DE SALÓN (END-TO-END)
// =========================================================================
function generateMacroproceso() {
  const id = 'Macro_Salón';
  const name = 'Macroproceso Operativo de Salón - Vaikuntha ERP (Gloss Salon & Relax)';
  
  const poolBounds = { x: 100, y: 80, width: 3400, height: 1050 };
  const laneHeight = 145;
  
  const lanes = [
    { id: 'Lane_Cli', name: 'Cliente VIP / Visitante', bounds: { x: 130, y: 80, width: 3370, height: laneHeight } },
    { id: 'Lane_Kiosk', name: 'Kiosko Táctil / Concierge Opal AI', bounds: { x: 130, y: 225, width: 3370, height: laneHeight } },
    { id: 'Lane_Recep', name: 'Recepción Central', bounds: { x: 130, y: 370, width: 3370, height: laneHeight } },
    { id: 'Lane_Estil', name: 'Estilista / Cosmiatra en Sillón', bounds: { x: 130, y: 515, width: 3370, height: 180 } },
    { id: 'Lane_Lab', name: 'Laboratorio Químico', bounds: { x: 130, y: 695, width: 3370, height: 120 } },
    { id: 'Lane_Bar', name: 'Bar Boutique & Cafetería', bounds: { x: 130, y: 815, width: 3370, height: 120 } },
    { id: 'Lane_Caja', name: 'Caja POS & Facturación', bounds: { x: 130, y: 935, width: 3370, height: 120 } },
  ];

  const nodes = [
    // 1. Cliente VIP
    { id: 'Start_Cliente', type: 'startEvent', laneId: 'Lane_Cli', name: 'Llegada al Salón', x: 180, y: 135, w: 36, h: 36, doc: 'El cliente VIP o espontáneo ingresa a las instalaciones del salón.' },
    { id: 'Task_Cli_CheckIn', type: 'userTask', laneId: 'Lane_Cli', name: 'Interacción en Kiosko / Check-in', x: 260, y: 125, w: 120, h: 60, doc: 'El cliente digita su DNI o celular en la pantalla táctil del tótem o se acerca al mostrador.' },
    { id: 'Task_Cli_Espera', type: 'manualTask', laneId: 'Lane_Cli', name: 'Espera en Lounge & Selección Amenidad', x: 650, y: 125, w: 130, h: 60, doc: 'El cliente espera confortablemente en el lounge y selecciona su bebida de cortesía sugerida por Opal AI.' },
    { id: 'Task_Cli_Sillon', type: 'manualTask', laneId: 'Lane_Cli', name: 'Traslado a Sillón de Estilista', x: 1040, y: 125, w: 120, h: 60, doc: 'El cliente es llamado y se ubica en el sillón o cabina asignada.' },
    { id: 'Task_Cli_Servicio', type: 'manualTask', laneId: 'Lane_Cli', name: 'Recepción de Servicio & Consulta Lumina Club', x: 1720, y: 125, w: 140, h: 60, doc: 'El cliente disfruta su servicio y visualiza en su móvil consejos capilares y balance de LuminaCoins.' },
    { id: 'Task_Cli_Pago', type: 'userTask', laneId: 'Lane_Cli', name: 'Validación de Pre-cuenta & Pago', x: 2850, y: 125, w: 130, h: 60, doc: 'El cliente revisa su cuenta en Caja POS y efectúa el pago.' },
    { id: 'End_Cliente', type: 'endEvent', laneId: 'Lane_Cli', name: 'Salida del Salón con Puntos Ganados', x: 3100, y: 135, w: 36, h: 36, doc: 'Atención finalizada satisfactoriamente, acumulación de puntos registrada.' },

    // 2. Kiosko / Concierge Opal AI
    { id: 'Task_Kiosk_Search', type: 'serviceTask', laneId: 'Lane_Kiosk', name: 'Búsqueda de Cliente & Cita en Supabase', x: 260, y: 265, w: 130, h: 60, doc: 'Componente KioskVipCheckIn.tsx consulta tabla public.clientes y citas programadas.' },
    { id: 'Gate_Kiosk_Cita', type: 'exclusiveGateway', laneId: 'Lane_Kiosk', name: '¿Tiene Cita Programada?', x: 440, y: 270, w: 50, h: 50, doc: 'Evalúa si el cliente tiene orden OATC existente o es ingreso a demanda.' },
    { id: 'Task_Kiosk_Opal', type: 'serviceTask', laneId: 'Lane_Kiosk', name: 'Bienvenida & Sugerencia Opal Concierge', x: 530, y: 265, w: 130, h: 60, doc: 'KioskConciergeAgent.tsx infiere bebida de bienvenida y tiempo estimado.' },
    { id: 'Task_Kiosk_OATC', type: 'serviceTask', laneId: 'Lane_Kiosk', name: 'Creación/Actualización Orden OATC', x: 700, y: 265, w: 130, h: 60, doc: 'Inserta orden en public.oatc con estado EN_ESPERA y notifica a Recepción en Realtime.' },

    // 3. Recepción Central
    { id: 'Task_Recep_Monitor', type: 'userTask', laneId: 'Lane_Recep', name: 'Monitoreo de Cola OATC (QueueMonitor)', x: 860, y: 410, w: 130, h: 60, doc: 'Recepción valida cola en vivo (QueueMonitor.tsx) y evalúa carga de estilistas.' },
    { id: 'Gate_Recep_Asig', type: 'exclusiveGateway', laneId: 'Lane_Recep', name: '¿Orden Tiene Estilista Asignado?', x: 1030, y: 415, w: 50, h: 50, doc: 'Si tiene estilista asignado pasa a su sillón; si no, queda abierta para rotación.' },
    { id: 'Task_Recep_Asignar', type: 'userTask', laneId: 'Lane_Recep', name: 'Asignación Manual o Reagendamiento', x: 1120, y: 410, w: 130, h: 60, doc: 'Recepción asigna estilista según rotación de piso o brinda tiempo estimado al cliente.' },

    // 4. Estilista / Cosmiatra
    { id: 'Task_Estil_Reclamar', type: 'userTask', laneId: 'Lane_Estil', name: 'Reclamación de Orden en Móvil (TabCola)', x: 1290, y: 560, w: 130, h: 60, doc: 'El estilista visualiza la orden en TabCola.tsx y presiona "Atender en mi Sillón".' },
    { id: 'Task_Estil_Diag', type: 'userTask', laneId: 'Lane_Estil', name: 'Diagnóstico & Cronómetro Químico (Chairside)', x: 1460, y: 560, w: 140, h: 60, doc: 'StaffChairsideAssistant.tsx registra historial, activa cronómetro para tintes/decoloración.' },
    { id: 'Gate_Estil_Reqs', type: 'parallelGateway', laneId: 'Lane_Estil', name: 'Requerimientos de Atención', x: 1640, y: 565, w: 50, h: 50, doc: 'Dispara en paralelo solicitud a Laboratorio (químicos) y/o Bar (cortesías).' },
    { id: 'Task_Estil_PedLab', type: 'userTask', laneId: 'Lane_Estil', name: 'Solicitud de Fórmula a Laboratorio', x: 1730, y: 620, w: 130, h: 55, doc: 'El estilista solicita fórmula de tintes/decolorante con gramaje estimado.' },
    { id: 'Task_Estil_PedBar', type: 'userTask', laneId: 'Lane_Estil', name: 'Comanda de Bebida a Bar (TabBar)', x: 1730, y: 520, w: 130, h: 55, doc: 'Registra comanda de cortesía en cola_peticiones (tipo BAR_BEBIDA).' },
    { id: 'Task_Estil_Ejecutar', type: 'manualTask', laneId: 'Lane_Estil', name: 'Ejecución de Servicio y Venta Cruzada', x: 2260, y: 560, w: 140, h: 60, doc: 'Aplicación del tratamiento o corte, recomendaciones asistidas por Opal Copilot.' },
    { id: 'Task_Estil_FinServ', type: 'userTask', laneId: 'Lane_Estil', name: 'Finalizar Servicio & Derivar a Caja POS', x: 2450, y: 560, w: 130, h: 60, doc: 'Marca orden OATC como COMPLETADO y notifica al módulo de Caja en vivo.' },

    // 5. Laboratorio Químico
    { id: 'Task_Lab_Pesar', type: 'userTask', laneId: 'Lane_Lab', name: 'Pesaje en Balanza Web Serial (±2g)', x: 1910, y: 725, w: 130, h: 60, doc: 'LabDespachoView.tsx lee peso exacto de la balanza, formula con precisión y descuenta stock.' },
    { id: 'Task_Lab_Entregar', type: 'manualTask', laneId: 'Lane_Lab', name: 'Entrega de Bowl al Estilista', x: 2080, y: 725, w: 120, h: 60, doc: 'Entrega física de la preparación al especialista.' },

    // 6. Bar Boutique
    { id: 'Task_Bar_Prep', type: 'userTask', laneId: 'Lane_Bar', name: 'Preparación de Bebida / Café Especial', x: 1910, y: 845, w: 130, h: 60, doc: 'BarWorkspaceView.tsx reproduce campana Web Audio, barista toma orden y prepara.' },
    { id: 'Task_Bar_Servir', type: 'manualTask', laneId: 'Lane_Bar', name: 'Servicio en Sillón de Cliente', x: 2080, y: 845, w: 120, h: 60, doc: 'Entrega de la bebida de cortesía al cliente en su estación.' },

    // 7. Caja POS
    { id: 'Task_Caja_Cargar', type: 'userTask', laneId: 'Lane_Caja', name: 'Carga de Orden OATC & Liquidación', x: 2630, y: 965, w: 130, h: 60, doc: 'Cajero abre orden OATC en POS, audita ítems de cortesía marcados con badge ámbar.' },
    { id: 'Task_Caja_Cobro', type: 'userTask', laneId: 'Lane_Caja', name: 'Procesamiento de Cobro Multimoneda', x: 2820, y: 965, w: 130, h: 60, doc: 'Cobro en efectivo/POS/transferencia, cálculo de propina y comisiones de staff.' },
    { id: 'Task_Caja_Boleta', type: 'serviceTask', laneId: 'Lane_Caja', name: 'Emisión Boleta SUNAT & Puntos Lumina', x: 3000, y: 965, w: 140, h: 60, doc: 'Genera comprobante electrónico en public.comprobantes y abona LuminaCoins al cliente.' }
  ];

  const flows = [
    { id: 'Flow_1', source: 'Start_Cliente', target: 'Task_Cli_CheckIn', waypoints: [{ x: 216, y: 153 }, { x: 260, y: 153 }] },
    { id: 'Flow_2', source: 'Task_Cli_CheckIn', target: 'Task_Kiosk_Search', waypoints: [{ x: 320, y: 185 }, { x: 320, y: 265 }] },
    { id: 'Flow_3', source: 'Task_Kiosk_Search', target: 'Gate_Kiosk_Cita', waypoints: [{ x: 390, y: 295 }, { x: 440, y: 295 }] },
    { id: 'Flow_4', source: 'Gate_Kiosk_Cita', target: 'Task_Kiosk_Opal', name: 'Con Cita', waypoints: [{ x: 490, y: 295 }, { x: 530, y: 295 }] },
    { id: 'Flow_5', source: 'Gate_Kiosk_Cita', target: 'Task_Kiosk_OATC', name: 'Sin Cita', waypoints: [{ x: 465, y: 320 }, { x: 465, y: 345 }, { x: 765, y: 345 }, { x: 765, y: 325 }] },
    { id: 'Flow_6', source: 'Task_Kiosk_Opal', target: 'Task_Cli_Espera', waypoints: [{ x: 595, y: 265 }, { x: 595, y: 155 }, { x: 650, y: 155 }] },
    { id: 'Flow_7', source: 'Task_Kiosk_Opal', target: 'Task_Kiosk_OATC', waypoints: [{ x: 660, y: 295 }, { x: 700, y: 295 }] },
    { id: 'Flow_8', source: 'Task_Kiosk_OATC', target: 'Task_Recep_Monitor', waypoints: [{ x: 830, y: 295 }, { x: 925, y: 295 }, { x: 925, y: 410 }] },
    { id: 'Flow_9', source: 'Task_Recep_Monitor', target: 'Gate_Recep_Asig', waypoints: [{ x: 990, y: 440 }, { x: 1030, y: 440 }] },
    { id: 'Flow_10', source: 'Gate_Recep_Asig', target: 'Task_Recep_Asignar', name: 'Sin Asignar', waypoints: [{ x: 1080, y: 440 }, { x: 1120, y: 440 }] },
    { id: 'Flow_11', source: 'Gate_Recep_Asig', target: 'Task_Estil_Reclamar', name: 'Asignado', waypoints: [{ x: 1055, y: 465 }, { x: 1055, y: 505 }, { x: 1355, y: 505 }, { x: 1355, y: 560 }] },
    { id: 'Flow_12', source: 'Task_Recep_Asignar', target: 'Task_Estil_Reclamar', waypoints: [{ x: 1250, y: 440 }, { x: 1355, y: 440 }, { x: 1355, y: 560 }] },
    { id: 'Flow_13', source: 'Task_Estil_Reclamar', target: 'Task_Cli_Sillon', waypoints: [{ x: 1355, y: 560 }, { x: 1355, y: 155 }, { x: 1160, y: 155 }] },
    { id: 'Flow_14', source: 'Task_Estil_Reclamar', target: 'Task_Estil_Diag', waypoints: [{ x: 1420, y: 590 }, { x: 1460, y: 590 }] },
    { id: 'Flow_15', source: 'Task_Estil_Diag', target: 'Gate_Estil_Reqs', waypoints: [{ x: 1600, y: 590 }, { x: 1640, y: 590 }] },
    { id: 'Flow_16', source: 'Gate_Estil_Reqs', target: 'Task_Estil_PedLab', waypoints: [{ x: 1665, y: 615 }, { x: 1665, y: 647 }, { x: 1730, y: 647 }] },
    { id: 'Flow_17', source: 'Gate_Estil_Reqs', target: 'Task_Estil_PedBar', waypoints: [{ x: 1665, y: 565 }, { x: 1665, y: 547 }, { x: 1730, y: 547 }] },
    { id: 'Flow_18', source: 'Gate_Estil_Reqs', target: 'Task_Cli_Servicio', waypoints: [{ x: 1665, y: 565 }, { x: 1665, y: 155 }, { x: 1720, y: 155 }] },
    { id: 'Flow_19', source: 'Task_Estil_PedLab', target: 'Task_Lab_Pesar', waypoints: [{ x: 1860, y: 647 }, { x: 1880, y: 647 }, { x: 1880, y: 755 }, { x: 1910, y: 755 }] },
    { id: 'Flow_20', source: 'Task_Lab_Pesar', target: 'Task_Lab_Entregar', waypoints: [{ x: 2040, y: 755 }, { x: 2080, y: 755 }] },
    { id: 'Flow_21', source: 'Task_Lab_Entregar', target: 'Task_Estil_Ejecutar', waypoints: [{ x: 2200, y: 755 }, { x: 2230, y: 755 }, { x: 2230, y: 590 }, { x: 2260, y: 590 }] },
    { id: 'Flow_22', source: 'Task_Estil_PedBar', target: 'Task_Bar_Prep', waypoints: [{ x: 1860, y: 547 }, { x: 1880, y: 547 }, { x: 1880, y: 875 }, { x: 1910, y: 875 }] },
    { id: 'Flow_23', source: 'Task_Bar_Prep', target: 'Task_Bar_Servir', waypoints: [{ x: 2040, y: 875 }, { x: 2080, y: 875 }] },
    { id: 'Flow_24', source: 'Task_Bar_Servir', target: 'Task_Cli_Servicio', waypoints: [{ x: 2200, y: 875 }, { x: 2220, y: 875 }, { x: 2220, y: 185 }, { x: 1860, y: 155 }] },
    { id: 'Flow_25', source: 'Task_Estil_Ejecutar', target: 'Task_Estil_FinServ', waypoints: [{ x: 2400, y: 590 }, { x: 2450, y: 590 }] },
    { id: 'Flow_26', source: 'Task_Estil_FinServ', target: 'Task_Caja_Cargar', waypoints: [{ x: 2580, y: 590 }, { x: 2600, y: 590 }, { x: 2600, y: 995 }, { x: 2630, y: 995 }] },
    { id: 'Flow_27', source: 'Task_Caja_Cargar', target: 'Task_Caja_Cobro', waypoints: [{ x: 2760, y: 995 }, { x: 2820, y: 995 }] },
    { id: 'Flow_28', source: 'Task_Caja_Cobro', target: 'Task_Cli_Pago', waypoints: [{ x: 2885, y: 965 }, { x: 2885, y: 185 }] },
    { id: 'Flow_29', source: 'Task_Cli_Pago', target: 'Task_Caja_Boleta', waypoints: [{ x: 2980, y: 155 }, { x: 3070, y: 155 }, { x: 3070, y: 965 }] },
    { id: 'Flow_30', source: 'Task_Caja_Boleta', target: 'End_Cliente', waypoints: [{ x: 3070, y: 965 }, { x: 3118, y: 965 }, { x: 3118, y: 171 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds });
}

// =========================================================================
// DIAGRAMA 2: WORKFORCE MANAGEMENT (WFM) Y CONTROL DE TURNOS
// =========================================================================
function generateWfm() {
  const id = 'WFM_Turnos';
  const name = 'Gestión de Asistencia, Turnos NFC y Rotación de Piso (WFM Vaikuntha)';
  
  const poolBounds = { x: 100, y: 80, width: 2800, height: 750 };
  const lanes = [
    { id: 'Lane_Wfm_Staff', name: 'Colaborador (Staff Móvil)', bounds: { x: 130, y: 80, width: 2770, height: 180 } },
    { id: 'Lane_Wfm_Recep', name: 'Recepción Central / Supervisor', bounds: { x: 130, y: 260, width: 2770, height: 180 } },
    { id: 'Lane_Wfm_Engine', name: 'Motor Supabase Realtime & PostgreSQL', bounds: { x: 130, y: 440, width: 2770, height: 200 } },
    { id: 'Lane_Wfm_Piso', name: 'Rotación de Piso (Queue Engine)', bounds: { x: 130, y: 640, width: 2770, height: 150 } },
  ];

  const nodes = [
    // Staff Móvil
    { id: 'Start_Staff', type: 'startEvent', laneId: 'Lane_Wfm_Staff', name: 'Llegada del Colaborador', x: 180, y: 150, w: 36, h: 36, doc: 'Colaborador se presenta a laborar en su sede asignada.' },
    { id: 'Gate_Metodo_Marc', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Staff', name: '¿Dispone de Tag NFC?', x: 260, y: 143, w: 50, h: 50, doc: 'Evalúa si el teléfono cuenta con Web NFC y tag físico en puerta/comedor.' },
    { id: 'Task_Scan_NFC', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Escaneo de Tag NFC (Puerta/Comedor)', x: 360, y: 105, w: 140, h: 60, doc: 'useNfcBackgroundListener.ts sanitiza payload (PUERTA_PRINCIPAL / COMEDOR).' },
    { id: 'Task_Sol_Manual', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Solicitud Táctil en Móvil (TabEstacion)', x: 360, y: 195, w: 140, h: 60, doc: 'Presiona botón para solicitar inicio de turno, refrigerio o salida.' },
    { id: 'Task_Sel_Mov', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Selección Desambiguada de Movimiento', x: 550, y: 138, w: 140, h: 60, doc: 'Modal táctil de 1 toque: Entrada, Salir a Almorzar, Retorno Refrigerio o Fin Jornada.' },
    { id: 'Task_Banner_Espera', type: 'manualTask', laneId: 'Lane_Wfm_Staff', name: 'Visualización de Banner "Solicitud en Curso"', x: 1000, y: 138, w: 140, h: 60, doc: 'Muestra tarjeta ámbar reactiva con suscripción Realtime a cola_peticiones.' },
    { id: 'Gate_Staff_Feedback', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Staff', name: 'Resultado Recepción', x: 1800, y: 143, w: 50, h: 50, doc: 'Determina si la solicitud fue aprobada o rechazada en tiempo real.' },
    { id: 'Task_Staff_Rechazo', type: 'userTask', laneId: 'Lane_Wfm_Staff', name: 'Banner Carmesí de Rechazo con Motivo', x: 1920, y: 105, w: 150, h: 60, doc: 'TabEstacion.tsx muestra alerta con motivo de rechazo y botón "Volver a Solicitar".' },
    { id: 'Task_Staff_Activo', type: 'manualTask', laneId: 'Lane_Wfm_Staff', name: 'Turno Activo & Disponibilidad en Sillón', x: 2150, y: 138, w: 140, h: 60, doc: 'Colaborador listo para recibir órdenes de clientes en sillón asignado.' },
    { id: 'End_Staff_Ok', type: 'endEvent', laneId: 'Lane_Wfm_Staff', name: 'Jornada Iniciada', x: 2360, y: 150, w: 36, h: 36, doc: 'Turno operativo iniciado con sincronización en tiempo real.' },

    // Recepción Central
    { id: 'Task_Recep_Alerta', type: 'serviceTask', laneId: 'Lane_Wfm_Recep', name: 'Alerta Sonora & Toast de Petición WFM', x: 1000, y: 320, w: 140, h: 60, doc: 'QueueMonitor.tsx reproduce sonido agradable de campana y toast informativo.' },
    { id: 'Task_Recep_Eval', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Auditoría de Horario y Presencia Física', x: 1200, y: 320, w: 140, h: 60, doc: 'Recepcionista verifica si el colaborador está presente y programado para hoy.' },
    { id: 'Gate_Recep_Decide', type: 'exclusiveGateway', laneId: 'Lane_Wfm_Recep', name: '¿Aprobar Marcación?', x: 1400, y: 325, w: 50, h: 50, doc: 'Decisión supervisada de asistencia.' },
    { id: 'Task_Recep_ModalRech', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Modal de Rechazo con Motivo Parametrizado', x: 1520, y: 280, w: 150, h: 60, doc: 'Selección de motivo rápido (horario no programado, sede equivocada, etc.).' },
    { id: 'Task_Recep_Aprobar', type: 'userTask', laneId: 'Lane_Wfm_Recep', name: 'Confirmación 1-Clic de Aprobación', x: 1520, y: 380, w: 140, h: 60, doc: 'Acepta la marcación y muta la cola_peticiones a APROBADO.' },

    // Supabase Realtime & Engine
    { id: 'Task_DB_InsertPet', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Inserción en cola_peticiones (PENDIENTE)', x: 760, y: 505, w: 150, h: 60, doc: 'peticiones.ts inserta con sede_id verificado y agente_id autenticado.' },
    { id: 'Task_DB_WalBroadcast', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Emisión WAL Realtime (REPLICA IDENTITY FULL)', x: 1680, y: 505, w: 160, h: 60, doc: 'PostgreSQL WAL emite registro completo garantizando entrega a canales suscritos.' },
    { id: 'Task_DB_Audit', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Registro Inmutable en asistencias_turnos', x: 1900, y: 505, w: 150, h: 60, doc: 'Guarda timestamp UTC/Perú, método (NFC/DIGITAL) y metadata de auditoría laboral.' },
    { id: 'Task_DB_SyncEstado', type: 'serviceTask', laneId: 'Lane_Wfm_Engine', name: 'Auto-sanación de Estado Operativo Diario', x: 2100, y: 505, w: 150, h: 60, doc: 'obtenerEstadoOperativoDinamicoAgente actualiza public.agentes con estado dinámico hoy.' },

    // Rotación de Piso
    { id: 'Task_Piso_Recalc', type: 'businessRuleTask', laneId: 'Lane_Wfm_Piso', name: 'Recálculo de Posición en Piso (#X de Y)', x: 2100, y: 685, w: 150, h: 60, doc: 'Algoritmo de rotación asigna turno para clientes a demanda y actualiza TabCola.tsx.' }
  ];

  const flows = [
    { id: 'Wfm_F1', source: 'Start_Staff', target: 'Gate_Metodo_Marc', waypoints: [{ x: 216, y: 168 }, { x: 260, y: 168 }] },
    { id: 'Wfm_F2', source: 'Gate_Metodo_Marc', target: 'Task_Scan_NFC', name: 'NFC Disponible', waypoints: [{ x: 285, y: 143 }, { x: 285, y: 135 }, { x: 360, y: 135 }] },
    { id: 'Wfm_F3', source: 'Gate_Metodo_Marc', target: 'Task_Sol_Manual', name: 'Sin NFC', waypoints: [{ x: 285, y: 193 }, { x: 285, y: 225 }, { x: 360, y: 225 }] },
    { id: 'Wfm_F4', source: 'Task_Scan_NFC', target: 'Task_Sel_Mov', waypoints: [{ x: 500, y: 135 }, { x: 525, y: 135 }, { x: 525, y: 168 }, { x: 550, y: 168 }] },
    { id: 'Wfm_F5', source: 'Task_Sol_Manual', target: 'Task_Sel_Mov', waypoints: [{ x: 500, y: 225 }, { x: 525, y: 225 }, { x: 525, y: 168 }, { x: 550, y: 168 }] },
    { id: 'Wfm_F6', source: 'Task_Sel_Mov', target: 'Task_DB_InsertPet', waypoints: [{ x: 690, y: 168 }, { x: 720, y: 168 }, { x: 720, y: 535 }, { x: 760, y: 535 }] },
    { id: 'Wfm_F7', source: 'Task_DB_InsertPet', target: 'Task_Banner_Espera', waypoints: [{ x: 910, y: 535 }, { x: 950, y: 535 }, { x: 950, y: 168 }, { x: 1000, y: 168 }] },
    { id: 'Wfm_F8', source: 'Task_DB_InsertPet', target: 'Task_Recep_Alerta', waypoints: [{ x: 910, y: 535 }, { x: 950, y: 535 }, { x: 950, y: 350 }, { x: 1000, y: 350 }] },
    { id: 'Wfm_F9', source: 'Task_Recep_Alerta', target: 'Task_Recep_Eval', waypoints: [{ x: 1140, y: 350 }, { x: 1200, y: 350 }] },
    { id: 'Wfm_F10', source: 'Task_Recep_Eval', target: 'Gate_Recep_Decide', waypoints: [{ x: 1340, y: 350 }, { x: 1400, y: 350 }] },
    { id: 'Wfm_F11', source: 'Gate_Recep_Decide', target: 'Task_Recep_ModalRech', name: 'Rechazar', waypoints: [{ x: 1425, y: 325 }, { x: 1425, y: 310 }, { x: 1520, y: 310 }] },
    { id: 'Wfm_F12', source: 'Gate_Recep_Decide', target: 'Task_Recep_Aprobar', name: 'Aprobar', waypoints: [{ x: 1425, y: 375 }, { x: 1425, y: 410 }, { x: 1520, y: 410 }] },
    { id: 'Wfm_F13', source: 'Task_Recep_ModalRech', target: 'Task_DB_WalBroadcast', waypoints: [{ x: 1670, y: 310 }, { x: 1760, y: 310 }, { x: 1760, y: 505 }] },
    { id: 'Wfm_F14', source: 'Task_Recep_Aprobar', target: 'Task_DB_WalBroadcast', waypoints: [{ x: 1660, y: 410 }, { x: 1760, y: 410 }, { x: 1760, y: 505 }] },
    { id: 'Wfm_F15', source: 'Task_DB_WalBroadcast', target: 'Gate_Staff_Feedback', waypoints: [{ x: 1760, y: 505 }, { x: 1760, y: 168 }, { x: 1800, y: 168 }] },
    { id: 'Wfm_F16', source: 'Gate_Staff_Feedback', target: 'Task_Staff_Rechazo', name: 'Rechazado', waypoints: [{ x: 1825, y: 143 }, { x: 1825, y: 135 }, { x: 1920, y: 135 }] },
    { id: 'Wfm_F17', source: 'Gate_Staff_Feedback', target: 'Task_DB_Audit', name: 'Aprobado', waypoints: [{ x: 1825, y: 193 }, { x: 1825, y: 535 }, { x: 1900, y: 535 }] },
    { id: 'Wfm_F18', source: 'Task_DB_Audit', target: 'Task_DB_SyncEstado', waypoints: [{ x: 2050, y: 535 }, { x: 2100, y: 535 }] },
    { id: 'Wfm_F19', source: 'Task_DB_SyncEstado', target: 'Task_Staff_Activo', waypoints: [{ x: 2175, y: 505 }, { x: 2175, y: 198 }] },
    { id: 'Wfm_F20', source: 'Task_DB_SyncEstado', target: 'Task_Piso_Recalc', waypoints: [{ x: 2175, y: 565 }, { x: 2175, y: 685 }] },
    { id: 'Wfm_F21', source: 'Task_Staff_Activo', target: 'End_Staff_Ok', waypoints: [{ x: 2290, y: 168 }, { x: 2360, y: 168 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds });
}

// =========================================================================
// DIAGRAMA 3: LABORATORIO QUÍMICO Y CADENA DE SUMINISTRO
// =========================================================================
function generateLaboratorio() {
  const id = 'Lab_Suministros';
  const name = 'Cadena de Suministro y Laboratorio Químico - Vaikuntha ERP';
  
  const poolBounds = { x: 100, y: 80, width: 2600, height: 750 };
  const lanes = [
    { id: 'Lane_Lab_Estil', name: 'Estilista Solicitante', bounds: { x: 130, y: 80, width: 2570, height: 180 } },
    { id: 'Lane_Lab_Quimico', name: 'Encargado de Laboratorio', bounds: { x: 130, y: 260, width: 2570, height: 200 } },
    { id: 'Lane_Lab_Kardex', name: 'Motor de Inventario & Kardex', bounds: { x: 130, y: 460, width: 2570, height: 150 } },
    { id: 'Lane_Lab_Compras', name: 'Administración & Compras', bounds: { x: 130, y: 610, width: 2570, height: 140 } },
  ];

  const nodes = [
    // Estilista
    { id: 'Start_Lab_Req', type: 'startEvent', laneId: 'Lane_Lab_Estil', name: 'Necesidad de Mezcla Química', x: 180, y: 150, w: 36, h: 36, doc: 'Estilista diagnostica servicio (tinte, decoloración, plex).' },
    { id: 'Task_Estil_Formulacion', type: 'userTask', laneId: 'Lane_Lab_Estil', name: 'Selección de Fórmula & Gramaje en Móvil', x: 260, y: 138, w: 140, h: 60, doc: 'Ingreso de código de producto y gramos proyectados en app.' },
    { id: 'Task_Estil_RecibeBowl', type: 'manualTask', laneId: 'Lane_Lab_Estil', name: 'Recepción de Bowl de Mezcla', x: 1350, y: 138, w: 130, h: 60, doc: 'Estilista recibe el bowl listo para aplicar en el cliente.' },
    { id: 'Task_Estil_Aplicar', type: 'manualTask', laneId: 'Lane_Lab_Estil', name: 'Aplicación en Cabello & Control Cronómetro', x: 1550, y: 138, w: 140, h: 60, doc: 'Aplicación química y control de tiempo de exposición.' },
    { id: 'Task_Estil_Sobrante', type: 'userTask', laneId: 'Lane_Lab_Estil', name: 'Declaración de Sobrante o Merma', x: 1750, y: 138, w: 130, h: 60, doc: 'Registra si sobró producto para auditoría de desperdicio.' },
    { id: 'End_Lab_Serv', type: 'endEvent', laneId: 'Lane_Lab_Estil', name: 'Aplicación Química Concluida', x: 1950, y: 150, w: 36, h: 36, doc: 'Servicio químico aplicado exitosamente.' },

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
    { id: 'Lab_F10', source: 'Task_Estil_RecibeBowl', target: 'Task_Estil_Aplicar', waypoints: [{ x: 1480, y: 168 }, { x: 1550, y: 168 }] },
    { id: 'Lab_F11', source: 'Task_Estil_Aplicar', target: 'Task_Estil_Sobrante', waypoints: [{ x: 1690, y: 168 }, { x: 1750, y: 168 }] },
    { id: 'Lab_F12', source: 'Task_Estil_Sobrante', target: 'End_Lab_Serv', waypoints: [{ x: 1880, y: 168 }, { x: 1950, y: 168 }] },
    { id: 'Lab_F13', source: 'Task_Kardex_Deduccion', target: 'Gate_Kardex_Minimo', waypoints: [{ x: 1290, y: 535 }, { x: 1350, y: 535 }] },
    { id: 'Lab_F14', source: 'Gate_Kardex_Minimo', target: 'Task_Kardex_Alerta', name: 'Stock Bajo', waypoints: [{ x: 1400, y: 535 }, { x: 1470, y: 535 }] },
    { id: 'Lab_F15', source: 'Task_Kardex_Alerta', target: 'Task_Compras_OpalPredictor', waypoints: [{ x: 1545, y: 565 }, { x: 1545, y: 650 }] },
    { id: 'Lab_F16', source: 'Task_Compras_OpalPredictor', target: 'Task_Compras_GenerarOC', waypoints: [{ x: 1620, y: 680 }, { x: 1680, y: 680 }] },
    { id: 'Lab_F17', source: 'Task_Compras_GenerarOC', target: 'End_Lab_StockOk', waypoints: [{ x: 1830, y: 680 }, { x: 1900, y: 680 }] }
  ];

  return buildBpmnXml({ id, name, lanes, nodes, flows, poolBounds });
}

// =========================================================================
// MAIN RUNNER
// =========================================================================
function main() {
  console.log('🚀 Iniciando generación de diagramas BPMN 2.0 para Bizagi Modeler...');

  // 1. Macroproceso
  const macroXml = generateMacroproceso();
  const macroPath = path.join(outputDir, 'macroproceso_operativo_vaikuntha.bpmn');
  fs.writeFileSync(macroPath, macroXml, 'utf-8');
  console.log(`✅ [1/3] Generado: ${macroPath} (${(macroXml.length / 1024).toFixed(1)} KB)`);

  // 2. WFM
  const wfmXml = generateWfm();
  const wfmPath = path.join(outputDir, 'wfm_control_asistencia_turnos.bpmn');
  fs.writeFileSync(wfmPath, wfmXml, 'utf-8');
  console.log(`✅ [2/3] Generado: ${wfmPath} (${(wfmXml.length / 1024).toFixed(1)} KB)`);

  // 3. Laboratorio
  const labXml = generateLaboratorio();
  const labPath = path.join(outputDir, 'laboratorio_cadena_suministro.bpmn');
  fs.writeFileSync(labPath, labXml, 'utf-8');
  console.log(`✅ [3/3] Generado: ${labPath} (${(labXml.length / 1024).toFixed(1)} KB)`);

  console.log('🎉 Todos los diagramas BPMN 2.0 fueron generados exitosamente.');
}

main();
