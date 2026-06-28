const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

const newConfigs = [
  { nombre: 'Inicio de Turno', estado_destino: 'DISPONIBLE', actualiza_timestamp: true, penaliza_cola: false, color: 'bg-emerald-100 text-emerald-800' },
  { nombre: 'Fin de Turno', estado_destino: 'INACTIVO', actualiza_timestamp: true, penaliza_cola: true, color: 'bg-red-100 text-red-800' },
  { nombre: 'Retorno de Servicio', estado_destino: 'DISPONIBLE', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-indigo-100 text-indigo-800' },
  { nombre: 'En Refrigerio', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-orange-100 text-orange-800' },
  { nombre: 'Ausente', estado_destino: 'INACTIVO', actualiza_timestamp: true, penaliza_cola: true, color: 'bg-red-100 text-red-800' },
  { nombre: 'En Terapia', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-purple-100 text-purple-800' },
  { nombre: 'Pasar la voz', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-pink-100 text-pink-800' },
  { nombre: 'Salió (ya regresa)', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-yellow-100 text-yellow-800' },
  { nombre: 'En otro salón', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-teal-100 text-teal-800' },
  { nombre: 'Asesorando', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-blue-100 text-blue-800' },
  { nombre: 'Trabajando', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-blue-100 text-blue-800' },
  { nombre: 'Corrigiendo', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-orange-100 text-orange-800' },
  { nombre: 'Atendiendo un niño', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-emerald-100 text-emerald-800' },
  { nombre: 'Apoyando', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-indigo-100 text-indigo-800' },
  { nombre: 'En Exposición', estado_destino: 'OCUPADO', actualiza_timestamp: false, penaliza_cola: false, color: 'bg-purple-100 text-purple-800' },
];

async function run() {
  for (const conf of newConfigs) {
    const { data: existing } = await supabase.from('config_peticiones').select('id').eq('nombre', conf.nombre).single();
    if (existing) {
      await supabase.from('config_peticiones').update(conf).eq('id', existing.id);
      console.log('Updated:', conf.nombre);
    } else {
      await supabase.from('config_peticiones').insert([conf]);
      console.log('Inserted:', conf.nombre);
    }
  }
}
run();
