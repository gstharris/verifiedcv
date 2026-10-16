import { createClient, SupabaseClient } from "@supabase/supabase-js";

export function getServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && key === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
