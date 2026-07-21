import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

// Use service key for backend operations (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseKey);

// For operations that need to respect RLS
export const supabaseClient = createClient(supabaseUrl, process.env.SUPABASE_KEY);