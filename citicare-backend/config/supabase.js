const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

// Admin client with service role - bypasses RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

// Public client with anon key - subject to RLS
const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase, supabaseAdmin };
