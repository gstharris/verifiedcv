import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";
import { getLinkedInSessionFromRequest } from "@/lib/linkedin";
import { getSupabase } from "@/lib/supabase";
import { getAppUrl } from "@/lib/appUrl";
import { companiesMatch, overlapCaption, overlapMonths } from "@/lib/tenureOverlap";
import { assessLinkedInIdentity, emailsMatch } from "@/lib/linkedinProfileGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function mapAttestation(row: Record<string, any>) {
  return {
    token: row.token,
    candidateHandle: row.candidate_handle,
    candidateName: row.candidate_name,
    experienceId: row.milestone_id,
    companyName: row.company_name,
    roleTitle: row.role_title,
    tenureDates: row.tenure_dates,
    claims: row.claims || [],
    attestorEmail: row.attestor_email,
    attestorName: row.attestor_name,
    attestorTitle: row.attestor_title,
    careerYears: row.career_years,
    relationship: row.relationship,
    isRoleMasked: row.is_role_masked,
    status: row.status,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
    notes: row.notes,
    endorsedClaimIds: row.endorsed_claim_ids || [],
    cryptographicSignature: row.cryptographic_signature
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Malformed JSON payload in request." }, { status: 400 });
    }

    const {
      candidateHandle,
      candidateName,
      experienceId,
      companyName,
      roleTitle = "Team Member",
      tenureDates = "Tenure Period",
      claims = [],
      attestorEmail
    } = body || {};

    if (!candidateHandle || !experienceId || !companyName || !attestorEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: candidateHandle, experienceId, companyName, and attestorEmail." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(16).toString("hex");
    const row = {
      token,
      candidate_handle: String(candidateHandle).toLowerCase().trim(),
      milestone_id: String(experienceId),
      candidate_name: String(candidateName || "").trim(),
      company_name: String(companyName).trim(),
      role_title: String(roleTitle).trim(),
      tenure_dates: String(tenureDates),
      claims: Array.isArray(claims)
        ? claims.map((c: any) => ({
            id: String(c.id || crypto.randomUUID()),
            raw_bullet: String(c.raw_bullet || ""),
            metric_summary: String(c.metric_summary || ""),
            category: String(c.category || "EXECUTION")
          }))
        : [],
      attestor_email: String(attestorEmail).toLowerCase().trim(),
      is_role_masked: true,
      status: "PENDING"
    };

    const { error } = await supabase.from("attestations").insert(row);
    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const attestUrl = `${getAppUrl()}/attest/${token}`;

    if (process.env.RESEND_API_KEY) {
      const { error: emailError } = await resend.emails.send({
        from: "VerifiedCV <verify@verifiedcv.app>",
        to: attestorEmail,
        subject: `${row.candidate_name || "A colleague"} is requesting peer verification for their time at ${row.company_name}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Peer Verification Request</h2>
            <p><strong>${row.candidate_name}</strong> asked you to corroborate their experience at <strong>${row.company_name}</strong>.</p>
            <div style="margin: 30px 0;">
              <a href="${attestUrl}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Review & Verify Claims</a>
            </div>
            <p style="color: #64748b; font-size: 12px;">If you did not work with them, ignore this email.</p>
          </div>
        `
      });
      if (emailError) {
        return NextResponse.json({ success: false, error: "Invitation saved, but the email could not be sent." }, { status: 502 });
      }
    } else {
      return NextResponse.json({ success: false, error: "Email delivery is not configured." }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      token,
      attestUrl,
      message: "Verification request sent."
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal server error." }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const token = new URL(req.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Invalid or expired verification token." }, { status: 404 });
    }

    const { data, error } = await supabase.from("attestations").select("*").eq("token", token).maybeSingle();
    if (error || !data) {
      return NextResponse.json({ success: false, error: "Invalid or expired verification token." }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: mapAttestation(data) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Server retrieval failure." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: "Database is not configured." }, { status: 500 });
    }

    const body = await req.json();
    const {
      token,
      relationship = "PEER",
      notes = "",
      attestorName = "",
      attestorTitle = "colleague",
      careerYears = 0,
      endorsedClaimIds = [],
      attestorPeriod = "",
      attestorCompany = ""
    } = body;

    const linkedInSession = getLinkedInSessionFromRequest(req);
    const linkedInGate = assessLinkedInIdentity(linkedInSession);
    if (!linkedInSession?.sub || !linkedInGate.ok) {
      return NextResponse.json(
        { success: false, error: linkedInGate.message || "LinkedIn authentication is required to verify." },
        { status: 400 }
      );
    }

    const { data: record, error: loadError } = await supabase
      .from("attestations")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (loadError || !record) {
      return NextResponse.json({ success: false, error: "Invalid or expired token." }, { status: 404 });
    }

    if (record.status === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        message: "This chapter is already confirmed.",
        alreadyConfirmed: true,
        signature: record.cryptographic_signature
      });
    }

    const candidateLookup = await supabase
      .from("candidates")
      .select("email, linkedin_sub")
      .eq("handle", record.candidate_handle)
      .maybeSingle();
    const candidate = candidateLookup.error ? null : candidateLookup.data;

    if (candidate?.linkedin_sub && candidate.linkedin_sub === linkedInSession.sub) {
      return NextResponse.json(
        { success: false, error: "You cannot confirm your own chapter with the same LinkedIn account." },
        { status: 400 }
      );
    }

    if (emailsMatch(candidate?.email, linkedInSession.email)) {
      return NextResponse.json(
        { success: false, error: "You cannot confirm your own chapter with the same email." },
        { status: 400 }
      );
    }

    const { data: alreadyUsed } = await supabase
      .from("attestations")
      .select("token")
      .eq("milestone_id", record.milestone_id)
      .eq("linkedin_sub", linkedInSession.sub)
      .eq("status", "CONFIRMED")
      .maybeSingle();

    if (alreadyUsed) {
      return NextResponse.json(
        { success: false, error: "This LinkedIn account has already confirmed this chapter." },
        { status: 400 }
      );
    }

    if (attestorCompany && !companiesMatch(String(attestorCompany), String(record.company_name))) {
      return NextResponse.json(
        { success: false, error: `Confirmation is only for overlapping time at ${record.company_name}.` },
        { status: 400 }
      );
    }

    const overlap = overlapMonths(String(record.tenure_dates || ""), String(attestorPeriod || ""));
    if (!overlap.ok) {
      return NextResponse.json(
        {
          success: false,
          error: overlap.label === "Could not read those dates."
            ? "Enter the month and year you started and left this company."
            : `Those dates do not overlap ${record.candidate_name || "this candidate"}'s time at ${record.company_name}.`
        },
        { status: 400 }
      );
    }

    const overlapNote = overlapCaption(String(attestorPeriod).trim(), overlap.months);

    const confirmedAt = new Date().toISOString();
    const cryptographicSignature =
      "SIG_CHAP_" +
      crypto
        .createHash("sha256")
        .update(`${record.token}:${record.milestone_id}:${record.attestor_email}:${confirmedAt}`)
        .digest("hex")
        .slice(0, 16);

    const { error: updateError } = await supabase
      .from("attestations")
      .update({
        status: "CONFIRMED",
        attestor_name: String(attestorName).trim() || linkedInSession.name || "Verified Colleague",
        attestor_title: String(attestorTitle).trim(),
        career_years: careerYears,
        relationship,
        is_role_masked: true,
        notes: [overlapNote, String(notes).trim()].filter(Boolean).join("\n"),
        endorsed_claim_ids: Array.isArray(endorsedClaimIds) ? endorsedClaimIds : [],
        confirmed_at: confirmedAt,
        cryptographic_signature: cryptographicSignature,
        linkedin_sub: linkedInSession.sub,
        linkedin_email: linkedInSession.email,
        linkedin_url: null
      })
      .eq("token", token);

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    const displayName = String(attestorTitle).trim() || "colleague";

    await supabase.from("verifications").insert({
      id: `ver-${Date.now()}`,
      milestone_id: record.milestone_id,
      name: displayName,
      role: overlapNote,
      email: record.attestor_email,
      linkedin_url: null,
      verified_at: confirmedAt
    });

    return NextResponse.json({
      success: true,
      message: "Chapter successfully corroborated.",
      signature: cryptographicSignature,
      isRoleMasked: true,
      endorsedClaimCount: Array.isArray(endorsedClaimIds) ? endorsedClaimIds.length : 0
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Failed to confirm chapter." }, { status: 500 });
  }
}
