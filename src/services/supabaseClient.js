import { createClient } from '@supabase/supabase-js';

// Ambil variabel dari .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validasi agar tidak error jika .env lupa diisi
if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Supabase URL atau Key belum diset di file .env!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);