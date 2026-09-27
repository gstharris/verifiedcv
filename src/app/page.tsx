"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Users,
  Clock,
  Link2,
  Eye,
  Bot,
  Send,
  BadgeCheck
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

export default function VerifiedCVLandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewPerspective, setViewPerspective] = useState<"candidate" | "recruiter">("candidate");

  const DEMO_NAMES = ["janedoe", "alexchen", "sarahsmith", "mikeross", "davidkim"];
  const [nameIndex, setNameIndex] = useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setNameIndex((prev) => (prev + 1) % DEMO_NAMES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const forwardPayloadToStudio = (data: any) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "vcv_pending_payload",
        JSON.stringify({
          milestones: data.milestones || [],
          fullName: data.fullName || "Graham Harris",
          headline: data.headline || "Head of Product Management • AI Platforms",
          summaryStatement: data.summaryStatement || "",
          skills: data.skills || [],
          education: data.education || []
        })
      );
    }
    router.push("/studio");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("text", chatInput.trim());

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.milestones && data.milestones.length > 0) {
        forwardPayloadToStudio(data);
        return;
      }
    } catch {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "vcv_pending_payload",
          JSON.stringify({ rawText: chatInput.trim() })
        );
      }
      router.push("/studio");
      return;
    } finally {
      setIsProcessing(false);
    }

    router.push("/studio");
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
        forwardPayloadToStudio(data);
        return;
      } else {
        alert(data.error || "Could not parse document. Routing to Candidate Studio.");
      }
    } catch {
      alert("Error uploading file. Routing to Candidate Studio.");
    } finally {
      setIsProcessing(false);
    }

    router.push("/studio");
  };

  const verifiedFacts = [
    {
      id: 0,
      title: "Scaled Ad Personalization Engine from $0 to $400M",
      company: "Yahoo",
      role: "Head of Product Management",
      badgeText: "Peer Corroborated",
      proofDetail:
        "Corroborated by Senior Director of Core Engineering. Overlapping tenure certified via domain OAuth with sub-50ms latency SLAs.",
      hash: "0x8f2d...3a91"
    },
    {
      id: 1,
      title: "Patent Awarded: Distributed Cache Partitioning",
      company: "USPTO Registry",
      role: "Lead Inventor",
      badgeText: "Registry Anchored",
      proofDetail:
        "Direct cryptographic match with USPTO registry. Anchored to candidate Vault ID with public patent verification hash.",
      hash: "0x3c7e...b412"
    },
    {
      id: 2,
      title: "Deployed Context-Grounded RAG Platform Across Operators",
      company: "PairedRight",
      role: "Founder & Head of Product",
      badgeText: "Golden Dataset Verified",
      proofDetail:
        "Calibrated against merchant benchmark parameters to drive $1M+ incremental client revenue with operational regression gates.",
      hash: "0xd911...fe04"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="/">
            <VerifiedCVLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#0F172A] leading-none">
                VerifiedCV
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#why" className="hover:text-slate-950 transition-colors">
              Why VerifiedCV
            </a>
            <a href="#candidates" className="hover:text-slate-950 transition-colors">
              For Candidates
            </a>
            <a href="#recruiters" className="hover:text-slate-950 transition-colors">
              For Recruiters
            </a>
            <a href="#how" className="hover:text-slate-950 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="text-xs font-bold text-slate-700 hover:text-slate-950 px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-block"
              href="/studio"
            >
              Sign In
            </Link>
            <Link
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
              href="/studio"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-14 md:pt-16 md:pb-16 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            Your Living & Verified Portfolio.
          </h1>

          {/* Conversational Ingress Window with Multi-line Safe Textarea */}
          <div className="max-w-xl mx-auto pt-2 text-left">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-4">
              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
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
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4 text-emerald-400" />
                  <span>{isProcessing ? "Processing..." : "Upload Resume (PDF / Word)"}</span>
                </button>
              </div>

              {/* Multi-line Paste Safe Area */}
              <form onSubmit={handleSendMessage} className="relative">
                <textarea
                  rows={3}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Paste complete career text or describe recent achievements (Press Enter to parse)..."
                  className="w-full text-xs pl-3.5 pr-12 py-3 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] font-sans bg-slate-50/50 resize-y"
                />
                <button
                  type="submit"
                  disabled={isProcessing || !chatInput.trim()}
                  className="absolute right-2.5 bottom-3.5 p-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white transition-all cursor-pointer disabled:opacity-40"
                  title="Parse and Open Studio"
                >
                  {isProcessing ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            </div>

            {/* Value Prop & Rotating URL */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-xs font-bold text-slate-600 max-w-md leading-relaxed">
                Creating your validated profile is as easy as uploading a resume and sending an email to your peers to corroborate.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-sm text-xs font-mono text-slate-500">
                <Globe className="w-3.5 h-3.5 text-[#059669]" />
                <span>Own your portfolio: </span>
                <span className="font-bold text-[#0F172A] min-w-[140px] text-left">
                  verifiedcv.app/<span className="text-[#059669] transition-all duration-300">{DEMO_NAMES[nameIndex]}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why VerifiedCV Section */}
      <section id="why" className="py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How VerifiedCV Fits Your Career
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              Complement your LinkedIn profile with verified achievements.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              LinkedIn is for networking and connections. VerifiedCV is the permanent, corroborated proof behind what you built.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">At the Top of Your Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">verifiedcv.app/yourname</code> right under your contact info. Recruiters reading your 1-page PDF get an instant link to inspect your full forensic depth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">The Portfolio for Every Professional</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When applications request a &quot;Portfolio or Website&quot;, product leaders, operators, and technical executives finally have an answer. A living, interactive showcase of what you built.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Validate Once, Keep Permanently</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stop bothering past managers for backchannel reference checks on every single interview process. Colleague attestations remain locked in your dossier forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Perspective Toggle: Candidates vs Recruiters */}
      <section id="candidates" className="py-16 max-w-5xl mx-auto px-6 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              Two Perspectives, One Truth
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">
              Engineered for candidates. Trusted by hiring teams.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 border border-[#E2E8F0] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewPerspective("candidate")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewPerspective === "candidate"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Studio View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective("recruiter")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewPerspective === "recruiter"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#059669]" />
              <span>Recruiter View</span>
            </button>
          </div>
        </div>

        {viewPerspective === "candidate" ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400">Candidate Studio /</span>
                <span className="font-bold text-[#0F172A]">Career Vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-500">Auto-saved to Vault API</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">CV Ally Copilot</h4>
                    <span className="text-[9px] text-slate-400 block">Socratic Claim Calibrator</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-100 text-xs space-y-2.5 shadow-2xs">
                  <p className="text-slate-800 font-medium text-[11px] leading-relaxed">
                    &quot;In your Yahoo chapter, you mention scaling personalization to 400M users. What were the specific sub-50ms query budget trade-offs?&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#059669] font-bold text-[9px] rounded border border-emerald-200">
                      Socratic Check
                    </span>
                    <span className="text-[9px] text-slate-400">Zero confidential metrics leaked</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1.5 pt-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px]">
                    Vault Ground Truth
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <Check className="w-3 h-3" /> Un-truncated career chapters preserved
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3 h-3 text-slate-400" /> Cryptographic peer vouchers active
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0F172A]">Active Career Milestone</h4>
                    <p className="text-[10px] text-slate-500">Chapter: Yahoo (2010 — 2024)</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Peer Corroborated
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/70 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800">
                    Calibrated Claim
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-[#E2E8F0]">
                    Built ad personalization and enterprise platforms from $0 to $400M with full P&L ownership, 3 patents, and an 18-person global team across 8 countries. Maintained sub-50ms query latency budgets across global edge infrastructure.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Send Peer Voucher Link
                  </Link>
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Lock in Vault
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F172A] text-sm">Graham Harris</span>
                <span className="text-[11px] font-mono text-slate-400">verifiedcv.app/gharris</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                <BadgeCheck className="w-3 h-3 text-[#059669]" /> Verified Candidate Dossier
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {verifiedFacts.map((fact) => (
                <div key={fact.id} className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{fact.company}</span>
                    <span className="text-[10px] font-bold text-emerald-700">{fact.badgeText}</span>
                  </div>
                  <h4 className="font-bold text-[#0F172A] text-xs leading-snug">{fact.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{fact.proofDetail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-16 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How It Works
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              Three steps from messy resume to forensic dossier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                01
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Lossless Career Ingestion</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paste your full work history or drop your document. Our ingestion pipeline parses every leadership era, startup initiative, and title without 1-page truncation.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                02
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Socratic Claim Calibration</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                CV Ally guides you through structuring your achievements into testable statements. Define scale, latency, and business trade-offs with zero NDA risk.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                03
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Vault Anchored Dossier</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Commit to your permanent Vault record. Claim your handle to publish a live, tamper-evident dossier ready for recruiters to inspect upfront.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiter Trust Layer */}
      <section id="recruiters" className="py-16 max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 space-y-6">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
              For Executive Recruiters & Hiring Managers
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
              Bypass 3 weeks of backchannel reference checking.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When a candidate attaches their VerifiedCV link, their accomplishments have already been audited against employment overlaps, peer vouchers, and registry records.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 font-black text-lg">0 days</span>
              <p className="text-xs text-slate-300">Instant verification at first screening</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 font-black text-lg">100%</span>
              <p className="text-xs text-slate-300">Candidate-controlled forensic proof signals</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
              <span className="text-emerald-400 font-black text-lg">1-Click</span>
              <p className="text-xs text-slate-300">Recruiter inspection of verified achievements</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-white border-t border-[#E2E8F0] text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Ready to prove your career track record upfront?
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Open the studio, map your accomplishments, and publish your verified dossier in minutes.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-xs cursor-pointer group"
            >
              <span>Get Started in Candidate Studio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• The Permanent Career Proof Layer</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <Link className="hover:text-slate-950 transition-colors" href="/">
              Home
            </Link>
            <Link className="hover:text-slate-950 transition-colors" href="/studio">
              Candidate Studio
            </Link>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}