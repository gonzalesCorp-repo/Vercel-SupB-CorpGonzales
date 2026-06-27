const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('cola_peticiones').insert([{
    agente_id: '0115bf49-eb69-46f2-8501-23e3b422d8dc', // Democrito
    sede_id: 'sede-1', // Wait, is sede-1 correct?
    tipo_id: 'c05f77da-0857-4148-8ebf-149bdeebfba8', // Random type? I don't know the tipo_id. Let's find one first.
    estado: 'PENDIENTE'
  }]).select();
  console.log("Insert result:", error || data);
}

async function findSedeAndType() {
  const { data: sedes } = await supabase.from('sedes').select('id').limit(1);
  const { data: tipos } = await supabase.from('config_peticiones').select('id').limit(1);
  if (sedes.length > 0 && tipos.length > 0) {
    const { data, error } = await supabase.from('cola_peticiones').insert([{
      agente_id: '0115bf49-eb69-46f2-8501-23e3b422d8dc',
      sede_id: sedes[0].id,
      tipo_id: tipos[0].id,
      estado: 'PENDIENTE'
    }]).select();
    console.log("Insert result:", error || data);
  }
}
findSedeAndType();
