import { NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { markPrivateNoStore } from "@/lib/httpCache";

export async function requireDraftAccess(): Promise<
  | { ok: true; user: User; admin: SupabaseClient }
  | { ok: false; response: NextResponse }
> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ok: false,
      response: markPrivateNoStore(NextResponse.json({ error: "Draft storage is not configured." }, { status: 503 }))
    };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: markPrivateNoStore(NextResponse.json({ error: "Sign in first." }, { status: 401 }))
    };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return {
      ok: false,
      response: markPrivateNoStore(NextResponse.json({ error: "Draft storage is not configured." }, { status: 503 }))
    };
  }

  return { ok: true, user, admin };
}

const CANDIDATE_OWNER_COLUMNS =
  "handle, auth_user_id, email, phone, linkedin, email_verified, phone_verified, linkedin_verified, linkedin_sub";

export type OwnedCandidate = {
  handle: string;
  auth_user_id: string | null;
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
  linkedin_verified: boolean | null;
  linkedin_sub: string | null;
};

export async function findCandidateForUser(
  admin: SupabaseClient,
  user: { id: string; email?: string | null }
): Promise<{ candidate: OwnedCandidate | null } | { error: string } | { conflict: true }> {
  const byUser = await admin.from("candidates").select(CANDIDATE_OWNER_COLUMNS).eq("auth_user_id", user.id).maybeSingle();
  if (byUser.error) return { error: byUser.error.message };
  if (byUser.data?.handle) return { candidate: byUser.data as OwnedCandidate };

  const email = String(user.email || "").trim();
  if (!email) return { candidate: null };

  const byEmail = await admin.from("candidates").select(CANDIDATE_OWNER_COLUMNS).ilike("email", email).maybeSingle();
  if (byEmail.error) return { error: byEmail.error.message };
  if (!byEmail.data?.handle) return { candidate: null };
  if (byEmail.data.auth_user_id && byEmail.data.auth_user_id !== user.id) return { conflict: true };
  return { candidate: byEmail.data as OwnedCandidate };
}
