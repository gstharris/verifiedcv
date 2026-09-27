"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  BadgeCheck,
  ExternalLink,
  Building2,
  Calendar,
  Lock,
  ArrowRight,
  GraduationCap,
  Sparkles,
  UserCheck,
  Share2,
  Mail,
  Phone,
  MapPin,
  Users,
  Check
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface Milestone {
  id: string;
  company: string;
  role: string;
  period: string;
  location?: string;
  claims: string[];
  calibratedClaim?: string;
  artifacts?: { id: string; name: string; type: string }[];
  registryLinks?: { id: string; type: "github" | "credly" | "uspto"; url: string; label: string }[];
  verifications?: { id: string; name: string; role: string; email: string; verifiedAt: string; linkedInUrl?: string }[];
}

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  year?: string;
}

interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  linkedinVerified: boolean;
}

interface DossierData {
  handle: string;
  fullName: string;
  headline: string;
  summaryStatement: string;
  contact?: ContactInfo;
  skills: string[];
  education: EducationRecord[];
  milestones: Milestone[];
}

function getVerificationLevel(milestone: Milestone): number {
  if (milestone.registryLinks && milestone.registryLinks.length > 0) return 3;
  if (milestone.verifications && milestone.verifications.length > 0) return 2;
  if (milestone.artifacts && milestone.artifacts.length > 0) return 1;
  return 0;
}

export default function CandidateDossierPage() {
  const params = useParams();
  const requestedHandle = (params?.handle as string || "").toLowerCase().trim();

  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!requestedHandle) return;

    async function loadDossier() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vault?handle=${encodeURIComponent(requestedHandle)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.handle) {
            setDossier(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Vault API query fallback:", err);
      }

      if (typeof window !== "undefined") {
        const savedVault = sessionStorage.getItem("vcv_saved_vault");
        if (savedVault) {
          try {
            const parsed = JSON.parse(savedVault);
            if (parsed.handle && parsed.handle.toLowerCase().trim() === requestedHandle) {
              setDossier(parsed);
              setLoading(false);
              return;
            }
          } catch {
            // ignore
          }
        }
      }

      setDossier(null);
      setLoading(false);
    }

    loadDossier();
  }, [requestedHandle]);

  const copyDossierLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-3 font-sans text-[#0F172A]">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500">Retrieving Vault Ground Truth...</span>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between font-sans text-[#0F172A]">
        <header className="h-14 border-b border-[#E2E8F0] bg-white px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <VerifiedCVLogo className="w-6 h-6" />
            <span className="font-black text-base tracking-tight">VerifiedCV</span>
          </Link>
          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs"
          >
            <span>Open Studio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </header>

        <main className="max-w-md mx-auto text-center p-8 bg-white border border-[#E2E8F0] rounded-3xl shadow-xs space-y-4 my-auto">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-black text-[#0F172A]">Handle Available</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            The handle <code className="font-mono font-bold text-[#0F172A]">verifiedcv.app/{requestedHandle}</code> has not been committed yet.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>Claim this Handle in Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </main>

        <footer className="h-14 border-t border-[#E2E8F0] bg-white px-6 flex items-center justify-center text-xs text-slate-400">
          <span>VerifiedCV • Candidate-Enablement Trust Platform</span>
        </footer>
      </div>
    );
  }

  const corroboratedCount = dossier.milestones.reduce((acc, m) => acc + (m.verifications?.length || 0), 0);
  const verifiedSignalsCount =
    (dossier.contact?.emailVerified ? 1 : 0) +
    (dossier.contact?.linkedinVerified ? 1 : 0) +
    (dossier.contact?.phoneVerified ? 1 : 0) +
    corroboratedCount;

  // Portfolio Verification Stats
  const level0Count = dossier.milestones.filter(m => getVerificationLevel(m) === 0).length;
  const level1Count = dossier.milestones.filter(m => getVerificationLevel(m) === 1).length;
  const level2Count = dossier.milestones.filter(m => getVerificationLevel(m) === 2).length;
  const level3Count = dossier.milestones.filter(m => getVerificationLevel(m) === 3).length;
  const totalVerified = level1Count + level2Count + level3Count;
  const portfolioScore = dossier.milestones.length > 0 ? Math.round((totalVerified / dossier.milestones.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
          <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={copyDossierLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? "Link Copied!" : "Share Dossier"}</span>
          </button>

          <Link
            href="/studio"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Edit in Studio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-10 space-y-8 flex-1">
        {/* COMPACT TRUST SPECTRUM BAR */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-sm font-black text-[#0F172A] tracking-tight">Verified Portfolio Score</h2>
            </div>
            <span className="text-xs font-bold text-[#059669] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              {portfolioScore}% Validated
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Level 0: Unverified</span>
              <div className="flex items-end justify-between">
                <span className="text-xl font-black text-slate-700">{level0Count}</span>
                <span className="text-[10px] text-slate-400 font-medium">Claims</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Level 1: Document</span>
              <div className="flex items-end justify-between">
                <span className="text-xl font-black text-blue-700">{level1Count}</span>
                <span className="text-[10px] text-blue-400 font-medium">Verified</span>
              </div>
            </div>
                <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Level 2: Peer</span>
              <div className="flex items-end justify-between">
                <span className="text-xl font-black text-emerald-700">{level2Count}</span>
                <span className="text-[10px] text-emerald-400 font-medium">Verified</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col gap-1">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Level 3: Anchored</span>
              <div className="flex items-end justify-between">
                <span className="text-xl font-black text-emerald-800">{level3Count}</span>
                <span className="text-[10px] text-emerald-500 font-medium">Cryptographic</span>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Identity Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {dossier.fullName}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#059669] text-[10px] font-bold">
                  <BadgeCheck className="w-3.5 h-3.5" />
                  <span>Vault Anchored</span>
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-600">{dossier.headline}</p>
              <div className="text-xs font-mono text-slate-400 pt-0.5">
                verifiedcv.app/{dossier.handle}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-[#E2E8F0] px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                <span>Forensic Proof Signal</span>
              </span>
            </div>
          </div>

          {dossier.contact && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-2 border-t border-slate-100">
              {dossier.contact.email && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium truncate">{dossier.contact.email}</span>
                </div>
              )}
              {dossier.contact.phone && (
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{dossier.contact.phone}</span>
                </div>
              )}
              {dossier.contact.linkedin && (
                <div className="flex items-center gap-2 text-blue-600">
                  <LinkedInIcon className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="font-medium truncate">{dossier.contact.linkedin}</span>
                </div>
              )}
              {dossier.contact.location && (
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium">{dossier.contact.location}</span>
                </div>
              )}
            </div>
          )}

          {dossier.summaryStatement && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {dossier.summaryStatement}
              </p>
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Audited Career Milestones ({dossier.milestones.length})
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              Verified peer claims & deliverables
            </span>
          </div>

          <div className="space-y-5">
            {dossier.milestones.map((m) => {
              const level = getVerificationLevel(m);
              return (
              <div
                key={m.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <span className="font-black text-base text-[#0F172A] block">{m.company}</span>
                    <span className="text-xs font-semibold text-slate-600 block">{m.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      {m.period}
                    </span>
                    {level === 3 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#059669]" /> Anchored
                      </span>
                    )}
                    {level === 2 && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Peer Verified
                      </span>
                    )}
                    {level === 1 && (
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3 text-blue-600" /> Document Verified
                      </span>
                    )}
                  </div>
                </div>

                {m.registryLinks && m.registryLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                    {m.registryLinks.map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">
                        <ShieldCheck className="w-3 h-3" />
                        <span>{link.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {m.claims && m.claims.length > 0 ? (
                    m.claims.map((claim, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0 mt-1.5" />
                        <span>{claim}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed">{m.calibratedClaim}</p>
                  )}
                </div>

                {m.verifications && m.verifications.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    {m.verifications.map((v) => (
                      <div key={v.id} className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" />
                        <span>Verified by {v.name} ({v.role})</span>
                        {v.linkedInUrl && (
                          <a href={v.linkedInUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center w-4 h-4 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors ml-1" title="Authenticated via LinkedIn">
                            <LinkedInIcon className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* Skills */}
        {dossier.skills && dossier.skills.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Core Proficiencies & Technologies ({dossier.skills.length})
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {dossier.skills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education */}
        {dossier.education && dossier.education.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 pb-1">
              <GraduationCap className="w-4 h-4 text-[#059669]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                Education & Credentials
              </h3>
            </div>
            <div className="space-y-2.5">
              {dossier.education.map((edu) => (
                <div
                  key={edu.id}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]"
                >
                  <div>
                    <div className="font-bold text-xs text-[#0F172A]">{edu.institution}</div>
                    <div className="text-[11px] text-slate-500">{edu.degree}</div>
                  </div>
                  {edu.year && (
                    <span className="text-xs font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-[#E2E8F0]">
                      {edu.year}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span>• Forensic proof layer for careers</span>
          </div>
          <span className="text-[11px]">Dossier timestamped via Vault ground truth</span>
        </div>
      </footer>
    </div>
  );
}