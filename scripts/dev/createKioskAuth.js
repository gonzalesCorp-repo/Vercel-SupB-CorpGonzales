const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupKioskUser() {
  console.log('1. Intentando signUp de kiosk@vaikuntha.com en Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'kiosk@vaikuntha.com',
    password: '123456'
  });

  if (authError) {
    console.log('Aviso Auth:', authError.message);
  } else {
    console.log('Usuario Auth creado:', authData.user?.id);
  }

  // 2. Registrar en la tabla agentes si no existe
  const { data: sede } = await supabase.from('sedes').select('id').limit(1).maybeSingle();
  const sedeId = sede?.id;

  const { data: agente, error: agenteError } = await supabase
    .from('agentes')
    .upsert({
      nombre: 'Kiosko Tótem Central',
      email: 'kiosk@vaikuntha.com',
      rol: 'KIOSKO',
      estado: 'DISPONIBLE',
      especialidad: 'Tótem Táctil Autoservicio',
      sedes_ids: sedeId ? [sedeId] : []
    }, { onConflict: 'email' })
    .select();

  console.log('Agente Kiosko en BD:', agente, agenteError);
}

setupKioskUser();
