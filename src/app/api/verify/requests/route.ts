import { NextRequest, NextResponse } from "next/server";
import { supabase as rawSupabase } from "@/lib/supabase";
import { createClient } from "@/lib/supabase/server";
import { markPrivateNoStore } from "@/lib/httpCache";
import { corroborationRequestsForChapter } from "@/lib/corroborationRequests";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const respond = (body: unknown, status = 200) => markPrivateNoStore(NextResponse.json(body, { status }));

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return respond({ success: false, error: "Sign in first." }, 401);

    const byUser = await rawSupabase.from("candidates").select("handle").eq("auth_user_id", user.id).maybeSingle();
    const byEmail =
      byUser.data?.handle || !user.email
        ? null
        : await rawSupabase.from("candidates").select("handle").ilike("email", user.email).maybeSingle();
    const handle = String(byUser.data?.handle || byEmail?.data?.handle || "").toLowerCase().trim();
    const milestoneId = new URL(req.url).searchParams.get("milestoneId") || "";
    if (!handle || !milestoneId) return respond({ success: true, requests: [] });

    const { data, error } = await rawSupabase
      .from("attestations")
      .select("milestone_id, attestor_email, status, created_at")
      .eq("candidate_handle", handle)
      .eq("milestone_id", milestoneId);

    if (error) return respond({ success: false, error: "Could not load colleague requests." }, 500);

    return respond({ success: true, requests: corroborationRequestsForChapter(data || [], milestoneId) });
  } catch {
    return respond({ success: false, error: "Could not load colleague requests." }, 500);
  }
}
