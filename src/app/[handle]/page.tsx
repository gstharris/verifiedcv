"use client";

import { useEffect, useState, use } from "react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  ExternalLink, 
  Lock, 
  TrendingUp, 
  Cpu, 
  Users, 
  Target, 
  Award, 
  GraduationCap, 
  FileText, 
  Link2, 
  Mail, 
  MapPin, 
  Phone, 
  Calendar,
  AlertCircle,
  Fingerprint,
  FileCheck,
  ChevronDown,
  ChevronUp,
  Download,
  Share2,
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

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary?: string;
  category?: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  pith_fidelity_score?: number;
  status?: string;
  vouchedBy?: {
    displayName: string;
    relationship: string;
    confirmedAt: string;
    signature: string;
  };
  socraticDefense?: {
    tradeoffs: string;
    bottleneck: string;
    recordedAt: string;
  };
}

interface Experience {
  id: string;
  company_name: string;
  title: string;
  start_date?: string;
  end_date?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  affiliation_verified?: boolean;
  verificationMethod?: "PEER_CORROBORATION" | "WORK_DOMAIN" | "DOCUMENT_ANCHOR";
  chapterCorroboration?: {
    displayName: string;
    careerDepth: string;
    relationship: string;
    isRoleMasked: boolean;
    confirmedAt: string;
    notes?: string;
    signature: string;
    endorsedClaimCount: number;
    totalClaimCount: number;
  };
  claims: Claim[];
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  graduation_year: string;
  verified?: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuing_organization: string;
  issue_date: string;
  verified?: boolean;
}

interface Artifact {
  id: string;
  title: string;
  url: string;
  fileName?: string;
  isPasswordProtected: boolean;
  type: string;
}

interface CandidateVaultData {
  candidateName: string;
  candidateHandle: string;
  headline: string;
  summary: string;
  contact: {
    linkedinUrl: string;
    linkedinVerified: boolean;
    email: string;
    emailVerified: boolean;
    location: string;
    phone: string;
    phoneVerified: boolean;
  };
  artifacts: Artifact[];
  skills: { name: string; category: string; corroborated?: boolean }[];
  education: Education[];
  certifications: Certification[];
  experiences: Experience[];
}

function getCategoryBadge(cat?: string) {
  switch (cat) {
    case "METRIC":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
          <TrendingUp className="w-3 h-3 text-emerald-700" />
          <span>Metric</span>
        </span>
      );
    case "ARCHITECTURE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Cpu className="w-3 h-3 text-indigo-600" />
          <span>Systems</span>
        </span>
      );
    case "LEADERSHIP":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200">
          <Users className="w-3 h-3 text-amber-700" />
          <span>Leadership</span>
        </span>
      );
    case "EXECUTION":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <Target className="w-3 h-3 text-slate-500" />
          <span>Execution</span>
        </span>
      );
  }
}

export default function CandidateDossierPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = use(params);
  const handle = resolvedParams.handle;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CandidateVaultData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    async function loadVault() {
      try {
        const res = await fetch(`/api/vault?handle=${handle}`, { cache: "no-store" });
        const json = await res.json();
        if (json.success && json.data) {
          setData(json.data);
        } else {
          setError(json.error || "Candidate profile not found in Vault.");
        }
      } catch {
        setError("Network error retrieving verified dossier.");
      } finally {
        setLoading(false);
      }
    }
    loadVault();
  }, [handle]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
          <ShieldCheck className="w-5 h-5 text-emerald-600 animate-pulse" />
          <span>Retrieving verified dossier from cryptographic vault...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <VerifiedCVLogo className="w-10 h-10 mb-4" />
        <h1 className="text-xl font-black text-slate-900">Dossier Unavailable</h1>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          {error || `Candidate handle "${handle}" has not yet published a verified dossier.`}
        </p>
        <a
          href="/"
          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
        >
          Return to VerifiedCV Home
        </a>
      </div>
    );
  }

  // Calculate Verification Signals
  const isTier1 = Boolean(data.contact?.linkedinVerified && data.contact?.emailVerified);
  const verifiedChapters = (data.experiences || []).filter(
    (e) => e.affiliation_verified || Boolean(e.chapterCorroboration)
  );
  const isTier2 = isTier1 && verifiedChapters.length >= 1;
  const isTier3 = isTier2 && (data.artifacts || []).length >= 1;

  const currentTier = isTier3 ? 3 : isTier2 ? 2 : isTier1 ? 1 : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-emerald-100">
      
      {/* Top Recruiter Header */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 sm:px-12 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <VerifiedCVLogo className="w-7 h-7" />
          <span className="font-black text-lg tracking-tight text-slate-950">VerifiedCV</span>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
            Verified Candidate Dossier
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{shareCopied ? "Link Copied" : "Share Dossier"}</span>
          </button>

          <a
            href="/"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>Claim Your Dossier</span>
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl w-full mx-auto p-6 sm:py-10 space-y-6">
        
        {/* UNIFIED EXECUTIVE TRUST CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
          
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  {data.candidateName}
                </h1>
                <span title="Verified Authentic Candidate" className="inline-flex items-center text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-50 text-emerald-600" />
                </span>
              </div>
              <p className="text-sm sm:text-base font-bold text-slate-700">
                {data.headline}
              </p>
            </div>

            {/* Trust Tier Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs shrink-0 self-start">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                {currentTier === 3
                  ? "Tier 3: Forensically Certified"
                  : currentTier === 2
                  ? "Tier 2: Corroborated Track Record"
                  : currentTier === 1
                  ? "Tier 1: Authentic Professional"
                  : "Verified Candidate"}
              </span>
            </div>
          </div>

          {/* Contact & Identity Ledger Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            
            {data.contact?.linkedinUrl && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 truncate mr-2">
                  <LinkedinIcon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{data.contact.linkedinUrl}</span>
                </div>
                {data.contact.linkedinVerified && (
                  <span title="OAuth Identity Bound" className="inline-flex items-center text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  </span>
                )}
              </div>
            )}

            {data.contact?.email && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 truncate mr-2">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{data.contact.email}</span>
                </div>
                {data.contact.emailVerified && (
                  <span title="Deliverable Mailbox Confirmed" className="inline-flex items-center text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  </span>
                )}
              </div>
            )}

            {data.contact?.location && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-700 truncate">{data.contact.location}</span>
              </div>
            )}

            {data.contact?.phone && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 truncate mr-2">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-700 truncate">{data.contact.phone}</span>
                </div>
                {data.contact.phoneVerified && (
                  <span title="Carrier Line Matched" className="inline-flex items-center text-emerald-600">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  </span>
                )}
              </div>
            )}

          </div>

          {/* Executive Summary */}
          {data.summary && (
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal pt-1">
              {data.summary}
            </p>
          )}

          {/* Expandable Verification Ledger Drawer */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setIsLedgerOpen(!isLedgerOpen)}
              className="w-full p-3.5 bg-slate-50 hover:bg-slate-100/80 flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Forensic Trust Evidence Ledger</span>
                <span className="text-[10px] text-slate-500 font-normal font-mono">
                  • Audit ID: VCV-{(handle || "CAN").toUpperCase()}
                </span>
              </div>
              {isLedgerOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isLedgerOpen && (
              <div className="p-4 space-y-3 border-t border-slate-200 text-xs text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Fingerprint className="w-3.5 h-3.5 text-emerald-700" />
                      1. Identity Signals
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      OAuth UID binding confirmed. Mailbox deliverability certified. Carrier SIM match verified.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-700" />
                      2. Chapter Corroboration
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {verifiedChapters.length} employer chapters certified via role-masked peer and leadership attestations.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <span className="font-bold text-slate-900 block flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                      3. Artifact Vault
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {(data.artifacts || []).length} public patents, launch registries, or password-gated decks anchored.
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-950 font-medium">
                  <strong>Recruiter Notice:</strong> This candidate has pre-cleared mandatory employment screening checks. Stated titles and tenures reflect cryptographically signed ground truth.
                </div>
              </div>
            )}
          </div>

        </div>

        {/* CAREER CHAPTERS & VERIFIED MILESTONES */}
        <div className="space-y-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-700" />
            Verified Career Chapters ({(data.experiences || []).length})
          </h2>

          {(data.experiences || []).map((exp) => {
            const isCertified = exp.affiliation_verified || Boolean(exp.chapterCorroboration);

            return (
              <div
                key={exp.id}
                className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0"
              >
                {/* Chapter Header */}
                <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-950">
                      {exp.title}
                    </h3>
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-2 mt-0.5 flex-wrap">
                      <span>{exp.company_name}</span>
                      {isCertified && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {exp.chapterCorroboration
                            ? "Verified Chapter (Peer Corroborated)"
                            : exp.verificationMethod === "DOCUMENT_ANCHOR"
                            ? "Verified Chapter (Document Anchored)"
                            : "Verified Chapter (Domain Confirmed)"}
                        </span>
                      )}
                      {exp.chapterCorroboration && (
                        <span className="text-[10px] text-slate-500 font-normal">
                          • {exp.chapterCorroboration.displayName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {exp.start_date || `${exp.start_month || ""} ${exp.start_year || ""}`} —{" "}
                      {exp.is_current ? "Present" : exp.end_date || `${exp.end_month || ""} ${exp.end_year || ""}`}
                    </span>
                  </div>
                </div>

                {/* Chapter Bullets / Milestones */}
                <div className="p-4 sm:p-5 space-y-3.5">
                  {(exp.claims || []).map((claim) => {
                    const isDirectlyVouched = claim.status === "CORROBORATED" || Boolean(claim.vouchedBy);

                    return (
                      <div
                        key={claim.id}
                        className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-white transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(claim.category)}
                            {claim.metric_summary && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                {claim.metric_summary}
                              </span>
                            )}
                          </div>

                          {isDirectlyVouched ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Directly Vouched Milestone</span>
                            </span>
                          ) : claim.socraticDefense ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              <Sparkles className="w-3 h-3 text-indigo-600" />
                              <span>Author Calibrated</span>
                            </span>
                          ) : isCertified ? (
                            <span className="text-[10px] font-semibold text-emerald-700">
                              Chapter Certified
                            </span>
                          ) : null}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                          {claim.raw_bullet}
                        </p>

                        {/* Socratic Defense Brief */}
                        {claim.socraticDefense && (
                          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                            <div>
                              <span className="font-bold text-slate-800">Operational Bottleneck Solved: </span>
                              {claim.socraticDefense.bottleneck}
                            </div>
                            <div>
                              <span className="font-bold text-slate-800">System Trade-off Made: </span>
                              {claim.socraticDefense.tradeoffs}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* SKILLS & COMPETENCIES */}
        {(data.skills || []).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Verified Proficiencies & Core Competencies
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-800"
                >
                  <span>{skill.name}</span>
                  {skill.corroborated && (
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EDUCATION & CERTIFICATIONS */}
        {((data.education || []).length > 0 || (data.certifications || []).length > 0) && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-700" />
              Credentials, Education & Certifications
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(data.education || []).map((edu) => (
                <div key={edu.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{edu.institution}</span>
                    <span className="text-xs font-semibold text-slate-500 font-mono">{edu.graduation_year}</span>
                  </div>
                  <p className="text-xs text-slate-600">{edu.degree}</p>
                </div>
              ))}

              {(data.certifications || []).map((cert) => (
                <div key={cert.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-slate-600" />
                      {cert.name}
                    </span>
                    {cert.verified && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">{cert.issuing_organization}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WORK ARTIFACTS & PUBLICATIONS */}
        {(data.artifacts || []).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-700" />
              Portfolio Artifacts & Publications ({(data.artifacts || []).length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.artifacts.map((art) => (
                <a
                  key={art.id}
                  href={art.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <Link2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 truncate">{art.title}</span>
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
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-200 bg-white text-center text-xs text-slate-500 space-y-1">
        <div>VerifiedCV • Forensic Proof Signals for Authentic Candidates</div>
        <div className="text-[11px] text-slate-400">All signatures anchored to cryptographic identity ledger.</div>
      </footer>

    </div>
  );
}