require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const sedeId = 'd954b259-69a0-4546-9156-2f6ad392853f'; // Sandbox
  
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre, estado, rol, especialidad, ultimo_cambio_estado, created_at, sedes_usuarios(sede_id)');
    
  if (error) {
    console.error(error);
    return;
  }
  
  const filtered = data.filter(agente => 
    agente.sedes_usuarios && agente.sedes_usuarios.some(su => su.sede_id === sedeId)
  );
  
  console.log("Filtered length:", filtered.length);
  
  const agentesEnCola = filtered
    .filter(a => a.estado !== 'INACTIVO' && a.rol === 'STAFF')
    .sort((a, b) => {
      const timeA = new Date(a.ultimo_cambio_estado || a.created_at).getTime();
      const timeB = new Date(b.ultimo_cambio_estado || b.created_at).getTime();
      return timeA - timeB;
    });
    
  console.log("En Cola:");
  console.dir(agentesEnCola, { depth: null });
}

test();
