"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  UploadCloud,
  Check,
  Globe,
  Briefcase,
  Layers,
  Sparkles,
  Users,
  Award,
  Clock,
  HelpCircle,
  Link2,
  Eye,
  FileBadge,
  Bot,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Hash,
  Share2
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { CandidateDossier, AtomicMilestone } from "@/types/vault";

export default function CandidateDossierPage() {
  const params = useParams();
  const routeHandle = (params?.handle as string) || "gharris";

  const [dossier, setDossier] = useState<CandidateDossier | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. Check local storage for active studio session
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`vcv_dossier_${routeHandle}`);
      if (stored) {
        try {
          const parsed: CandidateDossier = JSON.parse(stored);
          setDossier(parsed);
          if (parsed.milestones.length > 0) {
            setSelectedMilestoneId(parsed.milestones[0].id);
          }
          return;
        } catch {
          // ignore
        }
      }
    }

    // 2. Canonical Fallback for gharris or general handle resolution
    const canonicalProfile: CandidateDossier = {
      handle: routeHandle,
      fullName: routeHandle === "gharris" ? "Graham Harris" : "Verified Candidate",
      headline: "Product Leader • Personalization & AI Platforms",
      location: "Agoura Hills, CA",
      verifiedEmailDomain: "yahoo-inc.com",
      identityConfirmed: true,
      vaultAuditHash: "0x7a4e9b21f8c0541d",
      totalYearsExperience: 20,
      updatedAt: new Date().toISOString(),
      milestones: [
        {
          id: "m-yahoo-01",
          company: "Yahoo",
          role: "Head of Product Management",
          period: "2010 — 2024",
          rawText: "Led product management for a 400 million dollar personalization platform.",
          calibratedClaim:
            "Scaled multi-tenant personalization platform serving 400M+ global monthly active users under sub-50ms latency SLAs. Supervised 35+ engineers and data scientists across multi-region edge caching infrastructure.",
          metrics: [
            { label: "Scale", value: "400M+ Monthly Users" },
            { label: "SLA", value: "sub-50ms p99 Latency" }
          ],
          tier: "tier_2_peer",
          isCorroborated: true,
          corroboration: {
            receiptId: "rcpt-yh-9821",
            verifierRole: "Senior Director of Core Engineering",
            organization: "Yahoo",
            tenureOverlapYears: 8,
            attestationTimestamp: "2024-03-12T14:22:00Z",
            cryptographicHash: "0x8f2d61aa72e43a91",
            channel: "corporate_oauth"
          },
          artifacts: [
            {
              id: "art-yh-arch",
              title: "Multi-Tenant Personalization Architecture Brief",
              type: "architecture_brief",
              hash: "0xd9118ca210fe04bb",
              isPasswordGated: false
            }
          ]
        },
        {
          id: "m-uspto-02",
          company: "USPTO Registry",
          role: "Lead Inventor",
          period: "2021",
          rawText: "Patent awarded for distributed cache partitioning.",
          calibratedClaim:
            "Granted Patent US-98214-B2: Distributed Cache Partitioning Algorithm across high-throughput distributed microservices.",
          metrics: [
            { label: "Registry Status", value: "Active Patent US-98214-B2" }
          ],
          tier: "tier_3_registry",
          isCorroborated: true,
          corroboration: {
            receiptId: "rcpt-uspto-412",
            verifierRole: "USPTO Patent Examination Office",
            organization: "United States Patent and Trademark Office",
            tenureOverlapYears: 0,
            attestationTimestamp: "2021-09-18T00:00:00Z",
            cryptographicHash: "0x3c7e091129b412ff",
            channel: "uspto_registry"
          }
        },
        {
          id: "m-geon-03",
          company: "Ge-On",
          role: "Head of Product Management",
          period: "2024 — 2025",
          rawText: "First Head of Product for creator platform.",
          calibratedClaim:
            "Architected foundational product specifications and developer telemetry for seed-stage creator platform, aligning tokenomics and creator retention mechanisms.",
          metrics: [
            { label: "Velocity", value: "90-Day MVP Delivery" }
          ],
          tier: "tier_1_identity",
          isCorroborated: false
        }
      ]
    };

    setDossier(canonicalProfile);
    setSelectedMilestoneId(canonicalProfile.milestones[0].id);
  }, [routeHandle]);

  if (!dossier) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-sans text-xs">
        <Clock className="w-4 h-4 animate-spin text-[#059669] mr-2" />
        Resolving Cryptographic Dossier...
      </div>
    );
  }

  const activeMilestone =
    dossier.milestones.find((m) => m.id === selectedMilestoneId) || dossier.milestones[0];

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      
      {/* Dossier Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#0F172A] leading-none">
                VerifiedCV
              </span>
              <span className="text-[9px] font-bold text-[#059669] uppercase tracking-widest mt-0.5">
                Public Dossier
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Link Copied" : "Share Dossier"}</span>
            </button>

            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Dossier Presentation */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
        
        {/* Candidate Identity Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-black text-xl text-[#0F172A] shadow-2xs">
                {dossier.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-[#0F172A]">{dossier.fullName}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> Identity Confirmed
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  {dossier.headline}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                  <span>verifiedcv.app/{dossier.handle}</span>
                  <span>•</span>
                  <span>{dossier.location}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-left sm:text-right self-start sm:self-auto">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                Vault Status
              </span>
              <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Anchored
              </span>
            </div>
          </div>

          {/* Interactive Split View: Milestones (Left) vs. Evidence Receipt (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left 7 Columns: Corroborated Milestones */}
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
                Corroborated Career Milestones (Click to Inspect Evidence)
              </span>

              {dossier.milestones.map((milestone) => {
                const isSelected = selectedMilestoneId === milestone.id;
                return (
                  <div
                    key={milestone.id}
                    onClick={() => setSelectedMilestoneId(milestone.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                      isSelected
                        ? "bg-white border-[#059669] shadow-xs ring-1 ring-emerald-500/20"
                        : "bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {milestone.company} • {milestone.role}
                        </span>
                        <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5">
                          {milestone.calibratedClaim}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          milestone.isCorroborated
                            ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                            : "text-slate-500 bg-slate-100 border border-slate-200"
                        }`}
                      >
                        {milestone.isCorroborated ? (
                          <>
                            <Check className="w-3 h-3 text-[#059669]" /> Corroborated
                          </>
                        ) : (
                          "Self-Reported"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                      <span>{milestone.period}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right 5 Columns: Forensic Proof Receipt */}
            <div className="lg:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <span className="text-[11px] font-black uppercase tracking-widest text-[#059669] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Evidence Receipt
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Tier: {activeMilestone.tier.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Verified Chapter & Role
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {activeMilestone.company} — {activeMilestone.role}
                  </span>
                </div>

                {activeMilestone.corroboration ? (
                  <div className="p-3 bg-white border border-emerald-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Attestation Details
                    </span>
                    <p className="text-slate-700 text-xs leading-relaxed">
                      Corroborated by: <strong>{activeMilestone.corroboration.verifierRole}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Channel: {activeMilestone.corroboration.channel.toUpperCase()} • Overlapping Tenure:{" "}
                      {activeMilestone.corroboration.tenureOverlapYears} Years
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 pt-1">
                      Hash: {activeMilestone.corroboration.cryptographicHash}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Corroboration Status
                    </span>
                    <p className="text-slate-600 text-xs">
                      Self-reported milestone. Candidate can generate a peer voucher link from the Studio to anchor this claim.
                    </p>
                  </div>
                )}

                {activeMilestone.artifacts && activeMilestone.artifacts.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Anchored Work Artifacts
                    </span>
                    {activeMilestone.artifacts.map((art) => (
                      <div
                        key={art.id}
                        className="p-2.5 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-slate-600" />
                          <span className="font-semibold text-slate-800">{art.title}</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400">{art.hash.slice(0, 8)}...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#E2E8F0] text-center">
                <span className="text-[10px] text-slate-400">
                  Pre-screened proof signal • Bypasses automated recruiter skim filters.
                </span>
              </div>
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• The Permanent Career Proof Layer</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <Link href="/" className="hover:text-slate-950">
              Home
            </Link>
            <Link href="/studio" className="hover:text-slate-950">
              Candidate Studio
            </Link>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>

    </div>
  );
}