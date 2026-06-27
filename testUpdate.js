const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // USE ANON KEY
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: agentes } = await supabase.from('agentes').select('*');
  console.log("Agentes:", agentes?.length);
  
  if (agentes && agentes.length > 0) {
    const { data, error } = await supabase.from('agentes').update({ estado: 'DISPONIBLE' }).eq('id', agentes[0].id).select();
    console.log("Update Error:", error);
    console.log("Updated Data:", data);
  }
}
run();
