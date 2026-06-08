import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  console.log('Deleting all categories from db...');
  const { data, error } = await supabase.from('categories').delete().neq('id', 'non-existent');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Deleted successfully', data);
  }
}

run();
