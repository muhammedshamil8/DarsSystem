'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function createUserAccount(name: string, email: string, password: string, role: 'teacher' | 'admin' = 'teacher') {
  // 1. Create the Auth User
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Update the Profile
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert({
      id: userData.user.id,
      name,
      email,
      role
    });

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true };
}

// Deprecated, use createUserAccount
export async function createTeacher(email: string, password: string, name: string) {
  return createUserAccount(name, email, password, 'teacher');
}

export async function getProfilesByRole(role: 'teacher' | 'admin') {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('role', role);

  if (error) return { error: error.message };
  return { data };
}
