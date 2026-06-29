import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const coreWfm = [
    { id: '11111111-1111-1111-1111-111111111111', nombre: 'Inicio de Turno / Asistencia', penaliza_cola: false, color: 'bg-emerald-100 text-emerald-700', estado_destino: 'DISPONIBLE', actualiza_timestamp: true },
    { id: '22222222-2222-2222-2222-222222222222', nombre: 'Refrigerio', penaliza_cola: true, color: 'bg-orange-100 text-orange-700', estado_destino: 'INACTIVO', actualiza_timestamp: true },
    { id: '33333333-3333-3333-3333-333333333333', nombre: 'Fin de Turno / Salida', penaliza_cola: true, color: 'bg-red-100 text-red-700', estado_destino: 'INACTIVO', actualiza_timestamp: true }
  ];

  for (const wfm of coreWfm) {
    const { error } = await supabase.from('config_peticiones').upsert(wfm, { onConflict: 'id' });
    if (error) console.log("ERROR upserting", wfm.nombre, error);
    else console.log("Upserted", wfm.nombre);
  }
}
check();
