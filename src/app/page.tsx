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
  Sparkles,
  Users,
  Clock,
  Link2,
  Eye,
  Bot,
  ClipboardPaste,
  Share2
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
  
  // Intake Console State
  const [intakeTab, setIntakeTab] = useState<"upload" | "paste" | "linkedin">("upload");
  const [pasteContent, setPasteContent] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Platform Preview State
  const [previewMode, setPreviewMode] = useState<"recruiter" | "candidate">("recruiter");
  const [selectedFact, setSelectedFact] = useState<number>(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processIngress();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processIngress();
    }
  };

  const processIngress = () => {
    setIsProcessing(true);
    setTimeout(() => {
      router.push("/studio");
    }, 600);
  };

  const verifiedFacts = [
    {
      id: 0,
      title: "Scaled Personalization Engine to 400M+ Monthly Users",
      company: "Yahoo",
      role: "Head of Product Management",
      badgeText: "Peer Corroborated",
      proofType: "Role-Masked Attestation",
      proofDetail: "Corroborated by Senior Director of Core Engineering. Overlapping tenure (2014-2022) certified via corporate OAuth.",
      hash: "0x8f2d...3a91"
    },
    {
      id: 1,
      title: "Patent Issued: Distributed Cache Partitioning Algorithm",
      company: "USPTO Registry",
      role: "Lead Inventor",
      badgeText: "Registry Anchored",
      proofType: "Patent US-98214-B2",
      proofDetail: "Direct cryptographic match with USPTO registry. Anchored to candidate Vault ID with public patent verification hash.",
      hash: "0x3c7e...b412"
    },
    {
      id: 2,
      title: "Led Multi-Region Egress Cost Reduction (-45%)",
      company: "Infrastructure Overhaul",
      role: "Executive Lead",
      badgeText: "Calibrated Context",
      proofType: "Socratic Audit Brief",
      proofDetail: "Calibrated via CV Ally: documents caching constraints, query budgets, and latency trade-offs without NDA leakage.",
      hash: "0xd911...fe04"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#0F172A] leading-none">
                VerifiedCV
              </span>
              <span className="text-[9px] font-bold text-[#059669] uppercase tracking-widest mt-0.5">
                Living Portfolio
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-xs font-bold text-slate-600">
            <a href="#preview" className="hover:text-slate-950 transition-colors">
              Live Preview
            </a>
            <a href="#why" className="hover:text-slate-950 transition-colors">
              Why VerifiedCV
            </a>
            <a href="#candidates" className="hover:text-slate-950 transition-colors">
              For Candidates
            </a>
            <a href="#recruiters" className="hover:text-slate-950 transition-colors">
              For Recruiters
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/studio"
              className="text-xs font-bold text-slate-700 hover:text-slate-950 px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Condensed & Tightened) */}
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>The Permanent Proof Layer for Authentic Careers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            In a world of AI-generated resumes, <br className="hidden sm:inline" />
            <span className="text-[#059669]">prove your track record is real.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            The living career portfolio where achievements, licenses, and milestones are corroborated once and permanently trusted. Complements your resume and LinkedIn to cut straight through the noise.
          </p>

          {/* Compact Multi-Modal Intake Console */}
          <div className="max-w-xl mx-auto pt-2 text-left">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              
              {/* Tab Selector */}
              <div className="flex items-center border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
                <button
                  type="button"
                  onClick={() => setIntakeTab("upload")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intakeTab === "upload"
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <UploadCloud className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntakeTab("paste")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intakeTab === "paste"
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Paste Text</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIntakeTab("linkedin")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intakeTab === "linkedin"
                      ? "bg-white text-[#0F172A] shadow-xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sync LinkedIn</span>
                </button>
              </div>

              {/* Tab Content Panels */}
              <div className="p-5">
                {intakeTab === "upload" && (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#059669] bg-emerald-50/50"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669]">
                        {isProcessing ? (
                          <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                          <UploadCloud className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#0F172A] block">
                          {isProcessing ? "Ingesting career record..." : "Drop PDF or Word document here"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Lossless milestone extraction • Generates verifiedcv.app/[handle]
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {intakeTab === "paste" && (
                  <div className="space-y-3">
                    <textarea
                      rows={3}
                      value={pasteContent}
                      onChange={(e) => setPasteContent(e.target.value)}
                      placeholder="Paste your resume text, bio, or career achievements here..."
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] resize-none font-sans"
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400">
                        CV Ally will convert your raw text into calibrated milestones.
                      </span>
                      <button
                        type="button"
                        onClick={processIngress}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Ingest & Audit
                      </button>
                    </div>
                  </div>
                )}

                {intakeTab === "linkedin" && (
                  <div className="p-4 text-center space-y-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
                      <LinkedInIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#0F172A]">Import Public Profile & Tenures</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-0.5">
                        Pulls verified company titles and dates into your vault as uncorroborated drafts ready for peer vouching.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={processIngress}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      <LinkedInIcon className="w-3.5 h-3.5" />
                      <span>Connect Profile</span>
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Placement Strip (Inline & Tight) */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#059669]" /> Place on Top of Your 1-Page Resume
              </span>
              <span className="flex items-center gap-1.5">
                <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" /> Link from LinkedIn Featured
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#059669]" /> Submit as Portfolio URL
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Interactive Platform Preview Showcase */}
      <section id="preview" className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              Live Experience Preview
            </h2>
            <p className="text-2xl font-black text-[#0F172A]">
              See VerifiedCV from both sides of the hiring table.
            </p>
            <p className="text-xs text-slate-500">
              Toggle between the public recruiter verification view and the candidate editing studio.
            </p>
          </div>

          {/* Perspective Switcher Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewMode("recruiter")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "recruiter"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-[#059669]" />
                <span>Recruiter View (verifiedcv.app/gharris)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("candidate")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "candidate"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Candidate Studio View</span>
              </button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          {previewMode === "recruiter" ? (
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 text-sm shadow-2xs">
                    GH
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-[#0F172A]">Graham Harris</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Verified Identity
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Product Leader • Personalization & High-Scale ML Platforms
                    </p>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      verifiedcv.app/gharris
                    </div>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-xl bg-white border border-slate-200 text-right self-start sm:self-auto">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Vault Status</span>
                  <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> 3 Anchored Proofs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 space-y-2.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Corroborated Milestones (Click to Inspect Evidence)
                  </span>

                  {verifiedFacts.map((fact) => {
                    const isSelected = selectedFact === fact.id;
                    return (
                      <div
                        key={fact.id}
                        onClick={() => setSelectedFact(fact.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left space-y-1.5 ${
                          isSelected
                            ? "bg-white border-[#059669] shadow-xs ring-1 ring-emerald-500/20"
                            : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              {fact.company} • {fact.role}
                            </span>
                            <h4 className="text-xs font-bold text-[#0F172A]">
                              {fact.title}
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#059669]" />
                            {fact.badgeText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Evidence Receipt
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      Hash: {verifiedFacts[selectedFact].hash}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Verification Protocol</span>
                      <span className="font-extrabold text-slate-900 text-xs">
                        {verifiedFacts[selectedFact].proofType}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-lg space-y-1">
                      <span className="text-[9px] font-bold text-emerald-900 uppercase tracking-wider block">Corroboration Details</span>
                      <p className="text-emerald-950 text-[11px] leading-relaxed">
                        {verifiedFacts[selectedFact].proofDetail}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1 text-[10px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Colleague Privacy:</span>
                        <span className="font-bold text-slate-700">Role-Masked</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tenure Verified:</span>
                        <span className="font-bold text-slate-700">Overlapping 8+ Yrs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tamper Proof:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Cryptographically Anchored
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">Workspace /</span>
                  <span className="font-bold text-slate-900">Career Studio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-semibold text-slate-500">Auto-saved to Vault API</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                
                {/* CV Ally Copilot */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CV Ally Copilot</h4>
                      <span className="text-[9px] text-slate-400 block">Socratic Calibration</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs space-y-2">
                    <p className="text-indigo-950 font-medium text-[11px] leading-relaxed">
                      &quot;In your Yahoo chapter, you mention scaling personalization to 400M users. What were the specific sub-50ms latency constraints you solved?&quot;
                    </p>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-2 py-0.5 bg-white text-indigo-700 font-bold text-[9px] rounded border border-indigo-200 shadow-2xs">
                        Calibrate Metric
                      </button>
                      <button type="button" className="text-[9px] text-slate-500">
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                    <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px]">Status</span>
                    <div className="flex items-center gap-1 text-emerald-700 font-medium">
                      <Check className="w-3 h-3" /> 12 Milestones extracted losslessly
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <Users className="w-3 h-3 text-slate-400" /> 2 Peer vouchers pending
                    </div>
                  </div>
                </div>

                {/* Live Canvas */}
                <div className="md:col-span-8 bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-xs text-[#0F172A]">Active Career Milestone</h4>
                      <p className="text-[10px] text-slate-500">Chapter: Yahoo (2010 — 2024)</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                      Corroboration Active
                    </span>
                  </div>

                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-800">
                      Claim Statement
                    </div>
                    <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2 rounded border border-slate-200">
                      Architected multi-tenant personalization pipeline supporting 400M+ global users with sub-50ms query budgets. Reduced cloud egress cost by 45% through regional caching.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Users className="w-3 h-3" /> Request Peer Voucher
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                    >
                      <Lock className="w-3 h-3 text-slate-500" /> Attach Private Artifact
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </section>

      {/* Where VerifiedCV Fits */}
      <section id="why" className="py-14 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How VerifiedCV Fits Your Workflow
            </h2>
            <p className="text-2xl font-black text-[#0F172A]">
              We don&apos;t replace LinkedIn. We give it ground truth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">At the Top of Your Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">verifiedcv.app/yourname</code> right under your contact info. Recruiters reading your 1-page PDF get an instant, authenticated link to inspect your corroboration and depth.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">The Portfolio for Every Professional</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When application forms ask for a &quot;Portfolio or Website&quot;, product leaders, operators, and executives finally have an answer. A living showcase of what you built, without needing a GitHub repo.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Validate Once, Keep Permanently</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stop bothering past managers and colleagues for reference checks on every single late-stage interview. Colleague attestations are verified once and remain locked in your dossier forever.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* For Candidates Section */}
      <section id="candidates" className="py-14 max-w-5xl mx-auto px-6 space-y-8">
        <div className="text-center space-y-1.5 max-w-2xl mx-auto">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
            For Authentic Candidates
          </h2>
          <p className="text-2xl font-black text-[#0F172A]">
            Own your career history without 1-page constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#059669]" /> Complete, Lossless Ledger
            </h4>
            <p className="text-xs text-slate-500">
              Never delete career-defining early achievements to fit arbitrary resume page limits. Your vault holds your entire history.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#059669]" /> Licenses & Accreditations
            </h4>
            <p className="text-xs text-slate-500">
              Centralize professional certifications, state licenses, patents, and corporate awards in one tamper-evident profile.
            </p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
            <h4 className="font-bold text-xs text-[#0F172A] flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-[#059669]" /> CV Ally Claim Calibration
            </h4>
            <p className="text-xs text-slate-500">
              Our AI copilot helps you articulate real operational trade-offs, metrics, and technical constraints so your claims hold up.
            </p>
          </div>
        </div>
      </section>

      {/* For Recruiters Section */}
      <section id="recruiters" className="py-14 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              For Recruiters & Hiring Managers
            </h2>
            <p className="text-2xl font-black text-[#0F172A]">
              Instant signal over synthetic resume noise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Pre-Validated Accomplishments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See which chapters and accomplishments have been verified by coworkers who actually worked with the candidate, before scheduling the first phone screen.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Zero Reference Check Bottlenecks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip the 3-week phone tag game at the offer stage. Corroborations and peer vouchers are permanently on record, speeding up hiring decisions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Deep Work Context</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect architecture briefs, patents, and work artifacts attached directly to milestones, giving interviewers rich, authentic talking points.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-12 bg-[#0F172A] text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-4">
          <VerifiedCVLogo className="w-10 h-10 mx-auto" />
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Stop blending into the AI resume pile.
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Build your living career portfolio in minutes. Own your verified track record permanently.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
            >
              <span>Launch Studio & Claim Your Handle</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• The Permanent Career Proof Layer</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <Link href="/studio" className="hover:text-slate-950">
              Candidate Studio
            </Link>
            <a href="#preview" className="hover:text-slate-950">
              Live Preview
            </a>
            <a href="#why" className="hover:text-slate-950">
              Why VerifiedCV
            </a>
            <a href="#candidates" className="hover:text-slate-950">
              For Candidates
            </a>
            <a href="#recruiters" className="hover:text-slate-950">
              For Recruiters
            </a>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>

    </div>
  );
}