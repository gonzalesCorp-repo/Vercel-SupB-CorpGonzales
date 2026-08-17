const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'cristian@gonzales.page',
    password: '301093Cz' 
  });
  
  if (authError) {
    console.error("Login Error:", authError.message);
  }

  const { data, error } = await supabase
    .from('agentes')
    .select(`
      *,
      sedes_usuarios(sede_id)
    `);
    
  if (error) {
    console.error("Query Error:", error);
  } else {
    const pitagoras = data.find(a => a.email === 'pitagoras@vaikuntha.com');
    if (pitagoras) {
       console.log("Pitagoras:", pitagoras);
    } else {
       console.log("Pitagoras not found, showing tales:");
       console.log(data.find(a => a.email === 'tales@vaikuntha.com'));
    }
  }
}

main();
