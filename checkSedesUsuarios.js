const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: agentes } = await supabaseAdmin.from('agentes').select('id, nombre, email').eq('email', 'tales@vaikuntha.com');
  console.log("Agente Tales:", agentes);
  
  if (agentes && agentes.length > 0) {
    const { data: sedes_usuarios, error } = await supabaseAdmin.from('sedes_usuarios').select('*').eq('agente_id', agentes[0].id);
    console.log("Sedes asignadas a Tales:", sedes_usuarios);
    if (error) console.error("Error:", error);
  }
}
main();
