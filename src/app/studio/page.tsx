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
  RotateCcw,
  Upload
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { CandidateDossier, AtomicMilestone } from "@/types/vault";

const DEFAULT_DOSSIER: CandidateDossier = {
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
      }
    }
  ]
};

export default function StudioPage() {
  const [dossier, setDossier] = useState<CandidateDossier>(DEFAULT_DOSSIER);
  const [saveStatus, setSaveStatus] = useState<"synced" | "saving">("synced");
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>("");
  const [copiedLinkMilestoneId, setCopiedLinkMilestoneId] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Ingestion Engine online. Review your extracted career milestones below, or ask me to calibrate metrics and draft peer vouchers."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache Recovery & Fresh Ingestion Handler
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if there is an incoming fresh ingestion payload
    const incomingPayload = sessionStorage.getItem("vcv_ingest_payload");

    if (incomingPayload) {
      try {
        const parsed = JSON.parse(incomingPayload);
        sessionStorage.removeItem("vcv_ingest_payload"); // Consume immediately to prevent duplicate runs

        if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
          // Fresh server-extracted milestones completely replace stale cache
          const freshDossier: CandidateDossier = {
            ...DEFAULT_DOSSIER,
            milestones: parsed.milestones,
            updatedAt: new Date().toISOString()
          };

          setDossier(freshDossier);
          localStorage.setItem(`vcv_dossier_${freshDossier.handle}`, JSON.stringify(freshDossier));
          setActiveMilestoneId(parsed.milestones[0].id);

          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ally",
              text: `Ingested ${parsed.milestones.length} career milestones from "${parsed.fileName || "uploaded resume"}". Old cache purged.`
            }
          ]);
          return;
        }
      } catch (err) {
        console.error("Payload ingestion error:", err);
      }
    }

    // If no fresh payload, load existing localStorage state
    const cached = localStorage.getItem(`vcv_dossier_${DEFAULT_DOSSIER.handle}`);
    if (cached) {
      try {
        const parsedCached = JSON.parse(cached);
        setDossier(parsedCached);
        if (parsedCached.milestones?.length > 0) {
          setActiveMilestoneId(parsedCached.milestones[0].id);
        }
        return;
      } catch {
        // ignore JSON parse error
      }
    }

    // Default seed
    setActiveMilestoneId(DEFAULT_DOSSIER.milestones[0].id);
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
    setTimeout(() => setSaveStatus("synced"), 300);
  };

  const handleResetCache = () => {
    if (confirm("Reset career vault to clean default state and clear local cache?")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(`vcv_dossier_${dossier.handle}`);
        sessionStorage.removeItem("vcv_ingest_payload");
      }
      setDossier(DEFAULT_DOSSIER);
      setActiveMilestoneId(DEFAULT_DOSSIER.milestones[0].id);
      setChatMessages((prev) => [
        ...prev,
        { sender: "ally", text: "Vault cache reset. Ready for clean resume upload." }
      ]);
    }
  };

  const handleDirectStudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const formData = new FormData();
    formData.append("file", file);

    setSaveStatus("saving");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.milestones && data.milestones.length > 0) {
          const updatedDossier: CandidateDossier = {
            ...dossier,
            milestones: data.milestones,
            updatedAt: new Date().toISOString()
          };
          triggerAutoSave(updatedDossier);
          setActiveMilestoneId(data.milestones[0].id);
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ally",
              text: `Directly parsed ${data.milestones.length} milestones from "${file.name}". All experiences loaded losslessly.`
            }
          ]);
          return;
        }
      }
      alert("Could not extract milestones from file. Ensure it is a valid PDF or DOCX.");
    } catch {
      alert("Upload failed. Please check network connection.");
    } finally {
      setSaveStatus("synced");
    }
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
          text: `Calibrated: Clarified boundary conditions for active milestone. Ready to generate a role-masked voucher link.`
        }
      ]);
    }, 600);
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

        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            className="hidden"
            onChange={handleDirectStudioUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            title="Upload a new resume file"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>Upload New Resume</span>
          </button>

          <button
            type="button"
            onClick={handleResetCache}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-700 p-1.5 rounded-md transition-colors"
            title="Clear stored browser cache"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Cache</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500 ml-1">
            <span
              className={`w-2 h-2 rounded-full ${
                saveStatus === "synced" ? "bg-[#059669]" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span>{saveStatus === "synced" ? "Vault Synced" : "Saving..."}</span>
          </div>

          <Link
            href={`/${dossier.handle}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer ml-1"
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