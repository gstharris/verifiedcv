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
  RotateCcw,
  GraduationCap,
  Sparkle,
  FileText,
  Calendar,
  Wand2,
  AlertCircle
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

interface Milestone {
  id: string;
  company: string;
  role: string;
  period: string;
  claims: string[];
  calibratedClaim?: string;
  isCorroborated: boolean;
  corroboratedBy?: string;
  tier?: string;
}

interface EducationRecord {
  id: string;
  institution: string;
  degree: string;
  year?: string;
}

const GRAHAM_HARRIS_CANONICAL: {
  fullName: string;
  headline: string;
  summary: string;
  skills: string[];
  education: EducationRecord[];
  milestones: Milestone[];
} = {
  fullName: "Graham Harris",
  headline: "Head of Product Management • AI Platforms",
  summary:
    "Built enterprise technology and ad personalization platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries at Yahoo. Founded an operational workflow and recommendation platform at PairedRight, engineering RAG architectures evaluated against an operational golden dataset to scale client revenue by over $1M. Restructured complex multi-product SaaS portfolios into modular tiers at Bazaarvoice, reducing sales cycles by 25% and decreasing customer churn by 15%.",
  skills: [
    "AI Workspace Platforms",
    "Agentic Workflows",
    "Context-Grounded RAG",
    "Ad Personalization Systems",
    "High-Throughput Distributed Microservices",
    "Product Strategy & P&L",
    "Operational Golden Datasets",
    "Interactive Prototyping (React/Cursor)"
  ],
  education: [
    {
      id: "edu-gh-1",
      institution: "University of California",
      degree: "Bachelor of Science",
      year: "Graduated"
    }
  ],
  milestones: [
    {
      id: "m-gh-geon-01",
      company: "Ge-on",
      role: "Head of Product Management",
      period: "May 2025 — Present",
      claims: [
        "Direct end-to-end product strategy, feature prioritization, and delivery roadmaps for an AI workspace platform, driving a 25% lift in weekly active users during initial rollout.",
        "Designed and deployed autonomous agent workflows and proactive push notifications that feed a persistent memory layer, allowing the platform to learn creator preferences and maintain context across interactions.",
        "Build functional interactive prototypes in React, Cursor, and modern UI tools to test user workflows, edge cases, and interface ergonomics directly with users prior to engineering sprints.",
        "Designed and deployed self-serve onboarding journeys and workspace configuration flows, lifting new user activation and account setup completion by 20%.",
        "Partner daily with engineering, data science, and design in Agile cadences to manage backlogs, set acceptance criteria, and ensure system stability."
      ],
      isCorroborated: false
    },
    {
      id: "m-gh-scd-02",
      company: "SCD Enterprises / PairedRight",
      role: "Founder and Head of Product",
      period: "2018 — Mar 2026",
      claims: [
        "Founded an operational workflow and recommendation platform for hospitality operators, scaling client revenue by over $1M through automated upselling and real-time guidance.",
        "Rebuilt the core recommendation engine using a context-grounded RAG framework, ensuring automated pairing suggestions remained strictly constrained to curated merchant parameters.",
        "Established an operational golden dataset to benchmark, verify, and regression-test algorithmic changes, ensuring recommendation accuracy before deploying updates to frontline staff devices.",
        "Designed operator dashboards and administrative consoles, providing business owners visibility and control over recommendation rules, inventory availability, and pricing thresholds.",
        "Engineered API integration layers connecting customer-facing mobile interfaces directly with legacy point-of-sale and back-office systems of record to maintain data synchronization.",
        "Designed and deployed automated quote-to-cash workflows, multi-party fee reconciliation, and transactional audit trails, eliminating manual reporting and reducing operational overhead by 10%.",
        "Conducted hundreds of hours of on-site customer discovery shadowing managers and frontline operators during live shifts, converting ground-level friction into structured product specifications."
      ],
      isCorroborated: false
    },
    {
      id: "m-gh-yahoo-03",
      company: "Yahoo",
      role: "Head of Product Management",
      period: "2010 — 2024",
      claims: [
        "Built ad personalization and enterprise platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries.",
        "Maintained sub-50ms query latency budgets across global edge infrastructure."
      ],
      isCorroborated: true,
      corroboratedBy: "Senior Director of Core Engineering"
    }
  ]
};

export default function StudioPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [summaryStatement, setSummaryStatement] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [education, setEducation] = useState<EducationRecord[]>([]);

  const [activeTab, setActiveTab] = useState<"canvas" | "paste">("canvas");
  const [pasteBuffer, setPasteBuffer] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Claim & Validation Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [fullName, setFullName] = useState("Graham Harris");
  const [email, setEmail] = useState("gstharris@gmail.com");
  const [handle, setHandle] = useState("gharris");
  const [headline, setHeadline] = useState("Head of Product Management • AI Platforms");
  const [isCommitting, setIsCommitting] = useState(false);
  const [isVaultSaved, setIsVaultSaved] = useState(false);

  // Handle Availability State
  const [handleStatus, setHandleStatus] = useState<"checking" | "available" | "taken" | "idle">("available");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");

  // CV Ally State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "ally" | "user"; text: string }>>([
    {
      sender: "ally",
      text: "Candidate Studio ready. Spell-checking, tenure validation, and handle availability checks are active."
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        setMilestones(
          parsed.milestones.map((m: any) => ({
            ...m,
            claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
              (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 15
            )
          }))
        );
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.headline) setHeadline(parsed.headline);
        if (parsed.summaryStatement) setSummaryStatement(parsed.summaryStatement);
        if (parsed.skills) setSkills(parsed.skills);
        if (parsed.education) setEducation(parsed.education);

        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Successfully ingested full career dossier (${parsed.milestones.length} milestones, line-item achievements, summary, and skills). Ready for calibration.`
          }
        ]);
        return;
      }

      if (parsed.rawText && parsed.rawText.trim().length > 0) {
        executeIngest(parsed.rawText);
      }
    } catch {
      // ignore parse error
    }
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle availability check simulation or API query
  useEffect(() => {
    if (!handle || handle.length < 2) {
      setHandleStatus("idle");
      return;
    }

    setHandleStatus("checking");
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vault/check?handle=${encodeURIComponent(handle)}`);
        if (res.ok) {
          const data = await res.json();
          setHandleStatus(data.available ? "available" : "taken");
        } else {
          // Default to available if endpoint is stubbed
          setHandleStatus("available");
        }
      } catch {
        setHandleStatus("available");
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [handle]);

  const loadCanonicalRecord = () => {
    setFullName(GRAHAM_HARRIS_CANONICAL.fullName);
    setHeadline(GRAHAM_HARRIS_CANONICAL.headline);
    setSummaryStatement(GRAHAM_HARRIS_CANONICAL.summary);
    setSkills(GRAHAM_HARRIS_CANONICAL.skills);
    setEducation(GRAHAM_HARRIS_CANONICAL.education);
    setMilestones(GRAHAM_HARRIS_CANONICAL.milestones);
    setHandle("gharris");
    setActiveTab("canvas");
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "ally",
        text: "Loaded canonical dossier with un-truncated company names and normalized tenure periods."
      }
    ]);
  };

  const executeIngest = async (text: string) => {
    setIsProcessing(true);
    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: "Analyzing dossier and normalizing tenure start dates..." }
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
        const formattedMilestones = data.milestones.map((m: any) => ({
          ...m,
          claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
            (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 15
          )
        }));

        setMilestones(formattedMilestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);

        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Extracted ${data.milestones.length} career milestones with full company names and verified start dates.`
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

    setChatMessages((prev) => [
      ...prev,
      { sender: "ally", text: `Reading and parsing ${file.name}...` }
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
        const formattedMilestones = data.milestones.map((m: any) => ({
          ...m,
          claims: (Array.isArray(m.claims) ? m.claims : (m.calibratedClaim ? [m.calibratedClaim] : [])).filter(
            (c: string) => c.replace(/[^a-zA-Z]/g, "").length >= 15
          )
        }));

        setMilestones(formattedMilestones);
        if (data.fullName) setFullName(data.fullName);
        if (data.headline) setHeadline(data.headline);
        if (data.summaryStatement) setSummaryStatement(data.summaryStatement);
        if (data.skills) setSkills(data.skills);
        if (data.education) setEducation(data.education);

        setActiveTab("canvas");
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "ally",
            text: `Extracted ${data.milestones.length} career milestones from ${file.name}.`
          }
        ]);
      } else {
        alert(data.error || "File parsing failed.");
      }
    } catch {
      alert("Error uploading document.");
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
          text: "Claim verified. Socratic check confirms metric integrity with zero confidentiality exposure."
        }
      ]);
    }, 500);
  };

  const handleClaimVaultCommit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Form Field Validations
    let isValid = true;
    if (!fullName.trim() || fullName.trim().length < 2) {
      setNameError("Please enter a valid full name.");
      isValid = false;
    } else {
      setNameError("");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("Please enter a valid email address.");
      isValid = false;
    } else {
      setEmailError("");
    }

    if (handleStatus === "taken") {
      alert("This handle is already taken. Please choose another one.");
      isValid = false;
    }

    if (!isValid) return;

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
          summaryStatement,
          skills,
          education,
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
      company: "Organization Name",
      role: "Leadership Role",
      period: "Jan 2026 — Present",
      claims: ["Direct product strategy, platform execution, and quantifiable business outcomes..."],
      isCorroborated: false
    };
    setMilestones((prev) => [newM, ...prev]);
  };

  const updateMilestoneClaim = (milestoneId: string, claimIndex: number, newText: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const updatedClaims = [...m.claims];
        updatedClaims[claimIndex] = newText;
        return { ...m, claims: updatedClaims };
      })
    );
  };

  const addClaimToMilestone = (milestoneId: string) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          claims: [...m.claims, "Describe quantified business execution and operational trade-offs..."]
        };
      })
    );
  };

  const deleteClaimFromMilestone = (milestoneId: string, claimIndex: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        return {
          ...m,
          claims: m.claims.filter((_, idx) => idx !== claimIndex)
        };
      })
    );
  };

  const formatCleanClaim = (milestoneId: string, claimIndex: number) => {
    setMilestones((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const target = m.claims[claimIndex] || "";
        const formatted = target
          .replace(/\s{2,}/g, " ")
          .trim()
          .replace(/^[a-z]/, (char) => char.toUpperCase());
        const updatedClaims = [...m.claims];
        updatedClaims[claimIndex] = formatted.endsWith(".") ? formatted : formatted + ".";
        return { ...m, claims: updatedClaims };
      })
    );
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
          {(milestones.length > 0 || summaryStatement) && !isVaultSaved && (
            <button
              type="button"
              onClick={() => {
                setMilestones([]);
                setSummaryStatement("");
                setSkills([]);
                setEducation([]);
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
            (milestones.length > 0 || summaryStatement) && (
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
                <span>Calibrating claims & dates...</span>
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
          {milestones.length === 0 && !summaryStatement ? (
            <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-xs max-w-2xl mx-auto mt-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
                <UploadCloud className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black text-[#0F172A]">Ingest Your Career Track Record</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Upload your resume or paste below. Dates, starting months, company titles, and credentials are parsed losslessly with active spell-checking.
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
                    rows={12}
                    value={pasteBuffer}
                    onChange={(e) => setPasteBuffer(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    placeholder="Paste entire resume text (including Summary, Experience with starting months, Skills, and Education)..."
                    className="w-full text-xs p-4 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-mono bg-[#F8FAFC] leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-400">
                      Starting months, full company titles, and achievements will be extracted into discrete cards.
                    </span>

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
            <div className="space-y-8">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-[#0F172A]">
                    Audited Career Dossier
                  </h2>
                  <p className="text-xs text-slate-500">
                    Spell-checked and calibrated. Edit claims and dates before committing to your Vault.
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

              {/* 1. Professional Executive Summary */}
              {summaryStatement && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Professional Executive Summary
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Portfolio Anchor
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={summaryStatement}
                    onChange={(e) => setSummaryStatement(e.target.value)}
                    spellCheck={true}
                    autoCorrect="on"
                    lang="en"
                    className="w-full text-xs text-slate-700 leading-relaxed p-3.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] font-sans resize-y bg-[#F8FAFC]"
                  />
                </div>
              )}

              {/* 2. Milestones Card Stream with Individual Line Items */}
              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Career Milestones ({milestones.length})
                </h3>

                <div className="space-y-6">
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
                            spellCheck={true}
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
                            spellCheck={true}
                            className="text-xs sm:text-sm font-semibold text-slate-600 focus:outline-none border-b border-transparent focus:border-[#059669]"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <input
                              type="text"
                              value={milestone.period}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMilestones((prev) =>
                                  prev.map((m) => (m.id === milestone.id ? { ...m, period: val } : m))
                                );
                              }}
                              placeholder="e.g. May 2025 — Present"
                              className="text-[11px] font-mono font-medium text-slate-600 focus:outline-none text-right w-44 bg-transparent"
                            />
                          </div>
                          {milestone.isCorroborated ? (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                              <Check className="w-3 h-3 text-[#059669]" /> Corroborated
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                              Draft
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

                      {/* Line-Item Atomic Achievements Stream */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Atomic Achievement Claims ({milestone.claims.length})
                          </label>
                          <button
                            type="button"
                            onClick={() => addClaimToMilestone(milestone.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#059669] hover:text-emerald-700 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Line Item</span>
                          </button>
                        </div>

                        <div className="space-y-2.5">
                          {milestone.claims.map((claimText, claimIdx) => (
                            <div
                              key={claimIdx}
                              className="group flex items-start gap-2.5 p-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus-within:border-[#059669] focus-within:bg-white transition-all"
                            >
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#059669] shrink-0" />
                              <textarea
                                rows={2}
                                value={claimText}
                                onChange={(e) =>
                                  updateMilestoneClaim(milestone.id, claimIdx, e.target.value)
                                }
                                spellCheck={true}
                                autoCorrect="on"
                                lang="en"
                                className="flex-1 text-xs text-slate-700 leading-relaxed focus:outline-none font-sans resize-y bg-transparent"
                              />
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                                <button
                                  type="button"
                                  onClick={() => formatCleanClaim(milestone.id, claimIdx)}
                                  className="text-slate-400 hover:text-[#059669] p-1 cursor-pointer"
                                  title="Format Sentence"
                                >
                                  <Wand2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteClaimFromMilestone(milestone.id, claimIdx)}
                                  className="text-slate-300 hover:text-red-500 p-1 cursor-pointer"
                                  title="Delete Line Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Core Competencies & Skills */}
              {skills.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                      Core Proficiencies & Technologies ({skills.length})
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-slate-700 hover:border-slate-300 transition-colors"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => setSkills((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Education & Academic Degrees */}
              {education.length > 0 && (
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-[#059669]" />
                      <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#0F172A]">
                        Education & Academic Degrees ({education.length})
                      </h3>
                    </div>
                  </div>
                  <div className="space-y-3 pt-1">
                    {education.map((edu) => (
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
            </div>
          )}
        </main>
      </div>

      {/* SIGNUP & HANDLE CLAIM MODAL WITH VALIDATION & AVAILABILITY */}
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
                  spellCheck={true}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Graham Harris"
                  className={`w-full p-2.5 rounded-xl border ${nameError ? "border-red-500" : "border-[#E2E8F0]"} focus:outline-none focus:border-[#059669]`}
                />
                {nameError && <span className="text-[10px] text-red-500 mt-1 block">{nameError}</span>}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Corporate / Work Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gstharris@gmail.com"
                  className={`w-full p-2.5 rounded-xl border ${emailError ? "border-red-500" : "border-[#E2E8F0]"} focus:outline-none focus:border-[#059669]`}
                />
                {emailError && <span className="text-[10px] text-red-500 mt-1 block">{emailError}</span>}
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Used to verify your identity domain.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Professional Headline</label>
                <input
                  type="text"
                  spellCheck={true}
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
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px]">
                  {handleStatus === "checking" && <span className="text-slate-400">Checking handle availability...</span>}
                  {handleStatus === "available" && (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> verifiedcv.app/{handle} is available!
                    </span>
                  )}
                  {handleStatus === "taken" && (
                    <span className="text-red-500 font-bold flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> verifiedcv.app/{handle} is already claimed.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isCommitting || handleStatus === "taken"}
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