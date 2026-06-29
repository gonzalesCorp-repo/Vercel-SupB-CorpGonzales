require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'cristian@gonzales.page',
    password: 'password123'
  });
  
  if (authErr) {
    console.error("Login failed:", authErr);
    return;
  }
  
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre, estado, rol, especialidad, ultimo_cambio_estado, created_at, sedes_usuarios(sede_id)');
    
  console.log('Agentes count:', data?.length);
  console.log('Error:', error);
}

test();
