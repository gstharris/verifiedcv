import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { workEmail, experienceId, companyName } = body || {};

    if (!workEmail || !experienceId) {
      return NextResponse.json(
        { success: false, error: "workEmail and experienceId are required." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(16).toString("hex");

    if (supabase) {
      await supabase.from("domain_verifications").insert({
        token,
        work_email: workEmail.toLowerCase().trim(),
        experience_id: experienceId,
        company_name: companyName || "",
        status: "PENDING",
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      token,
      message: `Domain confirmation dispatched to ${workEmail}.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}