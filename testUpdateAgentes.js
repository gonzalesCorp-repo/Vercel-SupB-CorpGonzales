const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: policies, error: e1 } = await supabase.from('pg_policies').select('*').eq('tablename', 'agentes');
  console.log("Políticas actuales en agentes:");
  console.log(policies || e1);

  // Intentemos actualizar a Heráclito
  const { data, error } = await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('email', 'heraclito@vainkuntha.com').select();
  console.log("Update Service Role Result:", error || data);
}
run();
