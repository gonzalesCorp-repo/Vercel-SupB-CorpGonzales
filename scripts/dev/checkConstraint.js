const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { sql: `
    SELECT pg_get_constraintdef(oid) AS constraint_def
    FROM pg_constraint
    WHERE conname = 'agentes_estado_check';
  ` });
  if (error) {
    console.log("RPC Error. Trying direct fetch...", error);
    // Let's just ask the user or guess.
  }
  console.log(data);
}
run();
