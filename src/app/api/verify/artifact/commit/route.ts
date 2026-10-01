import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const artifactId = String(body.artifactId || crypto.randomUUID());
    const milestoneId = String(body.milestoneId || "").trim();
    const name = String(body.name || body.title || "Employment document").trim();
    const type = String(body.type || body.artifactType || "W-2 / offer letter").trim();

    if (!milestoneId) {
      return NextResponse.json({ success: false, error: "milestoneId is required." }, { status: 400 });
    }

    if (supabase) {
      const { error: dbError } = await supabase.from("artifacts").upsert({
        id: artifactId,
        milestone_id: milestoneId,
        name,
        type
      });

      if (dbError) {
        return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      artifactId,
      status: "SAVED"
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error.";
    console.error("Artifact commit error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
