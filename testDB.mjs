import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data } = await supabase.from('sedes_usuarios').select('*').eq('agente_id', '0115bf49-eb69-46f2-8501-23e3b422d8dc');
  console.log("SEDES DEMOCRITO:", data);
}
check();
