import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChapterClaimSummary {
  id: string;
  raw_bullet: string;
  metric_summary?: string;
  category?: string;
}

interface ChapterAttestationRecord {
  token: string;
  candidateHandle: string;
  candidateName: string;
  experienceId: string;
  companyName: string;
  roleTitle: string;
  tenureDates: string;
  claims: ChapterClaimSummary[];
  attestorEmail: string;
  attestorName?: string;
  attestorTitle?: string;
  careerYears?: number;
  relationship?: "MANAGER" | "PEER" | "DIRECT_REPORT" | "STAKEHOLDER";
  isRoleMasked: boolean;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
  endorsedClaimIds?: string[];
  cryptographicSignature?: string;
}

const globalVault = globalThis as unknown as {
  __VERIFIED_CV_VAULT__?: Record<string, any>;
  __VERIFIED_CV_CHAPTER_ATTESTATIONS__?: Record<string, ChapterAttestationRecord>;
};

if (!globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__) {
  globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__ = {};
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload in request." },
        { status: 400 }
      );
    }

    const {
      candidateHandle = "gharris",
      candidateName = "Graham Harris",
      experienceId,
      companyName,
      roleTitle = "Team Member",
      tenureDates = "Tenure Period",
      claims = [],
      attestorEmail,
    } = body || {};

    if (!experienceId || !companyName || !attestorEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: experienceId, companyName, and attestorEmail are mandatory." 
        },
        { status: 400 }
      );
    }

    const token = body.token || crypto.randomBytes(16).toString("hex");
    const record: ChapterAttestationRecord = {
      token,
      candidateHandle: String(candidateHandle).toLowerCase().trim(),
      candidateName: String(candidateName).trim(),
      experienceId: String(experienceId),
      companyName: String(companyName).trim(),
      roleTitle: String(roleTitle).trim(),
      tenureDates: String(tenureDates),
      claims: Array.isArray(claims)
        ? claims.map((c: any) => ({
            id: String(c.id || crypto.randomUUID()),
            raw_bullet: String(c.raw_bullet || ""),
            metric_summary: String(c.metric_summary || ""),
            category: String(c.category || "EXECUTION"),
          }))
        : [],
      attestorEmail: String(attestorEmail).toLowerCase().trim(),
      isRoleMasked: true,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__![token] = record;

    return NextResponse.json({
      success: true,
      token,
      attestUrl: `/attest/${token}`,
      message: "Chapter attestation token anchored.",
    });
  } catch (error: any) {
    console.error("Attestation POST route error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token." },
        { status: 404 }
      );
    }

    // Handle dev mode mock tokens
    if (token.startsWith("mock-token-") && !globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__?.[token]) {
      globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__![token] = {
        token,
        candidateHandle: "gharris",
        candidateName: "Graham Harris",
        experienceId: "mock-exp-1",
        companyName: "Acme Corp",
        roleTitle: "Product Manager",
        tenureDates: "2020 - Present",
        claims: [
          { id: "c1", raw_bullet: "Led development of core platform features." },
          { id: "c2", raw_bullet: "Increased user engagement by 25%." }
        ],
        attestorEmail: "peer@example.com",
        isRoleMasked: true,
        status: "PENDING",
        createdAt: new Date().toISOString()
      };
    }

    if (!globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__?.[token]) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired verification token." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__[token],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Server retrieval failure." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      token,
      relationship = "PEER",
      notes = "",
      attestorName = "",
      attestorTitle = "Leader",
      careerYears = 15,
      isRoleMasked = true,
      endorsedClaimIds = [],
      linkedInProfile,
    } = body;

    if (!linkedInProfile) {
      return NextResponse.json({ success: false, error: "LinkedIn authentication is required to verify." }, { status: 400 });
    }

    if (linkedInProfile.accountAgeYears < 1) {
      return NextResponse.json({ success: false, error: "LinkedIn profile is too new to provide a valid verification. Minimum account age is 1 year." }, { status: 403 });
    }

    const record = globalVault.__VERIFIED_CV_CHAPTER_ATTESTATIONS__?.[token];
    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired token." }, { status: 404 });
    }

    if (record.status === "CONFIRMED") {
      return NextResponse.json({
        success: true,
        message: "Chapter milestone already corroborated.",
        alreadyConfirmed: true,
        signature: record.cryptographicSignature,
      });
    }

    const confirmedAt = new Date().toISOString();
    const signaturePayload = `${record.token}:${record.experienceId}:${record.attestorEmail}:${confirmedAt}`;
    const cryptographicSignature =
      "SIG_CHAP_" + crypto.createHash("sha256").update(signaturePayload).digest("hex").slice(0, 16);

    let baseChapterScore = 90;
    if (careerYears >= 15) baseChapterScore = 95;
    if (relationship === "MANAGER") baseChapterScore = 98;

    record.status = "CONFIRMED";
    record.attestorName = attestorName.trim() || "Verified Colleague";
    record.attestorTitle = attestorTitle.trim();
    record.careerYears = careerYears;
    record.relationship = relationship;
    record.isRoleMasked = isRoleMasked;
    record.notes = notes.trim();
    record.endorsedClaimIds = Array.isArray(endorsedClaimIds) ? endorsedClaimIds : [];
    record.confirmedAt = confirmedAt;
    record.cryptographicSignature = cryptographicSignature;
    (record as any).linkedInUrl = linkedInProfile.url;

    if (globalVault.__VERIFIED_CV_VAULT__?.[record.candidateHandle]) {
      const candidateProfile = globalVault.__VERIFIED_CV_VAULT__[record.candidateHandle];

      if (candidateProfile.experiences) {
        candidateProfile.experiences = candidateProfile.experiences.map((exp: any) => {
          if (exp.id === record.experienceId) {
            const updatedClaims = (exp.claims || []).map((c: any) => {
              const isDirectlyVouched = record.endorsedClaimIds?.includes(c.id);

              if (isDirectlyVouched) {
                return {
                  ...c,
                  status: "CORROBORATED",
                  pith_fidelity_score: Math.min(100, baseChapterScore + 2),
                  vouchedBy: {
                    displayName: isRoleMasked
                      ? `Former ${record.attestorTitle} @ ${record.companyName}`
                      : `${record.attestorName} (${record.attestorTitle})`,
                    relationship: record.relationship,
                    confirmedAt,
                    signature: cryptographicSignature,
                    linkedInUrl: linkedInProfile.url,
                  },
                };
              }

              return {
                ...c,
                status: c.status === "CORROBORATED" ? "CORROBORATED" : "CHAPTER_ANCHORED",
                pith_fidelity_score: Math.max(c.pith_fidelity_score || 72, 85),
              };
            });

            return {
              ...exp,
              affiliation_verified: true,
              chapterCorroboration: {
                displayName: isRoleMasked
                  ? `Former ${record.attestorTitle} @ ${record.companyName}`
                  : `${record.attestorName} (${record.attestorTitle})`,
                careerDepth: `${careerYears}+ Years Professional Experience`,
                relationship: record.relationship,
                isRoleMasked,
                confirmedAt,
                notes: record.notes,
                signature: cryptographicSignature,
                linkedInUrl: linkedInProfile.url,
                endorsedClaimCount: record.endorsedClaimIds?.length || 0,
                totalClaimCount: exp.claims?.length || 0,
              },
              claims: updatedClaims,
            };
          }
          return exp;
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Chapter successfully corroborated.",
      signature: cryptographicSignature,
      isRoleMasked,
      endorsedClaimCount: record.endorsedClaimIds?.length || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to confirm chapter." },
      { status: 500 }
    );
  }
}