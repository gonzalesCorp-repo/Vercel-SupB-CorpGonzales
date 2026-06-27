const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase
    .from('cola_peticiones')
    .select('*, config_peticiones(nombre, color, penaliza_cola), agentes(nombre, rol)')
    .eq('estado', 'PENDIENTE');
  
  console.log("With agentes():", error || data);

  const { data: d2, error: e2 } = await supabase
    .from('cola_peticiones')
    .select('*, config_peticiones(nombre, color, penaliza_cola), agentes!agente_id(nombre, rol)')
    .eq('estado', 'PENDIENTE');

  console.log("With agentes!agente_id():", e2 || d2);
}
run();
