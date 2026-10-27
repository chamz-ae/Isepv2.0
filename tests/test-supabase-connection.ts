import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yyfmjpgafedcbxbpxoeo.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Zm1qcGdhZmVkY2J4YnB4b2VvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NzYyNzksImV4cCI6MjEwNzU1MjI3OX0.OkxjAosxRNf5JXwZ7rQ91srPecq2E_Yd3kSjVNwKQCI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  console.log('Testing connection to Supabase...');
  try {
    const { data, error } = await supabase.from('menus').select('id, name, price').limit(5);
    if (error) {
      console.log('Response error (tables may not be migrated yet):', error.message, error.code);
    } else {
      console.log('Connection successful! Menus found:', data);
    }
  } catch (err: any) {
    console.error('Network / fetch error:', err.message);
  }
}

check();
