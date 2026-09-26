"use client";

import { useEffect, useState, use } from "react";
import { 
  ShieldCheck, 
  Building2, 
  ExternalLink, 
  CheckCircle2, 
  GraduationCap, 
  Award, 
  Loader2, 
  Mail, 
  MapPin, 
  Phone, 
  Link2, 
  FileText, 
  Lock, 
  Info, 
  Users, 
  Fingerprint, 
  X,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Circle,
  Sparkles
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
    </svg>
  );
}

interface EvidenceProof {
  title: string;
  sourceType: "ENTERPRISE_DOMAIN" | "PEER_ATTESTATION" | "REGISTRY_URL" | "OAUTH_UID";
  details: string;
  timestamp: string;
  hash: string;
}

export default function CandidateDossier({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = use(params);
  const handle = resolvedParams.handle || "gharris";

  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [activeProof, setActiveProof] = useState<EvidenceProof | null>(null);
  const [demoMode, setDemoMode] = useState<"CERTIFIED" | "RAW">("CERTIFIED");

  useEffect(() => {
    async function fetchDossier() {
      try {
        const res = await fetch(`/api/vault?handle=${handle}&_t=${Date.now()}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data) {
          setDossier(json.data);
        }
      } catch (e) {
        console.error("Failed to load Vault dossier", e);
      } finally {
        setLoading(false);
      }
    }
    fetchDossier();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Decrypting Vault Trust Record...</span>
        </div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <VerifiedCVLogo className="w-10 h-10 mb-4" />
        <h1 className="text-xl font-black text-slate-900">Dossier Not Yet Published</h1>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          The candidate record for @{handle} has not been published to the Vault yet.
        </p>
        <a
          href="/"
          className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl hover:bg-emerald-100 transition-colors"
        >
          Open Candidate Studio
        </a>
      </div>
    );
  }

  const { 
    candidateName, 
    headline, 
    summary, 
    contact = {}, 
    artifacts = [], 
    experiences = [], 
    education = [], 
    certifications = [], 
    skills = [] 
  } = dossier;

  // Filtered views based on Demo Mode (Certified vs. Raw Ingestion)
  const isRaw = demoMode === "RAW";

  const activeContact = {
    linkedinUrl: contact.linkedinUrl || "linkedin.com/in/gharris",
    linkedinVerified: isRaw ? false : (contact.linkedinVerified ?? true),
    email: contact.email || "graham@example.com",
    emailVerified: isRaw ? false : (contact.emailVerified ?? true),
    location: contact.location || "Agoura Hills, CA",
    phone: contact.phone || "(818) 555-0194",
    phoneVerified: isRaw ? false : (contact.phoneVerified ?? false),
  };

  const processedExperiences = experiences.map((exp: any, idx: number) => ({
    ...exp,
    affiliation_verified: isRaw ? false : exp.affiliation_verified,
    claims: (exp.claims || []).map((c: any) => ({
      ...c,
      isVerified: isRaw ? false : (c.pith_fidelity_score >= 85 || c.status === "CORROBORATED"),
    })),
  }));

  const verifiedTenuresCount = isRaw ? 0 : processedExperiences.filter((e: any) => e.affiliation_verified).length;
  const verifiedClaimsCount = isRaw 
    ? 0 
    : processedExperiences.reduce((acc: number, exp: any) => acc + exp.claims.filter((c: any) => c.isVerified).length, 0);

  const trustScore = isRaw ? 15 : 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-24">
      
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <VerifiedCVLogo />
          <span className="font-black text-xl tracking-tight text-slate-950">VerifiedCV</span>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            Candidate Trust Dossier
          </span>
        </div>

        {/* Demo Controller & Studio Navigation */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
            <button
              onClick={() => setDemoMode("RAW")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                isRaw ? "bg-white text-slate-950 shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Demo: Raw Ingestion
            </button>
            <button
              onClick={() => setDemoMode("CERTIFIED")}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !isRaw ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Demo: Fully Certified
            </button>
          </div>

          <a
            href={`/?handle=${handle}`}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl transition-colors shadow-2xs"
          >
            Edit in Studio
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-6 sm:p-10 space-y-6">
        
        {/* UNIFIED EXECUTIVE TRUST CARD (Collapsed by default, Expandable Ledger) */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden transition-all">
          <div className="p-6 sm:p-8 space-y-5">
            
            {/* Header: Candidate Identity + Compact Pre-Cleared Status Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                    {candidateName}
                  </h1>
                  {isRaw ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      <Circle className="w-3 h-3 text-slate-400" />
                      Self-Reported
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Pre-Cleared Candidate
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-700">{headline}</p>
              </div>

              {/* Compact Pre-Cleared Trust Pill */}
              <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  <ShieldCheck className={`w-4 h-4 ${isRaw ? "text-slate-400" : "text-emerald-600"}`} />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-950">
                    {isRaw ? "15% Base Fidelity" : "100% Pre-Cleared"}
                  </span>
                </div>
                
                {/* 4-Segment Visual Meter */}
                <div className="flex items-center gap-1">
                  <div className={`h-1.5 w-6 rounded-full ${!isRaw ? "bg-emerald-500" : "bg-emerald-500"}`} title="Identity" />
                  <div className={`h-1.5 w-6 rounded-full ${!isRaw ? "bg-emerald-500" : "bg-slate-200"}`} title="Tenure" />
                  <div className={`h-1.5 w-6 rounded-full ${!isRaw ? "bg-emerald-500" : "bg-slate-200"}`} title="Claims" />
                  <div className={`h-1.5 w-6 rounded-full ${!isRaw ? "bg-emerald-500" : "bg-slate-200"}`} title="Artifacts" />
                </div>
              </div>
            </div>

            {/* Recruiter Contact Bar */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs pt-1 border-t border-slate-100">
              {activeContact.linkedinUrl && (
                <a
                  href={activeContact.linkedinUrl.startsWith("http") ? activeContact.linkedinUrl : `https://${activeContact.linkedinUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 transition-colors"
                >
                  <LinkedinIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span className="font-semibold">{activeContact.linkedinUrl.replace(/^https?:\/\//, "")}</span>
                  {activeContact.linkedinVerified && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" title="OAuth Confirmed" />
                  )}
                </a>
              )}

              {activeContact.email && (
                <a
                  href={`mailto:${activeContact.email}`}
                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-semibold">{activeContact.email}</span>
                  {activeContact.emailVerified && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" title="Corporate Domain Confirmed" />
                  )}
                </a>
              )}

              {activeContact.location && (
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeContact.location}</span>
                </span>
              )}

              {activeContact.phone && (
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{activeContact.phone}</span>
                  {activeContact.phoneVerified && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" title="Carrier Match" />
                  )}
                </span>
              )}
            </div>

            <p className="text-sm text-slate-700 leading-relaxed font-normal">{summary}</p>
          </div>

          {/* Expandable Verification Ledger Toggle */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 sm:px-8 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                {isRaw
                  ? "Awaiting upfront proofs: 0/4 milestones corroborated"
                  : "Cryptographic Evidence: Identity, 2 Tenures, and Metric Claims anchored"}
              </span>
            </div>

            <button
              onClick={() => setIsLedgerExpanded(!isLedgerExpanded)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 hover:text-emerald-700 cursor-pointer transition-colors"
            >
              <span>{isLedgerExpanded ? "Collapse Ledger" : "Inspect Verification Ledger"}</span>
              {isLedgerExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Expanded Drawer: 4 Forensic Proof Pillars */}
          {isLedgerExpanded && (
            <div className="p-6 sm:p-8 border-t border-slate-200 bg-white space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Forensic Verification Ledger (Vault Record: VCV-2026-GH928)
                </span>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Recruiter Pre-Clearance
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* 1. Identity */}
                <button
                  onClick={() =>
                    setActiveProof({
                      title: "Identity & Carrier Confirmation",
                      sourceType: "OAUTH_UID",
                      details: isRaw 
                        ? "Self-reported contact details. OAuth UID match pending."
                        : "LinkedIn OAuth UID match + SMS carrier SIM ownership confirmation.",
                      timestamp: isRaw ? "Pending Verification" : "Verified Sep 2026",
                      hash: isRaw ? "UNANCHORED" : "SHA256: 8f9b...a12c",
                    })
                  }
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <Fingerprint className="w-4 h-4 text-slate-700" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      activeContact.linkedinVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {activeContact.linkedinVerified ? "Verified" : "Pending"}
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block">Identity Proof</span>
                    <span className="text-[10px] text-slate-500">OAuth & Carrier</span>
                  </div>
                </button>

                {/* 2. Employer Tenures */}
                <button
                  onClick={() =>
                    setActiveProof({
                      title: "Enterprise Domain Anchors",
                      sourceType: "ENTERPRISE_DOMAIN",
                      details: isRaw
                        ? "Tenures self-reported from resume text. No work email domain token active."
                        : "Tenure authenticated via historical corporate SSO tokens & DNS mailbox routing (@yahoo-inc.com).",
                      timestamp: isRaw ? "Pending Domain Match" : "Deterministic Verification",
                      hash: isRaw ? "UNANCHORED" : "DNS-MX: @yahoo-inc.com, @geon.social",
                    })
                  }
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verifiedTenuresCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {verifiedTenuresCount} Confirmed
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block">Employer Tenures</span>
                    <span className="text-[10px] text-slate-500">Domain Verification</span>
                  </div>
                </button>

                {/* 3. Proof Metrics */}
                <button
                  onClick={() =>
                    setActiveProof({
                      title: "Atomic Claim Corroboration",
                      sourceType: "PEER_ATTESTATION",
                      details: isRaw
                        ? "Accomplishments extracted from raw bullets. Awaiting peer attestation."
                        : "Accomplishment metrics corroborated by verified colleagues with overlapping tenures.",
                      timestamp: isRaw ? "Unattested" : "Audited Ledger",
                      hash: isRaw ? "UNANCHORED" : "ATTEST-ID: #GH-METRIC-400M",
                    })
                  }
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <CheckCircle2 className="w-4 h-4 text-slate-700" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      verifiedClaimsCount > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {verifiedClaimsCount} Attested
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block">Proof Metrics</span>
                    <span className="text-[10px] text-slate-500">Peer Corroborated</span>
                  </div>
                </button>

                {/* 4. Work Artifacts */}
                <button
                  onClick={() =>
                    setActiveProof({
                      title: "Primary Source Work Artifacts",
                      sourceType: "REGISTRY_URL",
                      details: artifacts.length > 0
                        ? `${artifacts.length} external registries or presentations attached.`
                        : "No external patent or registry artifacts attached.",
                      timestamp: "Public Records",
                      hash: artifacts.length > 0 ? "SHA256-PROOF: 4e2c...9d01" : "NONE",
                    })
                  }
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <FileCheck className="w-4 h-4 text-slate-700" />
                    <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      artifacts.length > 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"
                    }`}>
                      {artifacts.length} Artifacts
                    </span>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs font-bold text-slate-900 block">Artifact Seals</span>
                    <span className="text-[10px] text-slate-500">Registry & Docs</span>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Experience Chapters */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" />
              Career Chapters & Accomplishments ({processedExperiences.length})
            </h2>
            <span className="text-xs font-medium text-slate-500">
              {isRaw ? "Raw Extracted State" : "Anchored to Verified Tenures"}
            </span>
          </div>

          {processedExperiences.map((exp: any) => (
            <div key={exp.id} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-base text-slate-950">{exp.title}</h3>
                  <div className="text-xs font-bold text-slate-700 mt-0.5 flex items-center gap-2">
                    <span>{exp.company_name}</span>
                    {exp.affiliation_verified ? (
                      <button
                        onClick={() =>
                          setActiveProof({
                            title: `${exp.company_name} Employment Verification`,
                            sourceType: "ENTERPRISE_DOMAIN",
                            details: `Affiliation confirmed through enterprise email domain and tenure records for ${exp.start_date || "Start"} to ${exp.end_date || "Present"}.`,
                            timestamp: "Verified Domain Authority",
                            hash: `EMP-VAULT-${exp.id.slice(0, 8)}`,
                          })
                        }
                        className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded cursor-pointer hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Employer Verified
                      </button>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded">
                        Self-Reported
                      </span>
                    )}
                  </div>
                </div>

                <span className="text-xs font-bold text-slate-600 font-mono bg-white border border-slate-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                  {exp.start_date} — {exp.end_date || "Present"}
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                {exp.claims?.map((claim: any) => (
                  <div key={claim.id} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                        {claim.category}
                      </span>

                      {claim.isVerified ? (
                        <button
                          onClick={() =>
                            setActiveProof({
                              title: "Metric Claim Corroboration",
                              sourceType: "PEER_ATTESTATION",
                              details: `Claim: "${claim.raw_bullet}". Corroborated with high fidelity (${claim.pith_fidelity_score}%) by verified colleagues.`,
                              timestamp: "Attested by Team Lead",
                              hash: `CORROB-SIG-${claim.id.slice(0, 8)}`,
                            })
                          }
                          className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Milestone</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-400">
                          Self-Reported Bullet
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed font-normal">
                      {claim.raw_bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Education & Credentials */}
        {(education.length > 0 || certifications.length > 0) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-700" />
              Credentials & Accreditations
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {education.map((edu: any) => (
                <div key={edu.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{edu.institution}</span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">{edu.graduation_year}</span>
                  </div>
                  <p className="text-xs text-slate-600">{edu.degree}</p>
                </div>
              ))}

              {certifications.map((cert: any) => (
                <div key={cert.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-600" />
                      {cert.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{cert.issuing_organization}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills & Competencies */}
        {skills.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
              Proficiencies & Core Competencies
            </h3>
            <div className="flex flex-wrap gap-2">
              {skills.map((s: any, idx: number) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 border border-slate-200"
                >
                  {s.name}
                  {!isRaw && s.corroborated && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Portfolio Artifacts */}
        {artifacts.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Portfolio Artifacts & Publications ({artifacts.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {artifacts.map((art: any) => (
                <a
                  key={art.id}
                  href={art.url.startsWith("http") ? art.url : `https://${art.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-emerald-50/30 hover:border-emerald-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 group-hover:border-emerald-300 transition-colors">
                      <Link2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 block truncate group-hover:text-emerald-950">
                          {art.title}
                        </span>
                        {art.isPasswordProtected && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold">
                            <Lock className="w-2.5 h-2.5" /> Protected
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {art.fileName ? `Document: ${art.fileName}` : art.url}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0 ml-2" />
                </a>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Proof Evidence Ledger Modal */}
      {activeProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-950">Proof Evidence Ledger</h3>
              </div>
              <button
                onClick={() => setActiveProof(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block text-sm">{activeProof.title}</span>
                <span className="text-[11px] text-emerald-700 font-semibold">{activeProof.timestamp}</span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Verification Details</span>
                <p className="text-slate-800 leading-relaxed font-normal">{activeProof.details}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Cryptographic Reference</span>
                <p className="text-emerald-400 truncate">{activeProof.hash}</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                <strong>Why Recruiters Can Trust This:</strong> VerifiedCV authenticates this record directly against enterprise email records or third-party registries. The candidate cannot modify or forge this attestation once recorded.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveProof(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}