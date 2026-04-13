const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// 1. Manually load .env if it exists
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function createAdmin() {
  console.log('\n--- DarsPro Admin Account Creator ---');
  
  rl.question('Enter Admin Email: ', async (email) => {
    rl.question('Enter Admin Password: ', async (password) => {
      rl.question('Enter Admin Full Name: ', async (name) => {
        
        console.log('\nCreating account...');
        
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (authError) {
          console.error('Auth Error:', authError.message);
          rl.close();
          return;
        }

        const userId = authData.user.id;

        // 2. Update Profile to Admin
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email,
            name,
            role: 'admin'
          });

        if (profileError) {
          console.error('Profile Update Error:', profileError.message);
        } else {
          console.log('\n✅ Success! Admin account created for:', email);
          console.log('You can now log in to the dashboard.');
        }

        rl.close();
      });
    });
  });
}

createAdmin();
