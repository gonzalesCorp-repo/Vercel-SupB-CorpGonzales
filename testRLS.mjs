import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  // Login as Democrito
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'democrito@vaikuntha.com',
    password: 'Gonzales123.'
  });
  
  if (authError) {
    console.error("Login error:", authError.message);
    return;
  }
  
  console.log("Logged in as Democrito");

  // Query exactly as obtenerAgentesDisponibles
  const { data, error } = await supabase
    .from('agentes')
    .select('id, nombre, estado, rol, especialidad, sedes_usuarios(sede_id)');
    
  if (error) {
    console.error("Query error:", error.message);
    return;
  }
  
  console.log("Agents fetched:", data.length);
  
  const miAgente = data.find(a => a.id === '0115bf49-eb69-46f2-8501-23e3b422d8dc');
  console.log("Mi Agente data:", JSON.stringify(miAgente, null, 2));
}

test();
