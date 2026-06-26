const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Must use service role

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Total users:', users.length);
    const socrates = users.find(u => u.email === 'socrates@vaikuntha.com');
    if (socrates) {
      console.log('Found user:', socrates.email);
      console.log('Email confirmed at:', socrates.email_confirmed_at);
      console.log('Last sign in:', socrates.last_sign_in_at);
      console.log('User ID:', socrates.id);
    } else {
      console.log('User socrates@vaikuntha.com NOT FOUND');
    }
  }
}

main();
