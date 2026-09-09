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

  const flowRegex = /<bpmn:sequenceFlow id="([^"]+)" sourceRef="([^"]+)" targetRef="([^"]+)"/g;
  let match;
  const flows = [];
  while ((match = flowRegex.exec(content)) !== null) {
    flows.push({ id: match[1], src: match[2], tgt: match[3] });
  }

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

  console.log(`✅ ${file} validado: ${ids.size} elementos BPMN, ${flows.length} flujos secuenciales.`);
}

if (allOk) {
  console.log('\n🏆 Todos los archivos BPMN 2.0 son válidos e íntegros para Bizagi Modeler.');
} else {
  process.exit(1);
}
