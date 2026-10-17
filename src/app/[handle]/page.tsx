"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  Share2,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { getVerificationStatus, publicChapterLabel } from "@/lib/verificationLevel";
import { companyVerificationTooltip, endorsedClaimIndexes, publicTrustSummary } from "@/lib/verificationSignals";
import { captureEvent } from "@/lib/analytics";
import PortfolioAssetsGallery from "@/components/PortfolioAssetsGallery";
import { parseDossierLayout, publicRegistryLabel, type PortfolioAsset, type RecruiterLayout } from "@/lib/portfolioAssets";
import { flagEmoji, parseLocation } from "@/lib/locations";
import { resolvePlace } from "@/lib/places";
import { linkedInHandle, linkedInProfileUrl } from "@/lib/linkedin";
import { faviconUrl } from "@/lib/companySite";
import { hydrateChapter } from "@/lib/chapterMeta";
import { sortChaptersByTenure } from "@/lib/tenureOverlap";

function ProofMark({ label }: { label: string }) {
  return (
    <span className="group/mark relative inline-flex shrink-0">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-max -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-xl group-hover/mark:block group-focus-within/mark:block">
        {label}
      </span>
    </span>
  );
}

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
  companyUrl?: string;
  highlightIndexes?: number[];
  artifacts?: { id: string; name: string; type: string }[];
  registryLinks?: { id: string; type: "github" | "credly" | "uspto"; url: string; label: string }[];
  verifications?: { id: string; name: string; role: string; email: string; verifiedAt: string; linkedInUrl?: string }[];
  endorsedClaimIds?: string[];
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
  highlights?: string[];
  preferredLayout?: RecruiterLayout;
  portfolioAssets?: PortfolioAsset[];
  contact?: ContactInfo;
  skills: string[];
  education: EducationRecord[];
  milestones: Milestone[];
}

function getVerificationLevel(milestone: Milestone): number {
  return getVerificationStatus({
    peers: milestone.verifications?.length || 0,
    docs: milestone.artifacts?.length || 0,
    registry: Boolean(milestone.registryLinks && milestone.registryLinks.length > 0)
  }).level;
}

export default function CandidateDossierPage() {
  const params = useParams();
  const requestedHandle = (params?.handle as string || "").toLowerCase().trim();

  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [aboutHover, setAboutHover] = useState(false);
  const [aboutPinned, setAboutPinned] = useState(false);
  const aboutOpen = aboutHover || aboutPinned;

  useEffect(() => {
    if (!requestedHandle) return;

    async function loadDossier() {
      setLoading(true);
      try {
        const res = await fetch(`/api/vault?handle=${encodeURIComponent(requestedHandle)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.handle) {
            captureEvent("dossier_viewed", { handle: requestedHandle, found: true });
            setDossier(data);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("Vault API query fallback:", err);
      }

      setDossier(null);
      setLoading(false);
      captureEvent("dossier_viewed", { handle: requestedHandle, found: false });
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
          <span>VerifiedCV • Your portfolio</span>
        </footer>
      </div>
    );
  }

  const chapters = sortChaptersByTenure(dossier.milestones.map((milestone) => hydrateChapter(milestone)));
  const trustLines = publicTrustSummary({
    emailVerified: dossier.contact?.emailVerified,
    phoneVerified: dossier.contact?.phoneVerified,
    linkedinVerified: dossier.contact?.linkedinVerified,
    corroboratedChapters: chapters.filter((milestone) => getVerificationLevel(milestone) > 0).length,
    workSamples: dossier.portfolioAssets?.length || 0
  });
  const linkedInSlug = linkedInHandle(dossier.contact?.linkedin || "");
  const linkedInHref = linkedInProfileUrl(dossier.contact?.linkedin || "") || "";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
          <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
        </Link>

        <div className="flex items-center gap-3">
          <div
            className="relative"
            onMouseEnter={() => setAboutHover(true)}
            onMouseLeave={() => setAboutHover(false)}
          >
            <button
              type="button"
              onClick={() => setAboutPinned((current) => !current)}
              className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
              aria-expanded={aboutOpen}
            >
              How we check
            </button>
            {aboutOpen && (
              <div className="absolute right-0 top-full z-30 mt-2 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 text-xs leading-relaxed text-slate-600 shadow-lg">
                VerifiedCV is a page the candidate owns. A check means that item was confirmed: an email, a phone number, LinkedIn, a colleague who worked with them, or a public link they added. A page without those checks is still their portfolio. This is not an employer background check.
              </div>
            )}
          </div>
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
            <span>Sign in</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 py-10 space-y-8 flex-1">
        {/* Candidate Identity Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {dossier.fullName}
                </h1>
              </div>
              <p className="text-sm font-semibold text-slate-600">{dossier.headline}</p>
              <div className="text-xs font-mono text-slate-400 pt-0.5">
                verifiedcv.app/{dossier.handle}
              </div>
            </div>

            {trustLines.length > 0 && (
              <div className="group/trust relative shrink-0">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[#059669]"
                  aria-label="Verification overview"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <div className="pointer-events-none absolute right-0 top-full z-20 mt-1 hidden w-52 rounded-lg bg-slate-900 px-3 py-2 text-left text-[10px] font-semibold leading-relaxed text-white shadow-xl group-hover/trust:block group-focus-within/trust:block">
                  {trustLines.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {dossier.contact && (
            <div className="grid grid-cols-1 gap-x-6 gap-y-3 pt-4 border-t border-slate-100 text-xs sm:grid-cols-2">
              {dossier.contact.email && (
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${dossier.contact.emailVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Mail className="w-3 h-3" />
                  </div>
                  <span className={`font-medium truncate ${dossier.contact.emailVerified ? 'text-slate-900' : 'text-slate-500'}`}>{dossier.contact.email}</span>
                  {dossier.contact.emailVerified && <ProofMark label="Email confirmed" />}
                </div>
              )}
              {dossier.contact.phone && (
                <div className="flex min-w-0 items-center gap-2">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full ${dossier.contact.phoneVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                    <Phone className="w-3 h-3" />
                  </div>
                  <span className={`font-medium truncate ${dossier.contact.phoneVerified ? 'text-slate-900' : 'text-slate-500'}`}>{dossier.contact.phone}</span>
                  {dossier.contact.phoneVerified && <ProofMark label="Phone confirmed" />}
                </div>
              )}
              {linkedInSlug && linkedInHref && (
                <div className="flex min-w-0 items-center gap-2">
                  <a
                    href={linkedInHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 min-w-0 text-blue-700"
                  >
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${dossier.contact.linkedinVerified ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-400"}`}>
                      <LinkedInIcon className="w-3 h-3" />
                    </span>
                    <span className="font-medium truncate">{linkedInSlug}</span>
                  </a>
                  {dossier.contact.linkedinVerified && <ProofMark label="LinkedIn confirmed" />}
                </div>
              )}
              {dossier.contact.location && (
                <div className="flex min-w-0 items-center gap-2">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-400">
                    {resolvePlace(dossier.contact.location)?.countryCode ? (
                      <span className="text-sm leading-none">{flagEmoji(resolvePlace(dossier.contact.location)?.countryCode || "")}</span>
                    ) : (
                      <MapPin className="w-3 h-3" />
                    )}
                  </div>
                  <span className="font-medium text-slate-500 truncate">{resolvePlace(dossier.contact.location)?.label || parseLocation(dossier.contact.location)?.label || dossier.contact.location}</span>
                </div>
              )}
            </div>
          )}

        </div>

        {(() => {
          const pageTemplate = parseDossierLayout(dossier.preferredLayout);
          const assets = dossier.portfolioAssets || [];
          const showWork = assets.length > 0;
          const gallery = showWork ? <PortfolioAssetsGallery assets={assets} /> : null;
          const workFirst = showWork && pageTemplate.placement === "top";
          const highlights = (dossier.highlights || []).map((line) => String(line || "").trim()).filter(Boolean);
          const showSummary = Boolean(String(dossier.summaryStatement || "").trim());
          return (
            <>
              {workFirst && gallery}
              {showSummary && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Summary</h2>
                  <p className="text-sm text-slate-700 leading-relaxed">{dossier.summaryStatement}</p>
                </div>
              )}
              {highlights.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">Highlights</h2>
                  <div className="space-y-2">
                    {highlights.map((line) => (
                      <p key={line} className="text-xs text-slate-700 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              {/* Milestones */}
              <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Experience ({chapters.length})
            </h2>
          </div>

          <div className="space-y-5">
            {chapters.map((m) => {
              const level = getVerificationLevel(m);
              const chapterLabel = publicChapterLabel(level);
              const proofDetail = companyVerificationTooltip(m.company, m.verifications || [], m.artifacts?.length || 0);
              return (
              <div
                key={m.id}
                className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {m.companyUrl ? (
                        <a href={m.companyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 font-black text-base text-[#0F172A] hover:text-[#059669]">
                          <img src={faviconUrl(m.companyUrl)} alt="" className="w-4 h-4 rounded-sm" />
                          {m.company}
                        </a>
                      ) : (
                        <span className="font-black text-base text-[#0F172A]">{m.company}</span>
                      )}
                      {chapterLabel && (
                        <span className="group/proof relative inline-flex shrink-0">
                          <button
                            type="button"
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded cursor-help"
                          >
                            {chapterLabel}
                          </button>
                          {proofDetail && (
                            <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-56 rounded-lg bg-slate-900 px-3 py-2 text-left text-[10px] font-semibold leading-relaxed text-white shadow-xl group-hover/proof:block group-focus-within/proof:block">
                              {proofDetail}
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-600 block">{m.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-medium text-slate-500 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      {m.period}
                    </span>
                  </div>
                </div>

                {m.registryLinks && m.registryLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-100">
                    {m.registryLinks.map((link) => (
                      <a key={link.id} href={link.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-slate-600 hover:text-slate-900 transition-colors">
                        <span>{link.label}</span>
                        <span className="text-slate-400">{publicRegistryLabel(link.type)}</span>
                      </a>
                    ))}
                  </div>
                )}

                <div className="space-y-2">
                  {m.claims && m.claims.length > 0 ? (
                    m.claims.map((claim, idx) => {
                      const claimVerified = endorsedClaimIndexes(m.endorsedClaimIds).includes(idx);
                      return (
                      <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                        {claimVerified ? (
                          <span className="group/claim relative mt-0.5 shrink-0 cursor-help">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                            <span className="pointer-events-none absolute left-0 top-full z-20 mt-1 hidden w-48 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-semibold leading-relaxed text-white shadow-xl group-hover/claim:block">
                              A colleague confirmed this line.
                            </span>
                          </span>
                        ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0 mt-1.5" />
                        )}
                        <span>{claim}</span>
                      </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-700 leading-relaxed">{m.calibratedClaim}</p>
                  )}
                </div>
              </div>
            )})}
          </div>
        </div>

        {/* Skills */}
        {dossier.skills && dossier.skills.length > 0 && (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
              Skills ({dossier.skills.length})
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
              {!workFirst && gallery}
            </>
          );
        })()}
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-xs text-slate-400">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span>• Your portfolio</span>
          </div>
          <span className="text-[11px]">verifiedcv.app/{dossier.handle}</span>
        </div>
      </footer>
    </div>
  );
}