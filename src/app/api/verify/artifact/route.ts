import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const handle = searchParams.get("handle");

    if (!handle) {
      return NextResponse.json(
        { success: false, error: "Candidate handle is required." },
        { status: 400 }
      );
    }

    if (supabase) {
      const { data, error } = await supabase
        .from("artifacts")
        .select("*")
        .eq("candidate_handle", handle);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, artifacts: data || [] });
    }

    return NextResponse.json({ success: true, artifacts: [] });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { title, url, type, isPasswordProtected, handle } = body || {};

    if (!title || !handle) {
      return NextResponse.json(
        { success: false, error: "Title and handle are required." },
        { status: 400 }
      );
    }

    const artifactId = crypto.randomUUID();

    if (supabase) {
      await supabase.from("artifacts").insert({
        id: artifactId,
        candidate_handle: handle,
        title,
        url: url || "#",
        type: type || "OTHER",
        is_password_protected: Boolean(isPasswordProtected),
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      artifactId,
      title,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}