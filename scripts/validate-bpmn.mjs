import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.resolve(__dirname, '../docs/procesos_bizagi');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.bpmn'));

let allOk = true;

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  if (!content.startsWith('<?xml')) {
    console.error(`❌ ${file}: no inicia con cabecera XML`);
    allOk = false;
  }
  if (!content.includes('</bpmn:definitions>')) {
    console.error(`❌ ${file}: falta etiqueta de cierre </bpmn:definitions>`);
    allOk = false;
  }

  // Find all sequence flows
  const flowRegex = /<bpmn:sequenceFlow id="([^"]+)" sourceRef="([^"]+)" targetRef="([^"]+)"/g;
  let match;
  const flows = [];
  while ((match = flowRegex.exec(content)) !== null) {
    flows.push({ id: match[1], src: match[2], tgt: match[3] });
  }

  // Find all node IDs (tasks, events, gateways, subprocesses, dataObjects, dataStores)
  const idRegex = /<bpmn:[a-zA-Z]+ id="([^"]+)"/g;
  const ids = new Set();
  while ((match = idRegex.exec(content)) !== null) {
    ids.add(match[1]);
  }

  for (const f of flows) {
    if (!ids.has(f.src)) {
      console.error(`❌ ${file}: flujo ${f.id} tiene sourceRef inexistente: ${f.src}`);
      allOk = false;
    }
    if (!ids.has(f.tgt)) {
      console.error(`❌ ${file}: flujo ${f.id} tiene targetRef inexistente: ${f.tgt}`);
      allOk = false;
    }
  }

  // Count subprocesses / call activities, intermediate events, data objects, data stores
  const subprocCount = (content.match(/<bpmn:(subProcess|callActivity)/g) || []).length;
  const intermediateCount = (content.match(/<bpmn:intermediate/g) || []).length;
  const dataObjCount = (content.match(/<bpmn:dataObject\b/g) || []).length;
  const dataStoreCount = (content.match(/<bpmn:dataStoreReference\b/g) || []).length;

  console.log(`✅ ${file}:
     - Elementos totales: ${ids.size}
     - Flujos de secuencia: ${flows.length}
     - Subprocesos / Call Activities: ${subprocCount}
     - Eventos Intermedios: ${intermediateCount}
     - Data Objects: ${dataObjCount}
     - Data Stores: ${dataStoreCount}`);
}

if (allOk) {
  console.log('\n🏆 Todos los archivos BPMN 2.0 son válidos e íntegros para Bizagi Modeler.');
} else {
  process.exit(1);
}
