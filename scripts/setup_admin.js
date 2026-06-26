const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY no está definido en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log("Iniciando limpieza y configuración de Base de Datos...");

  // 1. Limpiar sedes_usuarios falsos
  const { error: errSedes } = await supabase.from('sedes_usuarios').delete().neq('agente_id', '00000000-0000-0000-0000-000000000000'); // Delete all basically
  if (errSedes) console.log("Nota en sedes_usuarios (Puede estar vacía):", errSedes.message);

  // 2. Limpiar agentes falsos
  const { error: errAgentes } = await supabase.from('agentes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errAgentes) console.log("Nota en agentes (Puede estar vacía):", errAgentes.message);

  console.log("✔ Tablas agentes y sedes_usuarios limpiadas.");

  // 3. Buscar al owner en auth.users
  const { data: usersData, error: usersErr } = await supabase.auth.admin.listUsers();
  if (usersErr) {
    console.error("Error buscando usuarios:", usersErr);
    process.exit(1);
  }

  const owner = usersData.users.find(u => u.email === 'cristian@gonzales.page');
  
  if (!owner) {
    console.error("ERROR: No se encontró al usuario cristian@gonzales.page en Supabase Auth.");
    process.exit(1);
  }

  console.log(`Owner encontrado. ID: ${owner.id}`);

  // 4. Crear su perfil SUPERADMIN en agentes
  const { error: insertErr } = await supabase.from('agentes').insert([{
    id: owner.id,
    nombre: 'Cristian Gonzales (Owner)',
    email: owner.email,
    rol: 'SUPERADMIN',
    estado: 'DISPONIBLE'
  }]);

  if (insertErr) {
    console.error("Error asignando SUPERADMIN:", insertErr.message);
  } else {
    console.log("✔ Perfil SUPERADMIN creado exitosamente.");
  }

  // 5. Opcional: Darle acceso a la primera sede si existe
  const { data: sedes } = await supabase.from('sedes').select('id').limit(1);
  if (sedes && sedes.length > 0) {
    await supabase.from('sedes_usuarios').insert([{
      agente_id: owner.id,
      sede_id: sedes[0].id
    }]);
    console.log("✔ Acceso a sede asignado al SUPERADMIN.");
  }

  console.log("¡Configuración finalizada con éxito!");
}

setup();
