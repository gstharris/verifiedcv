import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { artifactId, candidateHandle, documentHash, title, type } = body || {};

    if (!artifactId || !candidateHandle || !documentHash) {
      return NextResponse.json(
        { success: false, error: "artifactId, candidateHandle, and documentHash are required." },
        { status: 400 }
      );
    }

    if (supabase) {
      await supabase.from("artifacts").upsert({
        id: artifactId,
        candidate_handle: candidateHandle,
        document_hash: documentHash,
        title: title || "Work Artifact",
        type: type || "DECK",
        verified_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      documentHash,
      status: "ANCHORED",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}