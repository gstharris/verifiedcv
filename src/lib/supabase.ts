import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
let cachedAdminClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-vault.supabase.co";
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "mock-anon-key-for-build";

  if (!url || !key) return null;

  try {
    cachedClient = createClient(url, key);
    return cachedClient;
  } catch (err) {
    console.warn("Lazy getSupabase client init suppressed:", err);
    return null;
  }
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedAdminClient) return cachedAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock-vault.supabase.co";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "mock-service-role-key-for-build";

  if (!url || !key) return null;

  try {
    cachedAdminClient = createClient(url, key);
    return cachedAdminClient;
  } catch (err) {
    console.warn("Lazy getSupabaseAdmin client init suppressed:", err);
    return null;
  }
}