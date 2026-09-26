import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AttestationRecord {
  token: string;
  candidateHandle: string;
  candidateName: string;
  companyName: string;
  claimId: string;
  claimText: string;
  metricSummary?: string;
  attestorEmail: string;
  relationship?: "MANAGER" | "PEER" | "DIRECT_REPORT" | "STAKEHOLDER";
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
  cryptographicSignature?: string;
}

// Global in-memory token registry surviving hot-reloads
const globalVault = globalThis as unknown as {
  __VERIFIED_CV_VAULT__?: Record<string, any>;
  __VERIFIED_CV_ATTESTATIONS__?: Record<string, AttestationRecord>;
};

if (!globalVault.__VERIFIED_CV_ATTESTATIONS__) {
  globalVault.__VERIFIED_CV_ATTESTATIONS__ = {};
}

// POST: Generate attestation magic link token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateHandle, candidateName, companyName, claimId, claimText, metricSummary, attestorEmail } = body;

    if (!claimId || !attestorEmail) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (claimId, attestorEmail)." },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(16).toString("hex");
    const record: AttestationRecord = {
      token,
      candidateHandle: (candidateHandle || "gharris").toLowerCase(),
      candidateName: candidateName || "Graham Harris",
      companyName: companyName || "Company",
      claimId,
      claimText,
      metricSummary: metricSummary || "",
      attestorEmail: attestorEmail.toLowerCase().trim(),
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    globalVault.__VERIFIED_CV_ATTESTATIONS__![token] = record;

    const attestUrl = `/attest/${token}`;

    return NextResponse.json({
      success: true,
      token,
      attestUrl,
      message: "Attestation link created successfully.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create attestation token." },
      { status: 500 }
    );
  }
}

// GET: Retrieve attestation context by token
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token || !globalVault.__VERIFIED_CV_ATTESTATIONS__?.[token]) {
    return NextResponse.json({ success: false, error: "Invalid or expired attestation link." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: globalVault.__VERIFIED_CV_ATTESTATIONS__[token],
  });
}

// PUT: Attestor confirms or adds context to the claim
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, relationship, notes, attestorName } = body;

    const record = globalVault.__VERIFIED_CV_ATTESTATIONS__?.[token];
    if (!record) {
      return NextResponse.json({ success: false, error: "Invalid or expired token." }, { status: 404 });
    }

    if (record.status === "CONFIRMED") {
      return NextResponse.json({ success: true, message: "Milestone already verified.", alreadyConfirmed: true });
    }

    const confirmedAt = new Date().toISOString();
    const signaturePayload = `${record.token}:${record.claimId}:${record.attestorEmail}:${confirmedAt}`;
    const cryptographicSignature = "SIG_" + crypto.createHash("sha256").update(signaturePayload).digest("hex").slice(0, 16);

    record.status = "CONFIRMED";
    record.relationship = relationship || "PEER";
    record.notes = notes || "";
    record.confirmedAt = confirmedAt;
    record.cryptographicSignature = cryptographicSignature;

    // Immediately persist and upgrade the candidate's claim in the Vault
    if (globalVault.__VERIFIED_CV_VAULT__?.[record.candidateHandle]) {
      const candidateProfile = globalVault.__VERIFIED_CV_VAULT__[record.candidateHandle];
      
      if (candidateProfile.experiences) {
        candidateProfile.experiences = candidateProfile.experiences.map((exp: any) => ({
          ...exp,
          claims: (exp.claims || []).map((c: any) => {
            if (c.id === record.claimId) {
              return {
                ...c,
                status: "CORROBORATED",
                pith_fidelity_score: 95,
                corroboratorAttestation: {
                  attestorEmail: record.attestorEmail,
                  attestorName: attestorName || "Verified Colleague",
                  relationship: record.relationship,
                  confirmedAt,
                  signature: cryptographicSignature,
                },
              };
            }
            return c;
          }),
        }));
      }
    }

    return NextResponse.json({
      success: true,
      message: "Attestation confirmed and anchored to Vault.",
      signature: cryptographicSignature,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to confirm attestation." },
      { status: 500 }
    );
  }
}