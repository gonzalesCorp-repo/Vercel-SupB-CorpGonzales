const xlsx = require('xlsx');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://eeajeeufdxythnaufjcc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlYWplZXVmZHh5dGhuYXVmamNjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjI2MjIzMywiZXhwIjoyMDk3ODM4MjMzfQ.kcc-Lj8Vxy18Nhaq3t0f6ROftsyBuyFaC5_7L1WcC2Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dir = 'C:\\Users\\Admin\\.gemini\\antigravity\\scratch\\ERP-FireBase-VERCEL-Gonzales\\Datos Excel';
const SEDE_ID = 'd954b259-69a0-4546-9156-2f6ad392853f'; // Unidad de Prueba (Sandbox)

function getFirst3Letters(str) {
  if (!str) return 'XXX';
  return String(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase().padEnd(3, 'X');
}

function generateSKU(marca, linea, nombre, tipo, presentacion) {
  return `${getFirst3Letters(marca)}-${getFirst3Letters(linea)}-${getFirst3Letters(nombre)}-${getFirst3Letters(tipo)}-${getFirst3Letters(presentacion)}`;
}

async function runSeed() {
  console.log('Iniciando seed masivo...');

  // 1. Cargar Excels
  let insumosData = [];
  try {
    const wb = xlsx.readFile(path.join(dir, 'BBDD_Despacho.xlsx'));
    insumosData = xlsx.utils.sheet_to_json(wb.Sheets['DB_Inventario'], { header: 1 }).slice(1);
  } catch (e) { console.error('Error leyendo BBDD_Despacho.xlsx:', e.message); }

  let retailData = [];
  try {
    const wb = xlsx.readFile(path.join(dir, 'BBDD_Retail.xlsx'));
    retailData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 }).slice(1);
  } catch (e) { console.error('Error leyendo BBDD_Retail.xlsx:', e.message); }

  console.log(`Leidos ${insumosData.length} insumos y ${retailData.length} productos retail.`);

  // Mezclar y tomar 500 de cada uno
  const sampleInsumos = insumosData.sort(() => 0.5 - Math.random()).slice(0, 500);
  const sampleRetail = retailData.sort(() => 0.5 - Math.random()).slice(0, 500);

  let insertedInsumos = 0;
  let insertedRetail = 0;

  console.log('Procesando Insumos...');
  for (const row of sampleInsumos) {
    if (row.length < 5) continue;
    
    // ['Proveedor', 'Marca', 'Línea', 'Nombre', 'SKU', 'Presentacion', 'Tipo', 'Stock Principal', 'Stock Laboratorio', 'Costo Unitario', 'Stock Mínimo', 'Ubicación en Almacén', 'Stock En Uso']
    const marca = row[1] || 'GEN';
    const linea = row[2] || 'GEN';
    const nombre = row[3] || 'Desconocido';
    const tipo = row[6] || 'INS';
    const presentacion = row[5] || 'UN';
    const costo = parseFloat(row[9]) || 0;
    const proveedor = row[0] || 'Genérico';
    
    const sku = generateSKU(marca, linea, nombre, tipo, presentacion);

    const { data: bien, error } = await supabase.from('bienes').insert([{
      nombre: nombre,
      categoria: linea,
      tipo_bien: 'producto', // Forced to 'producto' to pass DB check constraint
      atributos_producto: {
        sku, marca, linea, presentacion, proveedor, costo_unitario: costo, tipo_catalogo: 'insumo'
      }
    }]).select('id').single();

    if (bien) {
      await supabase.from('almacen_principal').insert([{
        sede_id: SEDE_ID,
        bien_id: bien.id,
        proveedor, marca, linea, presentacion,
        stock: 100, costo_unitario: costo, ubicacion: 'RACK PRINCIPAL'
      }]);

      await supabase.from('almacen_laboratorio').insert([{
        sede_id: SEDE_ID,
        bien_id: bien.id,
        stock_actual: 100, stock_en_uso: 0
      }]);
      insertedInsumos++;
    }
  }

  console.log('Procesando Retail...');
  for (const row of sampleRetail) {
    if (row.length < 5) continue;
    // ['SKU', 'Marca', 'Línea', 'Nombre', 'Presentacion', 'Precio', 'Proveedor', 'Stock Tienda', 'Stock Principal', 'Costo Unitario', 'Ubicación en Almacén', 'Stock Mínimo', 'Precio Min']
    const marca = row[1] || 'GEN';
    const linea = row[2] || 'GEN';
    const nombre = row[3] || 'Desconocido';
    const presentacion = row[4] || 'UN';
    const precio = parseFloat(row[5]) || 0;
    const proveedor = row[6] || 'Genérico';
    const costo = parseFloat(row[9]) || 0;
    const precioMin = parseFloat(row[12]) || precio;

    const sku = generateSKU(marca, linea, nombre, 'RET', presentacion);

    const { data: bien, error } = await supabase.from('bienes').insert([{
      nombre: nombre,
      categoria: linea,
      tipo_bien: 'producto',
      precio_venta: precio,
      atributos_producto: {
        sku, marca, linea, presentacion, proveedor, costo_unitario: costo, precio_min: precioMin, tipo_catalogo: 'retail'
      }
    }]).select('id').single();

    if (bien) {
      await supabase.from('almacen_principal').insert([{
        sede_id: SEDE_ID,
        bien_id: bien.id,
        proveedor, marca, linea, presentacion,
        stock: 100, costo_unitario: costo, ubicacion: 'RACK PRINCIPAL'
      }]);
      insertedRetail++;
    }
  }

  console.log(`Seed completado! Insumos: ${insertedInsumos} | Retail: ${insertedRetail}`);
}

runSeed();
