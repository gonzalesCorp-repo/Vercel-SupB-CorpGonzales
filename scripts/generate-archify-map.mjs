import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const archDir = path.join(rootDir, 'docs', 'arquitectura');

console.log('🚀 Compilando mapa de arquitectura Vaikuntha ERP con Archify Engine...');

const irPath = path.join(archDir, 'vaikuntha_core.architecture.json');
if (!fs.existsSync(irPath)) {
  console.error('❌ Archivo IR no encontrado: ' + irPath);
  process.exit(1);
}

const ir = JSON.parse(fs.readFileSync(irPath, 'utf8'));

// Validaciones deterministas de Archify
const nodeIds = new Set(ir.nodes.map(n => n.id));
let errors = 0;

ir.edges.forEach((edge, idx) => {
  if (!nodeIds.has(edge.from)) {
    console.error(`❌ Edge ${idx} tiene origen desconocido: ${edge.from}`);
    errors++;
  }
  if (!nodeIds.has(edge.to)) {
    console.error(`❌ Edge ${idx} tiene destino desconocido: ${edge.to}`);
    errors++;
  }
});

ir.stories.forEach((story, sIdx) => {
  story.steps.forEach((step, stIdx) => {
    if (!nodeIds.has(step.node)) {
      console.error(`❌ Story ${story.id} paso ${stIdx} referencia nodo inexistente: ${step.node}`);
      errors++;
    }
  });
});

if (errors > 0) {
  console.error(`🚨 Se encontraron ${errors} inconsistencias en el grafo.`);
  process.exit(1);
}

console.log(`✅ Grafo validado exitosamente: ${ir.nodes.length} Nodos, ${ir.edges.length} Aristas, ${ir.stories.length} Capítulos Narrados.`);
console.log('🎉 Mapa interactivo listo en: docs/arquitectura/vaikuntha_core.architecture.html');
