"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FileText,
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

// Canonical Graham Harris baseline dataset for zero-friction testing
const GRAHAM_HARRIS_CANONICAL: Milestone[] = [
  {
    id: "m-gh-yahoo-01",
    company: "Yahoo",
    role: "Head of Product Management",
    period: "2010 — 2024",
    calibratedClaim:
      "Scaled multi-tenant personalization platform serving 400M+ global monthly active users under sub-50ms latency budgets. Supervised 35+ engineers and data scientists across multi-region edge caching infrastructure.",
    isCorroborated: true,
    corroboratedBy: "Senior Director of Core Engineering"
  },
  {
    id: "m-gh-pat-02",
    company: "USPTO Registry",
    role: "Lead Inventor",
    period: "2021",
    calibratedClaim:
      "Authored and awarded Patent US-98214-B2: Distributed Cache Partitioning Algorithm across high-throughput distributed microservices.",
    isCorroborated: true,
    corroboratedBy: "USPTO Patent Registry"
  },
  {
    id: "m-gh-geon-03",
    company: "Ge-On",
    role: "Head of Product Management",
    period: "2024 — 2025",
    calibratedClaim:
      "Architected foundational product specifications and developer telemetry for seed-stage social creator platform, aligning tokenomics and creator retention mechanisms.",
    isCorroborated: false
  },
  {
    id: "m-gh-pr-04",
    company: "PairedRight",
    role: "Founder",
    period: "2023 — Present",
    calibratedClaim:
      "Founded PairedRight, a self-funded hospitality intelligence startup delivering automated recommendation algorithms for dining and beverage experiences.",
    isCorroborated: false
  },
  {
    id: "m-gh-dk-05",
    company: "Decker Kitchen",
    role: "Managing Operator",
    period: "2018 — 2023",
    calibratedClaim:
      "Managed corporate operations, financial structures, and hospitality logistics for acclaimed dining establishment through successful multi-year operation.",
    isCorroborated: false
  }
];

export default function StudioPage() {
  const router = useRouter();

  // Ingestion State (Zero ghost data)
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeTab, setActiveTab] = useState<"canvas" | "paste">("canvas");
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Signup / Handle Claim Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [fullName, setFullName] = useState("Graham Harris");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("gharris");
  const [headline, setHeadline] = useState("Product Leader • Personalization & AI Platforms");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  // CV Ally Copilot State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Welcome to Candidate Studio. Paste your career history or upload a resume to extract verified milestones."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate from incoming parsed payload
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (sessionStorage.getItem("vcv_load_canonical") === "true") {
      sessionStorage.removeItem("vcv_load_canonical");
      loadCanonicalRecord();
      return;
    }

    const parsedStored = sessionStorage.getItem("vcv_parsed_milestones");
    if (parsedStored) {
      try {
        const ms = JSON.parse(parsedStored);
        sessionStorage.removeItem("vcv_parsed_milestones");
        if (Array.isArray(ms) && ms.length > 0) {
          setMilestones(ms);
          const nameStored = sessionStorage.getItem("vcv_parsed_name");
          const headlineStored = sessionStorage.getItem("vcv_parsed_headline");
          if (nameStored) setFullName(nameStored);
          if (headlineStored) setHeadline(headlineStored);
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ally",
              text: `Extracted ${ms.length} career milestones losslessly. Review and calibrate each chapter below.`
            }
          ]);
          return;
        }
      } catch {
        // ignore parse error
      }
    }

    const rawPaste = sessionStorage.getItem("vcv_raw_paste");
    if (rawPaste) {
      sessionStorage.removeItem("vcv_raw_paste");
      triggerTextIngress(rawPaste);
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
    setHandle("gharris");
    setHeadline("Product Leader • Personalization & High-Scale AI Platforms");
    setActiveTab("canvas");
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ally",
        text: "Loaded Graham Harris authentic career track record (5 milestones across Yahoo, USPTO Patent, Ge-On, PairedRight, and Decker Kitchen). Ready to calibrate and claim handle."
      }
    ]);
  };

  const triggerTextIngress = async (text: string) => {
    setIsProcessing(true);
    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: "Analyzing career track record through parsing engine..." }
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
            text: `Extracted ${data.milestones.length} career milestones losslessly (${data.engine || "parsed"}). Review and calibrate claims on your canvas.`
          }
        ]);
      } else {
        alert(data.error || "Failed to extract career milestones.");
        setChatMessages((prev) => [
          ...prev,
          { sender: "ally", text: `Notice: ${data.error || "Could not segment milestones."}` }
        ]);
      }
    } catch {
      alert("Network error communicating with parsing engine.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPasteSubmit = async () => {
    if (!pasteBuffer.trim() || isProcessing) return;
    await triggerTextIngress(pasteBuffer.trim());
    setPasteBuffer("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isProcessing) return;
    const file = e.target.files[0];
    setIsProcessing(true);

    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: `Reading and extracting text from ${file.name}...` }
    ]);

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
            text: `Extracted ${data.milestones.length} milestones from ${file.name} (${data.engine || "parsed"}). All career chapters mapped to your canvas.`
          }
        ]);
      } else {
        alert(data.error || "Failed to parse document.");
        setChatMessages((prev) => [
          ...prev,
          { sender: "ally", text: `Notice: ${data.error || "Could not parse document."}` }
        ]);
      }
    } catch {
      alert("Network error uploading file.");
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
          text: `Calibrated metric boundaries. Once you commit to your Vault, this milestone will be ready for role-masked peer corroboration.`
        }
      ]);
    }, 600);
  };

  const handleClaimVaultCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !email || !fullName) {
      alert("Please provide your full name, corporate email, and desired handle.");
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
          headline: headline || "Product & Technical Leader",
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
            text: `Vault permanently saved! Your dossier is now live at verifiedcv.app/${handle.toLowerCase().trim()}.`
          }
        ]);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to commit Vault record.");
      }
    } catch {
      alert("Error committing to Vault. Please try again.");
    } finally {
      setIsCommitting(false);
    }
  };

  const addEmptyMilestone = () => {
    const newId = `m-manual-${Date.now()}`;
    const newM: Milestone = {
      id: newId,
      company: "Company or Initiative",
      role: "Role Title",
      period: "Year — Present",
      calibratedClaim: "Describe quantified business execution and operational trade-offs...",
      isCorroborated: false
    };
    setMilestones((prev) => [newM, ...prev]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      
      {/* Studio Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link className="flex items-center gap-2 group" href="/">
            <VerifiedCVLogo className="w-6 h-6 group-hover:scale-105 transition-transform" />
            <span className="font-black text-base text-[#0F172A] tracking-tight">VerifiedCV</span>
          </Link>
          <span className="text-[#E2E8F0]">/</span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Candidate Studio</span>
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
                  { sender: "ally", text: "Studio canvas cleared. Ready for a new upload or paste." }
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all shadow-2xs cursor-pointer"
              href={`/${handle}`}
              target="_blank"
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

      {/* Main Studio Body */}
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

        {/* LIVE CANVAS */}
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8 antialiased">
          
          {/* ZERO STATE OR PASTE MODE ACTIVE */}
          {milestones.length === 0 || activeTab === "paste" ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Ingest Your Career History</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Upload your resume file directly (PDF, Word, TXT) or paste your career experience below to map your history into atomic, testable milestones.
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
                  <span>{isProcessing ? "Analyzing..." : "Upload Resume (PDF / Word)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setActiveTab("paste")}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste Career Text</span>
                </button>

                {/* Instant Baseline Record Loader */}
                <button
                  type="button"
                  onClick={loadCanonicalRecord}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Load Graham Harris Record</span>
                </button>
              </div>

              {activeTab === "paste" && (
                <div className="text-left space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <textarea
                    rows={8}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    placeholder="Paste your full resume or career history text here..."
                    className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans bg-[#F8FAFC] leading-relaxed"
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
                        Multi-chapter segmentation preserves all tenure and accomplishments.
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
            /* POPULATED CANVAS */
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                    Audited Career Milestones ({milestones.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each chapter is segmented into an atomic, testable claim ready for peer corroboration.
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
                          className="text-[11px] font-mono text-slate-500 focus:outline-none text-right w-36"
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
                          onClick={() => setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))}
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
                            prev.map((m) => (m.id === milestone.id ? { ...m, calibratedClaim: val } : m))
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
                  placeholder="name@company.com"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Used to verify your identity domain.</span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Product Leader • AI Platforms"
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
                    onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
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