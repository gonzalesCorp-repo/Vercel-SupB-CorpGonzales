const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    'f48a6a30-4269-4253-a82a-bed52c4b1a16',
    { password: 'temporal123' }
  );
  
  if (error) {
    console.error('Error updating user password:', error);
  } else {
    console.log('Password successfully reset to: temporal123');
  }
}

main();
