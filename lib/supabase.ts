import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL environment variable.");
}
if (!supabaseServiceKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY environment variable.");
}

// Create Supabase client without specifying a custom schema (uses default public schema)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export interface Idea {
  id: string;
  created_at: string;
  title: string;
  date_label: string;
  content: string;
  sent_email: boolean;
  provider: string;
  model_label: string;
}