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
  X
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
      text: "Welcome to your Candidate Studio. Paste your career history or upload a resume to extract atomic milestones and calibrate claims."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read transient memory from homepage ingress
  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = sessionStorage.getItem("vcv_ingest_payload");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        sessionStorage.removeItem("vcv_ingest_payload"); // Consume immediately

        if (parsed.text && parsed.text.trim().length > 0) {
          parseRawTextIntoDrafts(parsed.text, parsed.source || "upload");
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

  const parseRawTextIntoDrafts = (raw: string, source: string) => {
    // Split on double linebreaks or bullet structures
    const chunks = raw
      .split(/\n\s*\n/)
      .map((c) => c.trim())
      .filter((c) => c.length > 20);

    if (chunks.length > 0) {
      const generated: Milestone[] = chunks.map((chunk, idx) => {
        const firstLine = chunk.split("\n")[0] || "";
        const remaining = chunk.substring(firstLine.length).trim() || chunk;

        return {
          id: `m-draft-${Date.now()}-${idx}`,
          company: firstLine.length < 50 ? firstLine.replace(/[|•–—,-]/g, " ").trim() : "Career Chapter",
          role: "Role / Leader",
          period: "Confirmed Tenure",
          calibratedClaim: remaining,
          isCorroborated: false
        };
      });

      setMilestones(generated);
      setActiveMilestoneId(generated[0].id);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "ally",
          text: `Parsed ${generated.length} draft milestones from ${source}. Click any card to edit claims or claim your handle to anchor them.`
        }
      ]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      if (text.startsWith("%PDF")) {
        alert("For clean parsing without binary artifacts, please use 'Paste Text' to input your resume content directly.");
        return;
      }
      parseRawTextIntoDrafts(text, file.name);
    };
    reader.readAsText(file);
  };

  const handleManualPaste = () => {
    if (!pasteBuffer.trim()) return;
    parseRawTextIntoDrafts(pasteBuffer, "manual paste");
    setPasteBuffer("");
    setActiveTab("canvas");
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
            text: `Vault created! Your dossier is now live at verifiedcv.app/${handle.toLowerCase().trim()}.`
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
          
          {/* ZERO STATE: If no milestones exist yet */}
          {milestones.length === 0 ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Your Vault is Currently Empty</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Drop your resume file or paste your career accomplishments. CV Ally will parse them into testable, un-truncated milestones.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>Upload Resume (.txt / .md)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("paste")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste Career Text</span>
                </button>
              </div>

              {/* Direct In-Canvas Paste Form */}
              {activeTab === "paste" && (
                <div className="pt-4 text-left space-y-3 border-t border-[#E2E8F0]">
                  <textarea
                    rows={6}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    placeholder="Paste your career experience, accomplishments, or resume text directly here..."
                    className="w-full text-xs p-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-none bg-[#F8FAFC]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("canvas")}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleManualPaste}
                      className="px-4 py-1.5 bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Parse Milestones
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* POPULATED CANVAS WITH EXTRACTED DRAFTS */
            <div className="space-y-6">
              
              <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                    Draft Milestones ({milestones.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Extracted from your source material. Unsaved until you claim your handle.
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
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div
                    key={milestone.id}
                    className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-3 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0]/70">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={milestone.company}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMilestones((prev) =>
                              prev.map((m) => (m.id === milestone.id ? { ...m, company: val } : m))
                            );
                          }}
                          className="font-extrabold text-sm text-[#0F172A] focus:outline-none border-b border-transparent focus:border-[#059669]"
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
                          className="text-xs font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Draft (Unsaved)
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

                    <textarea
                      rows={3}
                      value={milestone.calibratedClaim}
                      onChange={(e) => {
                        const val = e.target.value;
                        setMilestones((prev) =>
                          prev.map((m) => (m.id === milestone.id ? { ...m, calibratedClaim: val } : m))
                        );
                      }}
                      className="w-full text-xs text-slate-700 leading-relaxed p-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-none bg-[#F8FAFC]"
                    />
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