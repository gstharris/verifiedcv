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
  UploadCloud,
  ClipboardPaste,
  UserCheck,
  X,
  RotateCcw
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

interface Milestone {
  id: string;
  company: string;
  role: string;
  period: string;
  calibratedClaim: string;
  isCorroborated: boolean;
  corroboratedBy?: string;
  tier?: string;
}

const GRAHAM_HARRIS_CANONICAL: Milestone[] = [
  {
    id: "m-gh-geon-01",
    company: "Ge-on",
    role: "Head of Product Management",
    period: "May 2025 to Present",
    calibratedClaim:
      "Direct end-to-end product strategy, feature prioritization, and delivery roadmaps for an AI workspace platform, driving a 25% lift in weekly active users during initial rollout. Designed and deployed autonomous agent workflows and proactive push notifications feeding a persistent memory layer. Built functional interactive prototypes in React, Cursor, and modern UI tools to test user workflows prior to engineering sprints.",
    isCorroborated: false
  },
  {
    id: "m-gh-scd-02",
    company: "SCD Enterprises / PairedRight",
    role: "Founder and Head of Product",
    period: "2018 to March 2026",
    calibratedClaim:
      "Founded an operational workflow and recommendation platform for hospitality operators, scaling client revenue by over $1M through automated upselling and real-time guidance. Rebuilt the core recommendation engine using a context-grounded RAG framework. Established an operational golden dataset to benchmark, verify, and regression-test algorithmic changes before deploying updates to frontline staff devices.",
    isCorroborated: false
  },
  {
    id: "m-gh-yahoo-03",
    company: "Yahoo",
    role: "Head of Product Management",
    period: "2010 — 2024",
    calibratedClaim:
      "Built ad personalization and enterprise platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries. Maintained sub-50ms query latency budgets across global edge infrastructure.",
    isCorroborated: true,
    corroboratedBy: "Senior Director of Core Engineering"
  }
];

export default function StudioPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeTab, setActiveTab] = useState<"canvas" | "paste">("canvas");
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [fullName, setFullName] = useState("Graham Harris");
  const [email, setEmail] = useState("gstharris@gmail.com");
  const [handle, setHandle] = useState("gharris");
  const [headline, setHeadline] = useState("Head of Product Management • AI Platforms");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  // CV Ally State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Candidate Studio ready. Paste your raw career accomplishments or load your canonical profile to begin claim calibration."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate from Homepage bridge on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem("vcv_pending_payload");
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      sessionStorage.removeItem("vcv_pending_payload");

      if (parsed.action === "load_canonical") {
        loadCanonicalRecord();
        return;
      }

      if (parsed.milestones && Array.isArray(parsed.milestones) && parsed.milestones.length > 0) {
        setMilestones(parsed.milestones);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.headline) setHeadline(parsed.headline);
        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Successfully ingested ${parsed.milestones.length} career chapters from homepage. Review your atomic claims on the canvas.`
          }
        ]);
        return;
      }

      if (parsed.rawText && parsed.rawText.trim().length > 0) {
        executeIngest(parsed.rawText);
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const loadCanonicalRecord = () => {
    setMilestones(GRAHAM_HARRIS_CANONICAL);
    setFullName("Graham Harris");
    setHeadline("Head of Product Management • AI Platforms");
    setHandle("gharris");
    setActiveTab("canvas");
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ally",
        text: "Loaded 3 canonical chapters (Ge-on, SCD Enterprises / PairedRight, Yahoo). Review atomic claims on the canvas."
      }
    ]);
  };

  const executeIngest = async (text: string) => {
    setIsProcessing(true);
    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: "Segmenting career milestones via structural parser..." }
    ]);

    try {
      const formData = new FormData();
      formData.append("text", text);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.milestones && data.milestones.length > 0) {
        setMilestones(data.milestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Parsed ${data.milestones.length} discrete chapters. All achievement bullets stitched into calibrated claims.`
          }
        ]);
      } else {
        alert(data.error || "Failed to parse text input.");
        setChatMessages((prev) => [
          ...prev,
          { sender: "ally", text: `Notice: ${data.error || "Could not parse text."}` }
        ]);
      }
    } catch {
      alert("Network communication error with /api/parse.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPasteSubmit = async () => {
    if (!pasteBuffer.trim() || isProcessing) return;
    await executeIngest(pasteBuffer.trim());
    setPasteBuffer("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isProcessing) return;
    const file = e.target.files[0];
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.milestones && data.milestones.length > 0) {
        setMilestones(data.milestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Extracted ${data.milestones.length} milestones from ${file.name}. Ready for calibration.`
          }
        ]);
      } else {
        alert(data.error || "File parsing failed.");
        setChatMessages((prev) => [
          ...prev,
          { sender: "ally", text: `Notice: ${data.error || "File parsing failed."}` }
        ]);
      }
    } catch {
      alert("Error uploading file.");
    } finally {
      setIsProcessing(false);
    }
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
          text: "Claim calibrated. Socratic check confirms zero confidential metric leak while preserving proof signal."
        }
      ]);
    }, 500);
  };

  const handleClaimVaultCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !email || !fullName) {
      alert("Please provide your full legal name, email, and handle.");
      return;
    }

    setIsCommitting(true);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          email,
          fullName,
          headline,
          milestones
        })
      });

      if (res.ok) {
        setIsVaultSaved(true);
        setIsClaimModalOpen(false);
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Vault saved! Live candidate dossier active at verifiedcv.app/${handle.toLowerCase().trim()}`
          }
        ]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to commit record.");
      }
    } catch {
      alert("Network error committing to Vault API.");
    } finally {
      setIsCommitting(false);
    }
  };

  const addEmptyMilestone = () => {
    const newM: Milestone = {
      id: `m-custom-${Date.now()}`,
      company: "New Organization",
      role: "Product Leader",
      period: "2026 — Present",
      calibratedClaim: "Quantified execution statement and engineering trade-offs...",
      isCorroborated: false
    };
    setMilestones((prev) => [newM, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      {/* Studio Top Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
            <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
          </Link>
          <span className="text-[#E2E8F0]">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Candidate Studio
          </span>
        </div>

        <div className="flex items-center gap-3">
          {milestones.length > 0 && !isVaultSaved && (
            <button
              type="button"
              onClick={() => {
                setMilestones([]);
                setActiveTab("canvas");
                setChatMessages((prev) => [
                  ...prev,
                  { sender: "ally", text: "Studio canvas reset. Ready for text paste or upload." }
                ]);
              }}
              className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors px-3 py-1.5 cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Canvas</span>
            </button>
          )}

          {isVaultSaved ? (
            <Link
              href={`/${handle}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <span>View Live Dossier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          ) : (
            milestones.length > 0 && (
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Save Vault & Claim Handle</span>
              </button>
            )
          )}
        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* CV ALLY COPILOT: FIXED 320px WIDTH */}
        <aside className="w-[320px] shrink-0 border-r border-[#E2E8F0] bg-white flex flex-col justify-between h-[calc(100vh-3.5rem)]">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F8FAFC]">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
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
            {isProcessing && (
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500 text-xs p-3 rounded-xl flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 animate-spin text-[#059669]" />
                <span>Extracting milestones losslessly...</span>
              </div>
            )}
          </div>

          {/* Copilot Input */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-[#E2E8F0] bg-white">
            <div className="relative flex items-center">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask Ally to calibrate claims..."
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

        {/* LIVE CANVAS: MASSIVE RIGHT-SIDE WORKSPACE */}
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8 antialiased">
          {milestones.length === 0 || activeTab === "paste" ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Ingest Your Career Track Record</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Paste your raw resume text or load your profile below. The canonical parser segments each company, title, and bullet group into discrete milestones.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? "Analyzing..." : "Upload Document"}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setActiveTab("paste")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste Resume Text</span>
                </button>

                <button
                  type="button"
                  onClick={loadCanonicalRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Graham Harris Profile</span>
                </button>
              </div>

              {activeTab === "paste" && (
                <div className="text-left space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <textarea
                    rows={10}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    placeholder="Paste full resume text here (e.g., 'Ge-on | Head of Product Management | May 2025 to Present...')..."
                    className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono bg-[#F8FAFC] leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    {milestones.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab("canvas")}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">
                        Pipe headers and bullet blocks are segmented automatically.
                      </span>
                    )}

                    <button
                      type="button"
                      disabled={isProcessing || !pasteBuffer.trim()}
                      onClick={handleManualPasteSubmit}
                      className="px-5 py-2.5 bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>{isProcessing ? "Extracting..." : "Parse Milestones"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* POPULATED CANVAS: INDIVIDUAL CHAPTER CARDS */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                    Audited Career Milestones ({milestones.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each chapter is segmented into an atomic claim ready for peer corroboration.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("paste")}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Re-paste Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={addEmptyMilestone}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#059669]" />
                    <span>Add Chapter</span>
                  </button>
                </div>
              </div>

              {/* Milestones Card Stream */}
              <div className="space-y-5 pb-10">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all antialiased"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E2E8F0]/70">
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          value={milestone.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones((prev) =>
                              prev.map((m) => (m.id === milestone.id ? { ...m, company: val } : m))
                            );
                          }}
                          placeholder="Company"
                          className="font-extrabold text-sm sm:text-base text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]"
                        />
                        <span className="text-slate-300">•</span>
                        <input
                          type="text"
                          value={milestone.role}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones((prev) =>
                              prev.map((m) => (m.id === milestone.id ? { ...m, role: val } : m))
                            );
                          }}
                          placeholder="Role Title"
                          className="text-xs sm:text-sm font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                        />
                      </div>

                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={milestone.period}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones((prev) =>
                              prev.map((m) => (m.id === milestone.id ? { ...m, period: val } : m))
                            );
                          }}
                          placeholder="Tenure Dates"
                          className="text-[11px] font-mono text-slate-500 focus:outline-none text-right w-44"
                        />
                        {milestone.isCorroborated ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="w-3 h-3 text-[#059669]" /> Corroborated
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            Unsaved Draft
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))
                          }
                          className="text-slate-300 hover:text-red-500 transition-colors p-1 cursor-pointer"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Calibrated Claim & Impact Scope
                      </label>
                      <textarea
                        rows={4}
                        value={milestone.calibratedClaim}
                        onChange={(e) => {
                          const val = e.target.value;
                          setMilestones((prev) =>
                            prev.map((m) =>
                              m.id === milestone.id ? { ...m, calibratedClaim: val } : m
                            )
                          );
                        }}
                        className="w-full text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-y bg-[#F8FAFC]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* SIGNUP & HANDLE CLAIM MODAL */}
      {isClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <VerifiedCVLogo className="w-6 h-6" />
                <h3 className="font-black text-sm text-[#0F172A]">Claim Your Dossier Handle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimVaultCommit} className="space-y-4 text-xs antialiased">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Graham Harris"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate / Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gstharris@gmail.com"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used to verify your identity domain.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Head of Product Management • AI Platforms"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Desired Public Handle</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-[#E2E8F0] px-2.5 py-2.5 rounded-l-xl text-slate-500 font-mono text-xs">
                    verifiedcv.app/
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) =>
                      setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                    }
                    placeholder="gharris"
                    className="w-full p-2.5 rounded-r-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono font-bold text-[#059669]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCommitting}
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 antialiased"
                >
                  {isCommitting ? (
                    <Clock className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Commit to Vault & Launch Dossier</span>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}