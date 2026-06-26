const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('sedes').insert([
    { nombre: 'Sede Central (Sandbox)', direccion: 'Av. Falsa 123' }
  ]).select();

  if (error) {
    console.error('Error insertando sede:', error);
  } else {
    console.log('Sede insertada con éxito:', data);
  }
}

main();
