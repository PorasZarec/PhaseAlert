import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// DEBUGGING: Check if these are actually loading
console.log("Supabase URL:", supabaseUrl); 
console.log("Supabase Key:", supabaseAnonKey ? "Exists (Hidden)" : "MISSING!!");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Key is missing! Check your .env.local file.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)