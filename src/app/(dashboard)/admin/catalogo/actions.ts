'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

export async function getCatalogo(filtroTipo: string) {
  let query = supabaseAdmin.from('bienes').select('*').order('created_at', { ascending: false }).limit(500);
  
  if (filtroTipo === 'servicio') {
    query = query.eq('tipo_bien', 'servicio');
  } else if (filtroTipo === 'insumo') {
    query = query.eq('tipo_bien', 'producto').eq('atributos_producto->>tipo_catalogo', 'insumo');
  } else if (filtroTipo === 'producto') {
    query = query.eq('tipo_bien', 'producto').eq('atributos_producto->>tipo_catalogo', 'retail');
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching catalogo:', error);
    throw new Error(error.message);
  }
  
  return data;
}
