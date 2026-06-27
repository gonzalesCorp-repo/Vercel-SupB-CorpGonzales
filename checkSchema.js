const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // We can't do ALTER TABLE with JS client. 
  // So we will just use the `agentes` table. Wait! Does `agentes` have a `metadata` column?
  const { data, error } = await supabase.from('agentes').select('*').limit(1);
  console.log(data);
}
run();
