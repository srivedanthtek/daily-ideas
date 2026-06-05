import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase server client env vars missing, falling back to shared client.");
}

// Server-side client — prefers service role key for full read access, falls back to anon key
export const supabaseServer = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
