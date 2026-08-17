import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('agentes')
    .select('*')
    .eq('id', '0115bf49-eb69-46f2-8501-23e3b422d8dc');
  console.log("Democrito:", data);
}

test();
