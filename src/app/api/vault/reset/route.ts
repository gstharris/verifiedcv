import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { requireHandleOwner } from "@/lib/handleOwner";
import { clearLinkedInSessionCookie } from "@/lib/linkedin";
import { BETA_COOKIE, isBetaEnforced } from "@/lib/betaAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = String(body.handle || "").toLowerCase().trim();
  const owner = await requireHandleOwner(req, supabase, handle);
  if (!owner.ok) {
    return NextResponse.json({ error: owner.error }, { status: owner.status });
  }

  const { data: candidate } = await supabase.from("candidates").select("email").eq("handle", handle).maybeSingle();

  const { error: flagError } = await supabase
    .from("candidates")
    .update({
      email_verified: false,
      phone_verified: false,
      linkedin_verified: false
    })
    .eq("handle", handle);

  if (flagError) {
    return NextResponse.json({ error: flagError.message || "Could not reset verification." }, { status: 500 });
  }

  const { data: milestones } = await supabase.from("milestones").select("id").eq("candidate_handle", handle);
  const milestoneIds = (milestones || []).map((row) => row.id);
  if (milestoneIds.length > 0) {
    await supabase.from("artifacts").delete().in("milestone_id", milestoneIds);
    await supabase.from("verifications").delete().in("milestone_id", milestoneIds);
  }
  await supabase.from("attestations").delete().eq("candidate_handle", handle);

  if (candidate?.email) {
    await supabase.from("email_codes").delete().eq("email", String(candidate.email).toLowerCase().trim());
  }

  const response = NextResponse.json({ success: true, handle });
  clearLinkedInSessionCookie(response);
  return response;
}
