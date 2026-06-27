const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('get_policies');
  if (error) {
    // If RPC doesn't exist, try querying pg_policies
    const { data: policies, error: err2 } = await supabase.from('pg_policies').select('*').eq('tablename', 'cola_peticiones');
    console.log(err2 || policies);
  } else {
    console.log(data);
  }
}
run();
