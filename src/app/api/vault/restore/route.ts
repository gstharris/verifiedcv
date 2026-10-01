import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { applyHandleOwnerCookie, createOwnerToken, emailsMatch, hashOwnerToken } from "@/lib/handleOwner";
import { issueRestoreCode } from "@/lib/handleRestore";
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
  const email = String(body.email || "").toLowerCase().trim();

  if (!handle || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Handle and the email on the account are required." }, { status: 400 });
  }

  const { data: candidate, error } = await supabase
    .from("candidates")
    .select("handle, email")
    .eq("handle", handle)
    .maybeSingle();

  if (error || !candidate?.handle) {
    return NextResponse.json({ error: "No portfolio exists for that handle." }, { status: 404 });
  }

  if (!emailsMatch(candidate.email, email)) {
    return NextResponse.json({ error: "That email is not on this handle." }, { status: 400 });
  }

  const issued = await issueRestoreCode(supabase, handle, email);
  if (!issued.ok) {
    return NextResponse.json({ error: issued.error || "Could not send a restore code." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest) {
  if (isBetaEnforced() && req.cookies.get(BETA_COOKIE)?.value !== "ok") {
    return NextResponse.json({ error: "Private beta. Studio access is required." }, { status: 401 });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "Database is not configured." }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const handle = String(body.handle || "").toLowerCase().trim();
  const email = String(body.email || "").toLowerCase().trim();
  const code = String(body.code || "").trim();

  if (!handle || !email || !code) {
    return NextResponse.json({ error: "Handle, email, and code are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("owner_codes")
    .select("*")
    .eq("handle", handle)
    .eq("email", email)
    .eq("code", code)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "That code is incorrect." }, { status: 400 });
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "That code has expired. Request a new one." }, { status: 400 });
  }

  const token = createOwnerToken();
  const { error: updateError } = await supabase
    .from("candidates")
    .update({ owner_token_hash: hashOwnerToken(token) })
    .eq("handle", handle);

  if (updateError) {
    return NextResponse.json({ error: updateError.message || "Could not restore this handle." }, { status: 500 });
  }

  await supabase.from("owner_codes").delete().eq("handle", handle);

  const response = NextResponse.json({ success: true, handle });
  applyHandleOwnerCookie(response, { handle, token });
  return response;
}
