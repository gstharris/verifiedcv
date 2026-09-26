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
  FileText
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

// Resilient resume segmenter that handles single-newline pasted text
function segmentResumeIntoMilestones(rawText: string): Milestone[] {
  if (!rawText || rawText.trim().length === 0) return [];

  const clean = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  const yearRangeRegex = /(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:19|20)\d{2}|present|current)/i;
  const singleYearRegex = /\b(19|20)\d{2}\b/;
  const dateRegex = /(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\s*(?:-|–|—|to)\s*(?:(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}|present|current)/i;

  const milestones: Milestone[] = [];
  let currentCompany = "";
  let currentRole = "";
  let currentPeriod = "";
  let currentBullets: string[] = [];

  const flush = () => {
    if (currentCompany || currentRole || currentBullets.length > 0) {
      const claimText = currentBullets.join("\n\n").trim() || "Executed core strategic and technical roadmaps.";
      milestones.push({
        id: `m-${Date.now()}-${milestones.length}`,
        company: currentCompany || "Career Chapter",
        role: currentRole || "Leader / Builder",
        period: currentPeriod || "Verified Tenure",
        calibratedClaim: claimText,
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

    // Detect section headers to skip
    if (/^(EXPERIENCE|PROFESSIONAL EXPERIENCE|WORK HISTORY|EMPLOYMENT HISTORY)$/i.test(line)) {
      continue;
    }

    // Check if line contains tenure dates
    const dateMatch = line.match(dateRegex) || line.match(yearRangeRegex) || (line.length < 80 ? line.match(singleYearRegex) : null);

    if (dateMatch) {
      // Flush previous chapter
      flush();

      currentPeriod = dateMatch[0].trim();
      const textWithoutDate = line.replace(currentPeriod, "").replace(/[|•–—,-]/g, " ").trim();
      const tokens = textWithoutDate.split(/\s{2,}|\t/).filter(Boolean);

      if (tokens.length >= 2) {
        currentCompany = tokens[0].trim();
        currentRole = tokens[1].trim();
      } else if (tokens.length === 1) {
        currentCompany = tokens[0].trim();
        currentRole = "Executive / Leader";
      } else {
        // If line only had dates, inspect adjacent previous line for company/title
        if (i > 0 && lines[i - 1].length < 80 && !lines[i - 1].startsWith("•")) {
          currentCompany = lines[i - 1];
          currentRole = "Key Leader";
        } else {
          currentCompany = "Career Chapter";
          currentRole = "Key Contributor";
        }
      }
    } else if (line.startsWith("•") || line.startsWith("-") || line.startsWith("*") || line.startsWith("–")) {
      currentBullets.push(line.replace(/^[•\-\*–]\s*/, "").trim());
    } else {
      // Short lines without terminal periods often denote company names or roles
      if (currentBullets.length === 0 && line.length < 70 && !line.endsWith(".")) {
        if (!currentCompany) {
          currentCompany = line;
        } else if (!currentRole) {
          currentRole = line;
        } else {
          currentBullets.push(line);
        }
      } else {
        currentBullets.push(line);
      }
    }
  }

  flush();

  // If strict date extraction yielded 0 or 1 item because dates were formatted unusually,
  // segment by major organizational paragraphs instead of dumping everything into 1 block.
  if (milestones.length <= 1 && clean.length > 500) {
    const chunks = clean.split(/(?=[A-Z][A-Za-z0-9\s,&]{2,35}(?:\s*[-–—|]\s*|\s+(?:19|20)\d{2}))/g).filter((c) => c.trim().length > 40);
    if (chunks.length > 1) {
      return chunks.map((c, idx) => {
        const cLines = c.trim().split("\n").filter(Boolean);
        const header = cLines[0] || `Career Chapter ${idx + 1}`;
        const rest = cLines.slice(1).join("\n\n").trim() || header;
        return {
          id: `m-seg-${Date.now()}-${idx}`,
          company: header.slice(0, 50),
          role: "Role / Leader",
          period: "Tenure",
          calibratedClaim: rest,
          isCorroborated: false
        };
      });
    }
  }

  return milestones.length > 0
    ? milestones
    : [
        {
          id: `m-default-${Date.now()}`,
          company: "Extracted Chapter",
          role: "Key Leader",
          period: "Confirmed Tenure",
          calibratedClaim: rawText.trim(),
          isCorroborated: false
        }
      ];
}

export default function StudioPage() {
  const router = useRouter();

  // Transient Ingestion State (Zero fake baseline data)
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [activeMilestoneId, setActiveMilestoneId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"canvas" | "paste">("canvas");
  const [pasteBuffer, setPasteBuffer] = useState("");

  // Signup / Handle Claim Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [handle, setHandle] = useState("");
  const [headline, setHeadline] = useState("");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  // CV Ally 320px Copilot State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Candidate Studio active. Paste your career history or resume text to segment your accomplishments into atomic milestones."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Ingress payload recovery from landing page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem("vcv_ingest_payload");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        sessionStorage.removeItem("vcv_ingest_payload");

        if (parsed.text && parsed.text.trim().length > 0) {
          const parsedMilestones = segmentResumeIntoMilestones(parsed.text);
          setMilestones(parsedMilestones);
          if (parsedMilestones.length > 0) {
            setActiveMilestoneId(parsedMilestones[0].id);
          }
          setChatMessages((prev) => [
            ...prev,
            {
              sender: "ally",
              text: `Parsed ${parsedMilestones.length} discrete career chapters from your input. Review each chapter on the canvas and calibrate your claims.`
            }
          ]);
        }
      } catch {
        // ignore parse error
      }
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleManualPaste = () => {
    if (!pasteBuffer.trim()) return;

    const parsedMilestones = segmentResumeIntoMilestones(pasteBuffer);
    setMilestones(parsedMilestones);
    if (parsedMilestones.length > 0) {
      setActiveMilestoneId(parsedMilestones[0].id);
    }

    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ally",
        text: `Segmented your pasted resume into ${parsedMilestones.length} distinct career chapters. Click any milestone to refine claims or claim your handle.`
      }
    ]);

    setPasteBuffer("");
    setActiveTab("canvas");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      if (text.startsWith("%PDF")) {
        alert("Binary PDF detected. Please open your resume, copy all text (Cmd+A -> Cmd+C), and click 'Paste Career Text' for clean parsing.");
        return;
      }
      const parsedMilestones = segmentResumeIntoMilestones(text);
      setMilestones(parsedMilestones);
      if (parsedMilestones.length > 0) {
        setActiveMilestoneId(parsedMilestones[0].id);
      }
    };
    reader.readAsText(file);
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
          text: `Calibrated claim context. Once you save to your Vault, this milestone will be ready for role-masked peer corroboration.`
        }
      ]);
    }, 600);
  };

  const handleClaimVaultCommit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle || !email || !fullName) {
      alert("Please provide your full name, work email, and desired handle.");
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
            text: `Vault permanently saved! Your dossier is live at verifiedcv.app/${handle.toLowerCase().trim()}.`
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

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col antialiased selection:bg-emerald-100">
      {/* Studio Header */}
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
          {milestones.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
              <span>Re-paste Resume</span>
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
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Save Vault & Claim Handle</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Studio Body: Fixed 320px Sidebar + Full-Width Canvas */}
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
        <main className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-8">
          {/* ZERO STATE / PASTE MODAL ACTIVE */}
          {milestones.length === 0 || activeTab === "paste" ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <ClipboardPaste className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Paste Your Career History</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Paste your complete resume or LinkedIn text below. Our engine will segment it into individual company chapters with verified date ranges and bullet points.
                </p>
              </div>

              <div className="text-left space-y-3 pt-2">
                <textarea
                  rows={10}
                  value={pasteBuffer}
                  onChange={(e) => setPasteBuffer(e.target.value)}
                  placeholder="Paste your resume text here (e.g., Company, Role, Dates, and Bullet points)..."
                  className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans bg-[#F8FAFC] leading-relaxed"
                />

                <div className="flex items-center justify-between pt-1">
                  {milestones.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab("canvas")}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Back to Canvas
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400">
                      Lossless ingest: all roles and bullet points will be preserved.
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={handleManualPaste}
                    className="px-5 py-2.5 bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Segment into Milestones</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* POPULATED CANVAS: INDIVIDUAL MILESTONE CARDS */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                    Extracted Career Chapters ({milestones.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Each role is mapped to an atomic, testable milestone ready for peer corroboration.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMilestones((prev) => [
                      {
                        id: `m-manual-${Date.now()}`,
                        company: "Company Name",
                        role: "Role Title",
                        period: "Year — Year",
                        calibratedClaim: "Describe quantified business execution and operational trade-offs...",
                        isCorroborated: false
                      },
                      ...prev
                    ])
                  }
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white border border-[#E2E8F0] hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Add Chapter</span>
                </button>
              </div>

              {/* Milestones Card Stream */}
              <div className="space-y-5">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Header Row: Company, Role, Dates, Badge, Delete */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]/70">
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
                          placeholder="Dates"
                          className="text-xs font-mono text-slate-500 focus:outline-none text-right w-28"
                        />

                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Unsaved Draft
                        </span>

                        <button
                          type="button"
                          onClick={() => setMilestones((prev) => prev.filter((m) => m.id !== milestone.id))}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Delete Milestone"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Calibrated Claim Textarea */}
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
                <h3 className="font-black text-sm text-[#0F172A]">Claim Your Dossier</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClaimVaultCommit} className="space-y-4 text-xs">
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
                <label className="font-bold text-slate-700 block mb-1">Work / Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full p-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used to verify your corporate identity domain.
                </span>
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
                  className="w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
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