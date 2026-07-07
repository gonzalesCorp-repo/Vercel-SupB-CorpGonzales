import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function run() {
  const res = await fetch(`${url}/rest/v1/?apikey=${key}`, {
    headers: { 'apikey': key }
  });
  const data = await res.json();
  const tables = data.definitions;
  const withSedeId = [];
  const withoutSedeId = [];

  for (let t in tables) {
    if (tables[t].properties) {
      if (tables[t].properties['sede_id']) {
        withSedeId.push(t);
      } else {
        withoutSedeId.push(t);
      }
    }
  }

  console.log("=== REPORTE DE TABLAS SUPABASE ===");
  console.log("Tablas CON sede_id:", withSedeId.join(", "));
  console.log("----------------------------------");
  console.log("Tablas SIN sede_id:", withoutSedeId.join(", "));
}

run();
