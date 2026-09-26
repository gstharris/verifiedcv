import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request payload." },
        { status: 400 }
      );
    }

    const { artifactId, candidateHandle, documentHash, title, type } = body || {};

    if (!artifactId || !candidateHandle || !documentHash) {
      return NextResponse.json(
        { success: false, error: "artifactId, candidateHandle, and documentHash are required." },
        { status: 400 }
      );
    }

    if (supabase) {
      const { error: dbError } = await supabase.from("artifacts").upsert({
        id: artifactId,
        candidate_handle: candidateHandle,
        document_hash: documentHash,
        title: title || "Work Artifact",
        type: type || "DECK",
        verified_at: new Date().toISOString(),
      });

      if (dbError) {
        console.warn("Supabase artifact upsert warning:", dbError.message);
      }
    }

    return NextResponse.json({
      success: true,
      documentHash,
      status: "ANCHORED",
    });
  } catch (error: any) {
    console.error("Artifact commit error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}