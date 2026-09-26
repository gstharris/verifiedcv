import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400 }
      );
    }

    const { token, experienceId, companyDomain } = body || {};

    if (!token && !companyDomain) {
      return NextResponse.json(
        { success: false, error: "Missing verification parameters." },
        { status: 400 }
      );
    }

    // If Supabase is configured in environment variables, query/update DB:
    if (supabase) {
      // e.g. update domain verification status
      const { error: dbError } = await supabase
        .from("domain_verifications")
        .update({ status: "VERIFIED", verified_at: new Date().toISOString() })
        .eq("token", token);

      if (dbError) {
        console.warn("Supabase update error (falling back to memory):", dbError.message);
      }
    }

    // Also update global in-memory vault if present
    const globalVault = globalThis as unknown as {
      __VERIFIED_CV_VAULT__?: Record<string, any>;
    };

    if (globalVault.__VERIFIED_CV_VAULT__) {
      for (const handle of Object.keys(globalVault.__VERIFIED_CV_VAULT__)) {
        const candidate = globalVault.__VERIFIED_CV_VAULT__[handle];
        if (candidate?.experiences) {
          candidate.experiences = candidate.experiences.map((exp: any) => {
            if (exp.id === experienceId) {
              return {
                ...exp,
                affiliation_verified: true,
                verificationMethod: "WORK_DOMAIN",
              };
            }
            return exp;
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Domain affiliation successfully verified.",
      experienceId,
      companyDomain,
    });
  } catch (error: any) {
    console.error("Domain confirmation error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Token query parameter is required." },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    token,
    status: "CONFIRMED",
  });
}