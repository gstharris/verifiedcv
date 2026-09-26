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
  Hash
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
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Interactive Live Preview State
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
      processResumeUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processResumeUpload(e.target.files[0]);
    }
  };

  const processResumeUpload = (file: File) => {
    setIsUploading(true);
    setTimeout(() => {
      router.push("/studio");
    }, 800);
  };

  const schemaJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "VerifiedCV",
        "operatingSystem": "All",
        "applicationCategory": "BusinessApplication",
        "url": "https://verifiedcv.app",
        "description": "The living career portfolio and permanent proof layer. Corroborate achievements, licenses, and milestones once and stand out from AI-generated resume noise.",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD"
        }
      },
      {
        "@type": "Organization",
        "name": "VerifiedCV",
        "url": "https://verifiedcv.app",
        "logo": "https://verifiedcv.app/logo.png"
      }
    ]
  };

  const verifiedFacts = [
    {
      id: 0,
      title: "Scaled Personalization Engine to 400M+ Monthly Users",
      company: "Yahoo",
      role: "Head of Product Management",
      badgeText: "Peer Corroborated",
      proofType: "Role-Masked Attestation",
      proofDetail: "Corroborated by Senior Director of Core Engineering. Overlapping tenure (2014-2022) cryptographically certified via corporate OAuth.",
      hash: "0x8f2d...3a91",
      tag: "Live Architecture"
    },
    {
      id: 1,
      title: "Patent Issued: Distributed Cache Partitioning Algorithm",
      company: "USPTO Registry",
      role: "Lead Inventor",
      badgeText: "Registry Anchored",
      proofType: "Patent US-98214-B2",
      proofDetail: "Direct cryptographic match with USPTO registry. Anchored to candidate Vault ID with public patent verification hash.",
      hash: "0x3c7e...b412",
      tag: "Intellectual Property"
    },
    {
      id: 2,
      title: "Led Multi-Region Egress Cost Reduction (-45%)",
      company: "Infrastructure Overhaul",
      role: "Executive Lead",
      badgeText: "Calibrated Context",
      proofType: "Socratic Audit Brief",
      proofDetail: "Calibrated via CV Ally audit: documents real caching constraints, egress trade-offs, and fallback telemetry without NDA leakage.",
      hash: "0xd911...fe04",
      tag: "Technical Depth"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      {/* Structured SEO Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <VerifiedCVLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-[#0F172A] leading-none">
                VerifiedCV
              </span>
              <span className="text-[10px] font-bold text-[#059669] uppercase tracking-widest mt-0.5">
                Living Portfolio
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#preview" className="hover:text-slate-950 transition-colors">
              Platform Preview
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
              className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-2 rounded-xl transition-colors hidden sm:inline-block"
            >
              Sign In
            </Link>
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <span>Claim Your Handle</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>The Permanent Proof Layer for Authentic Careers</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-[#0F172A] tracking-tight leading-[1.08] max-w-4xl mx-auto">
            In a world of AI-generated resumes, prove your track record is real.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            The living career portfolio where your milestones, licenses, and achievements are corroborated once and trusted forever. Add your verified slug to your resume header and LinkedIn to cut straight through the noise.
          </p>

          {/* Ingress Upload Dropzone */}
          <div className="max-w-xl mx-auto pt-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-7 border-2 border-dashed rounded-3xl bg-white transition-all cursor-pointer shadow-sm relative group ${
                isDragging
                  ? "border-[#059669] bg-emerald-50/50 scale-[1.01]"
                  : "border-slate-300 hover:border-slate-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileInput}
              />

              <div className="flex flex-col items-center justify-center space-y-2.5">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <Clock className="w-5 h-5 animate-spin text-[#059669]" />
                  ) : (
                    <UploadCloud className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <span className="font-bold text-sm text-[#0F172A] block">
                    {isUploading ? "Initializing Career Vault..." : "Import your existing resume to start"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    Converts unverified text into living milestones • Generates your verifiedcv.app/[handle]
                  </span>
                </div>

                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Select File
                  </span>
                </div>
              </div>
            </div>

            {/* Practical Placement Strip */}
            <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-semibold text-slate-500">
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

      {/* NEW: Interactive Platform Preview Showcase */}
      <section id="preview" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              Live Experience Preview
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              See VerifiedCV from both sides of the hiring table.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Toggle between the public recruiter verification view and the candidate editing studio.
            </p>
          </div>

          {/* Perspective Switcher Tabs */}
          <div className="flex items-center justify-center">
            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-2xl">
              <button
                type="button"
                onClick={() => setPreviewMode("recruiter")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "recruiter"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Eye className="w-4 h-4 text-[#059669]" />
                <span>Recruiter View (verifiedcv.app/gharris)</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode("candidate")}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  previewMode === "candidate"
                    ? "bg-white text-[#0F172A] shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Candidate Studio View</span>
              </button>
            </div>
          </div>

          {/* PREVIEW CONTAINER */}
          {previewMode === "recruiter" ? (
            /* Recruiter View: Public Dossier & Fact Inspector */
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-slate-900 text-base shadow-2xs">
                    GH
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black text-[#0F172A]">Graham Harris</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> Verified Identity
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">
                      Product Leader • Personalization & High-Scale ML Platforms
                    </p>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      verifiedcv.app/gharris
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vault Status</span>
                    <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> 3 Anchored Proofs
                    </span>
                  </div>
                </div>
              </div>

              {/* Verified Facts Interactive Row */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left 7 Cols: Clickable Verified Milestones */}
                <div className="lg:col-span-7 space-y-3">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Corroborated Milestones (Click to Inspect Evidence)
                  </span>

                  {verifiedFacts.map((fact) => {
                    const isSelected = selectedFact === fact.id;
                    return (
                      <div
                        key={fact.id}
                        onClick={() => setSelectedFact(fact.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left space-y-2 ${
                          isSelected
                            ? "bg-white border-[#059669] shadow-sm ring-2 ring-emerald-500/20"
                            : "bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {fact.company} • {fact.role}
                            </span>
                            <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5">
                              {fact.title}
                            </h4>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded shrink-0">
                            <Check className="w-3 h-3 text-[#059669]" />
                            {fact.badgeText}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right 5 Cols: Ground Truth Evidence Drawer */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-black uppercase tracking-widest text-[#059669] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Evidence Receipt
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Hash: {verifiedFacts[selectedFact].hash}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Verification Protocol</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {verifiedFacts[selectedFact].proofType}
                      </span>
                    </div>

                    <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">Corroboration Details</span>
                      <p className="text-emerald-950 text-xs leading-relaxed">
                        {verifiedFacts[selectedFact].proofDetail}
                      </p>
                    </div>

                    <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Colleague Privacy:</span>
                        <span className="font-bold text-slate-700">Role-Masked (No Spam)</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tenure Verified:</span>
                        <span className="font-bold text-slate-700">Overlapping 8+ Yrs</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Tamper Proof:</span>
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Cryptographically Anchored
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 block text-center">
                      Recruiters verify authentic impact without waiting on reference phone tag.
                    </span>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* Candidate Studio View: Copilot & Live Canvas */
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">Workspace /</span>
                  <span className="font-bold text-slate-900">Career Studio & Vault</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-slate-500">Auto-saved to Vault API</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* CV Ally Copilot: Fixed Width Look (4 Cols in preview) */}
                <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5 shadow-2xs">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">CV Ally Copilot</h4>
                      <span className="text-[10px] text-slate-400 block">Socratic Calibration</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs space-y-2">
                    <p className="text-indigo-950 font-medium text-[11px] leading-relaxed">
                      &quot;In your Yahoo chapter, you mention scaling personalization to 400M users. What were the specific sub-50ms latency constraints you solved?&quot;
                    </p>
                    <div className="flex items-center gap-2">
                      <button type="button" className="px-2.5 py-1 bg-white text-indigo-700 font-bold text-[10px] rounded-lg border border-indigo-200 shadow-2xs hover:bg-indigo-50">
                        Calibrate Metric
                      </button>
                      <button type="button" className="text-[10px] text-slate-500 hover:text-slate-800">
                        Dismiss
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1.5 pt-1">
                    <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider block">Studio Actions</span>
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="w-3.5 h-3.5" /> 12 Milestones extracted losslessly
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> 2 Peer vouchers pending
                    </div>
                  </div>
                </div>

                {/* Live Canvas (8 Cols in preview) */}
                <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0F172A]">Active Career Milestone</h4>
                      <p className="text-[11px] text-slate-500">Editing Chapter: Yahoo (2010 — 2024)</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      Corroboration Active
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="text-xs font-bold text-slate-800">
                      Claim Statement
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-normal bg-white p-2.5 rounded-lg border border-slate-200">
                      Architected multi-tenant personalization pipeline supporting 400M+ global users with sub-50ms query budgets. Reduced cloud egress cost by 45% through regional caching.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" /> Request Peer Voucher Link
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-500" /> Attach Private Artifact
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </section>

      {/* Where VerifiedCV Fits (Complement to LinkedIn & Applications) */}
      <section id="why" className="py-16 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How VerifiedCV Fits Your Workflow
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              We don&apos;t replace LinkedIn. We give it ground truth.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              LinkedIn is for networking and connections. VerifiedCV is your audited body of work.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <FileText className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">At the Top of Your Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">verifiedcv.app/yourname</code> right under your contact info. Recruiters reading your 1-page PDF get an instant, authenticated link to inspect your corroboration and depth.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">The Portfolio for Every Professional</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When application forms ask for a &quot;Portfolio or Website&quot;, product leaders, operators, and executives finally have an answer. A living showcase of what you built, without needing a GitHub repo.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-800">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
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
      <section id="candidates" className="py-20 max-w-5xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
            For Authentic Candidates
          </h2>
          <p className="text-3xl font-black text-[#0F172A]">
            Own your career history without 1-page constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669]" /> Complete, Lossless Career Ledger
              </h4>
              <p className="text-slate-500">
                Never delete career-defining early achievements to fit arbitrary resume page limits. Your vault holds your entire history.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669]" /> Licenses, Patents & Accreditations
              </h4>
              <p className="text-slate-500">
                Centralize professional certifications, state licenses, patents, and corporate awards in one tamper-evident profile.
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
              <h4 className="font-bold text-[#0F172A] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#059669]" /> CV Ally Claim Calibration
              </h4>
              <p className="text-slate-500">
                Our lightweight AI copilot helps you articulate real operational trade-offs, metrics, and technical constraints so your claims hold up to recruiter scrutiny.
              </p>
            </div>
          </div>

          {/* Dossier Mock Badge Summary */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-800 text-sm">
                  GH
                </div>
                <div>
                  <div className="font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                    <span>Graham Harris</span>
                    <CheckCircle2 className="w-4 h-4 text-[#059669] fill-emerald-50" />
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    verifiedcv.app/gharris
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Verified Track Record
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">Head of Product Management • Yahoo</span>
                <span className="text-[11px] font-mono text-slate-400">14 Years</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Scaled personalization platform serving 400M+ users. Led 35+ engineers and data scientists across multi-region infrastructure.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] font-semibold text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <Check className="w-3 h-3 text-[#059669]" /> Corroborated by Colleague
                </span>
                <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  Patent Anchored
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Recruiters Section */}
      <section id="recruiters" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              For Recruiters & Hiring Managers
            </h2>
            <p className="text-3xl font-black text-[#0F172A]">
              Instant signal over synthetic resume noise.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              When every applicant submits an AI-polished resume, VerifiedCV shows you the proven facts behind the candidate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Pre-Validated Accomplishments</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                See which chapters and accomplishments have been verified by coworkers who actually worked with the candidate, before scheduling the first phone screen.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Zero Reference Check Bottlenecks</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Skip the 3-week phone tag game at the offer stage. Corroborations and peer vouchers are permanently on record, speeding up hiring decisions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F172A]">Deep Work Context</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Inspect architecture briefs, patents, and work artifacts attached directly to milestones, giving interviewers rich, authentic talking points.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-16 bg-[#0F172A] text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <VerifiedCVLogo className="w-12 h-12 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Stop blending into the AI resume pile.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Build your living career portfolio in minutes. Own your verified track record permanently.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#059669] hover:bg-emerald-500 text-white font-extrabold text-sm transition-all shadow-md cursor-pointer"
            >
              <span>Launch Studio & Claim Your Handle</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-5 h-5" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• The Permanent Career Proof Layer</span>
          </div>

          <div className="flex items-center gap-6">
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