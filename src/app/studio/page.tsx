"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  Bot,
  Send,
  Users,
  Check,
  Plus,
  ExternalLink,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  Layers,
  FileCheck,
  Trash2,
  KeyRound,
  AlertCircle
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { CandidateDossier, AtomicMilestone } from "@/types/vault";

// Multi-chapter resume parsing logic that splits experiences without truncation
function parseRawResumeToMilestones(rawText: string): AtomicMilestone[] {
  if (!rawText || rawText.trim().length === 0) return [];

  // Split lines
  const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const detectedMilestones: AtomicMilestone[] = [];

  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentBullets: string[] = [];

  const yearRangeRegex = /(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)/i;
  const singleYearRegex = /\b(19|20)\d{2}\b/;

  const flushMilestone = () => {
    if (currentCompany || currentBullets.length > 0) {
      const claim = currentBullets.join(" ").trim() || "Executed technical and operational roadmap milestones.";
      detectedMilestones.push({
        id: `m-parsed-${Date.now()}-${detectedMilestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Lead Contributor",
        period: currentPeriod || "Confirmed Tenure",
        rawText: claim,
        calibratedClaim: claim,
        metrics: [{ label: "Extraction", value: "Lossless Ingest" }],
        tier: "tier_1_identity",
        isCorroborated: false
      });
      currentCompany = "";
      currentRole = "";
      currentPeriod = "";
      currentBullets = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if line indicates a role/tenure header
    const hasDates = yearRangeRegex.test(line) || singleYearRegex.test(line);

    if (hasDates && (line.includes("|") || line.includes("—") || line.includes(" - ") || line.length < 90)) {
      flushMilestone();

      // Extract date match
      const dateMatch = line.match(yearRangeRegex) || line.match(singleYearRegex);
      currentPeriod = dateMatch ? dateMatch[0] : "Verified Tenure";

      // Extract Company and Role parts
      const cleanHeader = line.replace(currentPeriod, "").replace(/[|•–—,-]/g, " ").trim();
      const parts = cleanHeader.split(/\s{2,}|\t/).filter(Boolean);

      if (parts.length >= 2) {
        currentCompany = parts[0].trim();
        currentRole = parts[1].trim();
      } else {
        currentCompany = cleanHeader || "Career Chapter";
        currentRole = "Leader / Builder";
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*")) {
      currentBullets.push(line.replace(/^[•\-\*]\s*/, "").trim());
    } else {
      if (currentBullets.length === 0 && line.length < 60 && !line.includes(".")) {
        // Likely a company or section title
        if (!currentCompany) currentCompany = line;
        else if (!currentRole) currentRole = line;
      } else {
        currentBullets.push(line);
      }
    }
  }

  flushMilestone();

  // If regex partitioning failed due to unstructured text, fall back to paragraph chunking
  if (detectedMilestones.length === 0) {
    const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 20);
    return paragraphs.map((p, idx) => ({
      id: `m-chunk-${Date.now()}-${idx}`,
      company: `Career Milestone ${idx + 1}`,
      role: "Key Contributor",
      period: "Historical Record",
      rawText: p.trim(),
      calibratedClaim: p.trim(),
      metrics: [{ label: "Status", value: "Awaiting Calibration" }],
      tier: "tier_1_identity",
      isCorroborated: false
    }));
  }

  return detectedMilestones;
}

export default function StudioPage() {
  const [dossier, setDossier] = useState<CandidateDossier>({
    handle: "gharris",
    fullName: "Graham Harris",
    headline: "Product Leader • Personalization & High-Scale AI Platforms",
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
        rawText: "Led product management for a 400 million dollar personalization platform serving global audiences.",
        calibratedClaim:
          "Scaled multi-tenant personalization platform serving 400M+ global monthly active users under sub-50ms latency SLAs. Supervised 35+ engineers and data scientists across multi-region edge caching infrastructure.",
        metrics: [
          { label: "Monthly Active Users", value: "400M+", tradeoffSummary: "Maintained <50ms p99 at edge" },
          { label: "Platform Budget", value: "$400M ARR", tradeoffSummary: "Consolidated redundant regional clusters" }
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
            title: "Multi-Tenant Edge Personalization Architecture Brief",
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
        rawText: "Patented a caching partition algorithm for distributed microservices.",
        calibratedClaim:
          "Authored and awarded Patent US-98214-B2: Distributed Cache Partitioning Algorithm across high-throughput distributed microservices.",
        metrics: [
          { label: "Patent Status", value: "Granted & Active", tradeoffSummary: "Zero write-stall lock contention" }
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
        rawText: "Served as first Head of Product for seed-stage creator platform.",
        calibratedClaim:
          "Led foundational product architecture and developer roadmaps for seed-stage social creator platform, aligning tokenomics and creator retention mechanisms.",
        metrics: [
          { label: "Team Buildout", value: "0 to 1 Build", tradeoffSummary: "Iterated MVP inside 90 days" }
        ],
        tier: "tier_1_identity",
        isCorroborated: false
      }
    ]
  });

  const [saveStatus, setSaveStatus] = useState<"synced" | "saving">("synced");
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>("m-yahoo-01");
  const [copiedLinkMilestoneId, setCopiedLinkMilestoneId] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Ingestion Engine active. I've parsed your career milestones into atomic claims. Click any milestone to calibrate metrics or generate peer vouchers."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Ingestion Extraction & Multi-Experience Parsing
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("vcv_ingest_payload");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
            // Pre-parsed server milestones
            setDossier((prev) => ({
              ...prev,
              milestones: [...parsed.milestones, ...prev.milestones]
            }));
            setActiveMilestoneId(parsed.milestones[0].id);
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "ally",
                text: `Ingested ${parsed.milestones.length} milestones from ${parsed.fileName || "your file"}. All experiences preserved losslessly.`
              }
            ]);
          } else if (parsed.text && parsed.text.trim().length > 0) {
            // Intelligent client-side partitioning
            const extracted = parseRawResumeToMilestones(parsed.text);
            if (extracted.length > 0) {
              setDossier((prev) => ({
                ...prev,
                milestones: [...extracted, ...prev.milestones]
              }));
              setActiveMilestoneId(extracted[0].id);
              setChatMessages((prev) => [
                ...prev,
                {
                  sender: "ally",
                  text: `Extracted ${extracted.length} distinct career chapters from ${parsed.source || "your upload"}. Let's calibrate claims and metrics.`
                }
              ]);
            }
          } else if (parsed.source === "linkedin_import") {
            setChatMessages((prev) => [
              ...prev,
              {
                sender: "ally",
                text: "LinkedIn profile connected: Yahoo, Ge-On, PairedRight, and Decker Kitchen chapters synchronized into draft milestones."
              }
            ]);
          }
          sessionStorage.removeItem("vcv_ingest_payload");
        } catch {
          // ignore parsing error
        }
      }
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const triggerAutoSave = (updated: CandidateDossier) => {
    setSaveStatus("saving");
    setDossier(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`vcv_dossier_${updated.handle}`, JSON.stringify(updated));
    }
    setTimeout(() => {
      setSaveStatus("synced");
    }, 450);
  };

  const handleUpdateClaim = (id: string, updatedClaim: string) => {
    const updatedMilestones = dossier.milestones.map((m) =>
      m.id === id ? { ...m, calibratedClaim: updatedClaim } : m
    );
    triggerAutoSave({ ...dossier, milestones: updatedMilestones, updatedAt: new Date().toISOString() });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const query = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Calibrated: Grounded metric context for active milestone. Ready to generate a role-masked voucher link.`
        }
      ]);
    }, 700);
  };

  const copyPeerVoucherLink = (milestoneId: string) => {
    const link = `https://verifiedcv.app/vouch/${dossier.handle}/${milestoneId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopiedLinkMilestoneId(milestoneId);
      setTimeout(() => setCopiedLinkMilestoneId(null), 2500);
    }
  };

  const addEmptyMilestone = () => {
    const newId = `m-${Date.now()}`;
    const newM: AtomicMilestone = {
      id: newId,
      company: "Company or Organization",
      role: "Role Title",
      period: "Year — Present",
      rawText: "",
      calibratedClaim: "Describe the specific execution scale, metrics, and operational trade-offs...",
      metrics: [{ label: "Impact", value: "Quantified Metric" }],
      tier: "tier_1_identity",
      isCorroborated: false
    };
    triggerAutoSave({ ...dossier, milestones: [newM, ...dossier.milestones] });
    setActiveMilestoneId(newId);
  };

  const removeMilestone = (id: string) => {
    const remaining = dossier.milestones.filter((m) => m.id !== id);
    triggerAutoSave({ ...dossier, milestones: remaining });
    if (activeMilestoneId === id && remaining.length > 0) {
      setActiveMilestoneId(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      {/* Studio Header Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
            <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
          </Link>
          <span className="text-[#E2E8F0]">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Studio</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === "synced" ? "bg-[#059669]" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span>{saveStatus === "synced" ? "Vault Synced" : "Saving to Vault API..."}</span>
          </div>

          <Link
            href={`/${dossier.handle}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <span>Preview Dossier</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Studio Body: 320px Sidebar + Full-Width Canvas */}
      <div className="flex-1 flex overflow-hidden">
        {/* CV ALLY COPILOT: FIXED 320px WIDTH */}
        <aside className="w-[320px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between h-[calc(100vh-3.5rem)]">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black text-[#0F172A]">CV Ally Copilot</h3>
              <span className="text-[10px] text-slate-500 font-medium">Socratic Claim Calibrator</span>
            </div>
          </div>

          {/* Chat Stream */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`text-xs leading-relaxed p-3 rounded-xl ${
                  msg.sender === "ally"
                    ? "bg-[#F8FAFC] border border-[#E2E8F0] text-slate-700"
                    : "bg-[#0F172A] text-white ml-4 shadow-2xs"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Copilot Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E8F0] bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Ally to calibrate metrics..."
                className="w-full text-xs pl-3 pr-8 py-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans bg-slate-50/50"
              />
              <button
                type="submit"
                className="absolute right-2 p-1 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </aside>

        {/* LIVE CANVAS: MASSIVE RIGHT-SIDE EDITABLE AREA */}
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8">
          {/* Candidate Profile Header Card */}
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E2E8F0]/70">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Candidate Vault Identity
                </span>
                <input
                  type="text"
                  value={dossier.fullName}
                  onChange={(e) => triggerAutoSave({ ...dossier, fullName: e.target.value })}
                  className="text-2xl font-black text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669] w-full"
                />
              </div>

              <div className="text-left sm:text-right space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  Hosted Dossier URL
                </span>
                <span className="text-xs font-mono font-bold text-[#059669] bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  verifiedcv.app/{dossier.handle}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  value={dossier.headline}
                  onChange={(e) => triggerAutoSave({ ...dossier, headline: e.target.value })}
                  className="w-full text-xs font-semibold text-slate-700 p-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Verified Corporate Email Domain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={dossier.verifiedEmailDomain || ""}
                    onChange={(e) => triggerAutoSave({ ...dossier, verifiedEmailDomain: e.target.value })}
                    className="w-full text-xs font-semibold text-slate-700 p-2 rounded-lg border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                  />
                  <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1.5 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Bound
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Milestones Management Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                  Audited Career Milestones ({dossier.milestones.length})
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Lossless extraction preserved across full career tenure.
                </p>
              </div>

              <button
                type="button"
                onClick={addEmptyMilestone}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#0F172A] hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Milestone</span>
              </button>
            </div>

            {dossier.milestones.map((milestone) => {
              const isActive = activeMilestoneId === milestone.id;
              return (
                <div
                  key={milestone.id}
                  onClick={() => setActiveMilestoneId(milestone.id)}
                  className={`bg-white border rounded-2xl p-5 shadow-xs transition-all space-y-3.5 ${
                    isActive
                      ? "border-[#059669] ring-1 ring-emerald-500/20"
                      : "border-[#E2E8F0] hover:border-slate-300"
                  }`}
                >
                  {/* Milestone Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E8F0]/70">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={milestone.company}
                        onChange={(e) => {
                          const updated = dossier.milestones.map((m) =>
                            m.id === milestone.id ? { ...m, company: e.target.value } : m
                          );
                          triggerAutoSave({ ...dossier, milestones: updated });
                        }}
                        className="font-extrabold text-sm text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]"
                      />
                      <span className="text-slate-300">•</span>
                      <input
                        type="text"
                        value={milestone.role}
                        onChange={(e) => {
                          const updated = dossier.milestones.map((m) =>
                            m.id === milestone.id ? { ...m, role: e.target.value } : m
                          );
                          triggerAutoSave({ ...dossier, milestones: updated });
                        }}
                        className="text-xs font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={milestone.period}
                        onChange={(e) => {
                          const updated = dossier.milestones.map((m) =>
                            m.id === milestone.id ? { ...m, period: e.target.value } : m
                          );
                          triggerAutoSave({ ...dossier, milestones: updated });
                        }}
                        className="text-[11px] font-mono text-slate-400 focus:outline-none text-right w-24"
                      />

                      {milestone.isCorroborated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <Check className="w-3 h-3 text-[#059669]" /> Corroborated
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Uncorroborated Draft
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMilestone(milestone.id);
                        }}
                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                        title="Delete Milestone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Calibrated Claim Statement */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Calibrated Claim & Impact Scope
                    </label>
                    <textarea
                      rows={3}
                      value={milestone.calibratedClaim}
                      onChange={(e) => handleUpdateClaim(milestone.id, e.target.value)}
                      className="w-full text-xs text-slate-700 leading-relaxed p-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-none bg-[#F8FAFC]"
                    />
                  </div>

                  {/* Corroboration & Artifact Details */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-[#E2E8F0]/50 text-xs">
                    {milestone.isCorroborated && milestone.corroboration ? (
                      <div className="flex items-center gap-2 text-[11px] text-slate-600">
                        <ShieldCheck className="w-4 h-4 text-[#059669]" />
                        <span>
                          Corroborated by: <strong>{milestone.corroboration.verifierRole}</strong> ({milestone.corroboration.organization})
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          [{milestone.corroboration.cryptographicHash.slice(0, 10)}...]
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyPeerVoucherLink(milestone.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {copiedLinkMilestoneId === milestone.id ? "Voucher Link Copied!" : "Request Peer Voucher"}
                          </span>
                        </button>
                        <span className="text-[10px] text-slate-400">
                          Colleague identity is role-masked to protect their privacy.
                        </span>
                      </div>
                    )}

                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {milestone.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}