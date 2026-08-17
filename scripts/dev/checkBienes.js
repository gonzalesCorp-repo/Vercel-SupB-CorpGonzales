const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBienes() {
  const { data, error } = await supabase.from('bienes').select('id, nombre, tipo_bien, categoria, precio_venta').limit(10);
  console.log('Bienes en BD:', data, error);
}

checkBienes();
