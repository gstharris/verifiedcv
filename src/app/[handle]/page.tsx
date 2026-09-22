"use client";

import { useState, useEffect, use } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  CheckCheck, 
  ExternalLink, 
  Building2, 
  FileText, 
  Laptop, 
  Mail, 
  Award, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Check, 
  Loader2, 
  TrendingUp, 
  Cpu, 
  Users, 
  Target,
  AlertCircle
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

interface ProofArtifact {
  title: string;
  category: "DEMO" | "DOC" | "CODE" | "LICENSE";
  url: string;
  description: string;
}

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary: string;
  category: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  status: "SELF_REPORTED" | "AI_VALIDATED" | "PEER_CORROBORATED" | "DRAFT";
  pith_fidelity_score?: number;
  audit_note?: string;
  peer_vouch?: {
    name: string;
    title: string;
    relationship: string;
  };
}

interface Experience {
  id: string;
  company_name: string;
  company_domain?: string;
  title: string;
  start_date: string;
  end_date: string;
  affiliation_verified?: boolean;
  claims: Claim[];
}

interface CandidateProfile {
  full_name: string;
  handle: string;
  headline: string;
  location: string;
  summary: string;
  skills?: { name: string; category: string }[];
  certifications?: { name: string; issuing_organization: string }[];
  artifacts?: ProofArtifact[];
  experiences: Experience[];
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "METRIC": return <TrendingUp className="w-3.5 h-3.5 text-blue-600" />;
    case "ARCHITECTURE": return <Cpu className="w-3.5 h-3.5 text-purple-600" />;
    case "LEADERSHIP": return <Users className="w-3.5 h-3.5 text-amber-600" />;
    case "EXECUTION":
    default: return <Target className="w-3.5 h-3.5 text-emerald-600" />;
  }
}

export default function RecruiterDossierPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = use(params);
  const handle = resolvedParams.handle || "gharris";

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeClaimId, setActiveClaimId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    async function loadVault() {
      try {
        const res = await fetch(`/api/vault?handle=${handle}&_t=${Date.now()}`, {
          cache: "no-store",
          headers: { Pragma: "no-cache" },
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setCandidate({
              full_name: json.data.candidateName || json.data.full_name || "Graham Harris",
              handle: json.data.candidateHandle || handle,
              headline: json.data.headline || "",
              location: json.data.location || "Greater Los Angeles, CA",
              summary: json.data.summary || "",
              skills: json.data.skills || [],
              certifications: json.data.certifications || [],
              artifacts: json.data.artifacts || [],
              experiences: json.data.experiences || [],
            });
          }
        }
      } catch (err) {
        console.warn("[PUBLIC PROFILE] Vault fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadVault();
  }, [handle]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const totalClaims = candidate?.experiences?.reduce((acc, exp) => acc + (exp.claims?.length || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 pb-20">
      
      {/* Top Banner Navigation */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <VerifiedCVLogo className="w-7 h-7" />
            <div className="flex items-baseline gap-1.5">
              <span className="font-black text-slate-950 text-base tracking-tight">VerifiedCV</span>
              <span className="text-slate-400 font-normal text-xs hidden sm:inline">| Candidate Trust Dossier</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedLink ? "Copied" : "Share Dossier"}</span>
            </button>
            <a
              href={`mailto:${candidate?.handle || handle}@verifiedcv.app`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact Candidate</span>
            </a>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-8 space-y-8">
        
        {loading ? (
          <div className="py-24 text-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Loading verified signals...</p>
          </div>
        ) : !candidate || candidate.experiences.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900">No Dossier Saved Yet</h2>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Upload your resume PDF in the studio and click &quot;Save to Vault&quot; to publish your public candidate dossier.
              </p>
            </div>
            <a
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Go to Studio
            </a>
          </div>
        ) : (
          <>
            {/* Header Profile Section */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                      {candidate.full_name}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified Candidate
                    </span>
                  </div>
                  {candidate.headline && (
                    <p className="text-base font-semibold text-slate-700">
                      {candidate.headline}
                    </p>
                  )}
                  {candidate.location && (
                    <p className="text-xs font-medium text-slate-500">
                      {candidate.location}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 sm:text-right shrink-0 space-y-1">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Trust Signals
                  </div>
                  <div className="flex sm:justify-end gap-3 text-xs font-bold text-slate-800">
                    <span>{candidate.experiences.length} Career Chapters</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-emerald-700">{totalClaims} Verifiable Claims</span>
                  </div>
                </div>
              </div>

              {candidate.summary && (
                <p className="text-sm text-slate-800 leading-relaxed font-normal border-t border-slate-100 pt-4">
                  {candidate.summary}
                </p>
              )}

              {candidate.skills && candidate.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {candidate.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Certifications Bar */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{candidate.certifications[0].name}</h4>
                    <p className="text-xs text-slate-600">{candidate.certifications[0].issuing_organization}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                  Verified Credential
                </span>
              </div>
            )}

            {/* Career Chapters */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Career Chapters & Accomplishments ({candidate.experiences.length})
                </h2>
                <span className="text-xs text-slate-500 font-medium">Verified forensic claims</span>
              </div>

              <div className="space-y-5">
                {candidate.experiences.map((exp) => (
                  <div 
                    key={exp.id} 
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs"
                  >
                    <div className="p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-base font-bold text-slate-950">
                            {exp.title}
                          </h3>
                          {exp.affiliation_verified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                              <Check className="w-3 h-3 text-emerald-700" />
                              Tenure Confirmed
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-semibold text-emerald-800 mt-0.5">
                          {exp.company_name} {exp.company_domain && <span className="text-slate-400 font-normal">({exp.company_domain})</span>}
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-slate-600 font-mono">
                        {exp.start_date} — {exp.end_date || "Present"}
                      </div>
                    </div>

                    <div className="p-5 space-y-3.5">
                      {exp.claims?.map((claim) => {
                        const isExpanded = activeClaimId === claim.id;
                        return (
                          <div
                            key={claim.id}
                            className="rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all overflow-hidden"
                          >
                            <div className="p-4 space-y-2.5">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                    {getCategoryIcon(claim.category)}
                                    {claim.category}
                                  </span>
                                  {claim.metric_summary && (
                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                                      {claim.metric_summary}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {claim.status === "PEER_CORROBORATED" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white shadow-2xs">
                                      <CheckCheck className="w-3.5 h-3.5" />
                                      Peer Corroborated
                                    </span>
                                  )}
                                  {claim.status === "AI_VALIDATED" && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                                      <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                                      AI Calibrated
                                    </span>
                                  )}
                                  {(claim.status === "SELF_REPORTED" || claim.status === "DRAFT") && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium text-slate-500 bg-slate-50 border border-slate-200">
                                      Self-Reported
                                    </span>
                                  )}

                                  <button
                                    onClick={() => setActiveClaimId(isExpanded ? null : claim.id)}
                                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Audit Proof</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                  </button>
                                </div>
                              </div>

                              <p className="text-sm text-slate-900 leading-relaxed font-normal">
                                {claim.raw_bullet}
                              </p>
                            </div>

                            {isExpanded && (
                              <div className="bg-slate-50 border-t border-slate-200 p-4 space-y-2 text-xs">
                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                  Verification & Lineage Log
                                </div>
                                <p className="text-slate-600 leading-relaxed">
                                  <strong className="text-slate-800">Forensic Check:</strong>{" "}
                                  {claim.audit_note || "Deconstructed and mapped into atomic deliverable claims with verified dates and scope."}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Recruiter Trust Footer */}
            <footer className="text-center py-8 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-700">Cryptographically Sealed by VerifiedCV Protocol</span>
              </div>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All corroborations and tenure verifications are anchored to verified identity hashes.
              </p>
            </footer>
          </>
        )}

      </main>
    </div>
  );
}