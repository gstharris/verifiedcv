"use client";

import React, { useState, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Building2,
  Users,
  Search,
  AlertTriangle,
  UploadCloud,
  FileCheck,
  ChevronRight,
  Fingerprint,
  Award,
  Clock,
  Layers,
  Check,
  HelpCircle,
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

export default function VerifiedCVLandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"candidate" | "recruiter">("candidate");

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
    // Persist file metadata or hand off to Studio ingestion
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
        "description": "Pre-screened, forensically audited candidate dossiers. Replace self-reported resumes with cryptographic proof signals, peer corroboration, and authenticated career milestones.",
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
        "logo": "https://verifiedcv.app/logo.png",
        "sameAs": ["https://linkedin.com/company/verifiedcv"]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      {/* Structured SEO Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <VerifiedCVLogo className="w-8 h-8 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-xl tracking-tight text-slate-950 leading-none">
                VerifiedCV
              </span>
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mt-0.5">
                Dossier Platform
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-600">
            <a href="#how-it-works" className="hover:text-slate-950 transition-colors">
              Trust Engine
            </a>
            <a href="#tiers" className="hover:text-slate-950 transition-colors">
              The 3 Tiers
            </a>
            <a href="#comparison" className="hover:text-slate-950 transition-colors">
              Recruiter Telemetry
            </a>
            <a href="#faq" className="hover:text-slate-950 transition-colors">
              Protocol FAQ
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group"
            >
              <span>Audit Your CV</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold animate-fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cryptographic Proof for Authentic Career Track Records</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tight leading-[1.08] max-w-4xl mx-auto">
            Stop sending unverified resumes into the automated reject pile.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Automated screening bots reject 75% of qualified applicants because text resumes cannot be proven. 
            VerifiedCV audits, corroborates, and certifies your achievements into a live, hosted dossier recruiters trust instantly.
          </p>

          {/* Ingress Upload Dropzone */}
          <div className="max-w-xl mx-auto pt-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-3xl bg-white transition-all cursor-pointer shadow-sm relative group ${
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50 scale-[1.01]"
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

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                  {isUploading ? (
                    <Clock className="w-6 h-6 animate-spin text-emerald-600" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <span className="font-bold text-sm text-slate-900 block">
                    {isUploading ? "Initializing Cryptographic Vault..." : "Drop your resume PDF or Word doc here"}
                  </span>
                  <span className="text-xs text-slate-500 font-normal">
                    Lossless extraction • Auto-generates your hosted dossier at verifiedcv.app/[handle]
                  </span>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    Browse Files
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-6 mt-4 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" /> AES-256 Vault Encryption
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Zero Career History Truncation
              </span>
              <span className="flex items-center gap-1.5">
                <Fingerprint className="w-3.5 h-3.5 text-slate-400" /> SOC2 Compliant Storage
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Recruiter vs. VerifiedCV Interactive Preview */}
      <section id="comparison" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-700">
              Recruiter Evaluation Telemetry
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-slate-950">
              The difference between the 6-second skim and an immediate executive interview.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* The Unverified Resume (Old Way) */}
            <div className="p-6 rounded-2xl border border-red-200 bg-red-50/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-red-100">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-red-950">
                    Traditional 1-Page PDF
                  </span>
                </div>
                <span className="text-[11px] font-bold text-red-700 bg-red-100/60 px-2 py-0.5 rounded">
                  High Recruiter Skepticism
                </span>
              </div>

              <div className="space-y-3 opacity-75 text-xs text-slate-600">
                <div className="p-3 bg-white rounded-xl border border-red-100 space-y-1.5">
                  <p className="font-bold text-slate-800">
                    "Spearheaded multi-million dollar architecture overhaul that cut server costs by 45%."
                  </p>
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    ✕ Unverifiable claim. Screener flags as exaggerated or self-reported fluff.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-red-100 space-y-1.5">
                  <p className="font-bold text-slate-800">
                    "VP of Product Management, Scaled Platform from $0 to $400M ARR."
                  </p>
                  <p className="text-[11px] text-red-600 flex items-center gap-1">
                    ✕ No peer validation. Stated tenure cannot be distinguished from inflated consultant scope.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-100/40 text-red-900 text-xs font-semibold">
                Result: Subject to aggressive ATS keyword filtering and 75% upfront rejection rate.
              </div>
            </div>

            {/* The VerifiedCV Dossier (Verified Way) */}
            <div className="p-6 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-950">
                    VerifiedCV Hosted Dossier
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Pre-Cleared Ground Truth
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Overhauled platform architecture (-45% egress cost)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Tier 3 Anchored
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    ✓ Grounded via CV Ally Socratic calibration. System trade-offs and latency bottlenecks documented.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">14-Year Personalization Product Leadership</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Tier 2 Certified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    ✓ Corroborated by role-masked peer and corporate domain affiliation checks.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-100/60 text-emerald-950 text-xs font-semibold flex items-center justify-between">
                <span>Result: Pre-cleared by compliance. Fast-tracked straight to hiring managers.</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* The 3 Tiers of Forensic Trust */}
      <section id="tiers" className="py-20 max-w-5xl mx-auto px-6 space-y-12">
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-700">
            Cryptographic Architecture
          </h2>
          <p className="text-3xl font-black text-slate-950">
            The Three Tiers of Forensic Trust
          </p>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            No arbitrary scores. VerifiedCV uses discrete, auditable proof signals anchored in cryptographic identity and peer corroboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tier 1 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Tier 1
              </span>
              <h3 className="text-base font-extrabold text-slate-950 mt-0.5">
                Identity & Entity Confirmed
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Establishes authentic personhood. Cryptographic OAuth UID binding, live mailbox deliverability certification, and telephone carrier SIM matching to eliminate ghost profiles and AI bots.
            </p>
            <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> LinkedIn OAuth UID Binding
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Verified Corporate Mailbox
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> SMS Carrier Match
              </li>
            </ul>
          </div>

          {/* Tier 2 */}
          <div className="p-6 bg-white border border-emerald-200 rounded-2xl shadow-xs space-y-4 relative">
            <div className="absolute top-4 right-4">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                Core Standard
              </span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-widest block">
                Tier 2
              </span>
              <h3 className="text-base font-extrabold text-slate-950 mt-0.5">
                Chapter & Peer Corroborated
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              Confirms tenure and real accomplishments. Role-masked peer attestations protect colleague privacy while validating that you worked together and executed the stated milestones.
            </p>
            <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Role-Masked Colleague Vouching
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> CV Ally Socratic Authorship Audits
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Overlapping Tenure Calibration
              </li>
            </ul>
          </div>

          {/* Tier 3 */}
          <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block">
                Tier 3
              </span>
              <h3 className="text-base font-extrabold text-slate-950 mt-0.5">
                Artifact & Registry Anchored
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-normal">
              The gold standard for executive and high-leverage roles. Links your claims directly to USPTO patents, SEC filings, GitHub commits, or encrypted work proof documents in your Vault.
            </p>
            <ul className="text-xs text-slate-500 space-y-2 border-t border-slate-100 pt-3">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> USPTO Patent & Publication Hashes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> W-2 / Contract Document Hashes
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-600" /> Password-Gated Executive Artifacts
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* How It Works Progression */}
      <section id="how-it-works" className="py-20 bg-slate-100/50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-emerald-700">
              The Ingestion & Verification Workflow
            </h2>
            <p className="text-3xl font-black text-slate-950">
              How VerifiedCV Transforms Your Career History
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
            
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                STEP 01
              </span>
              <h4 className="font-bold text-sm text-slate-900 pt-1">Lossless Resume Ingestion</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Upload any legacy resume. Our engine extracts all chapters without artificial 1-page truncation, breaking achievements into atomic claims.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                STEP 02
              </span>
              <h4 className="font-bold text-sm text-slate-900 pt-1">CV Ally Calibration</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Your dedicated AI copilot questions your achievements Socratically, surfacing operational trade-offs and real metric context.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                STEP 03
              </span>
              <h4 className="font-bold text-sm text-slate-900 pt-1">Role-Masked Attestation</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Invite previous managers or peers to confirm your milestones. Role-masking guarantees complete anonymity while verifying facts.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-2">
              <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                STEP 04
              </span>
              <h4 className="font-bold text-sm text-slate-900 pt-1">Deploy Hosted Dossier</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Publish your certified profile at <code>verifiedcv.app/[handle]</code>. Share with recruiters to fast-track hiring decisions.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* Protocol FAQ */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-emerald-700">
            Frequently Asked Questions
          </h2>
          <p className="text-2xl sm:text-3xl font-black text-slate-950">
            Candidate & Recruiter Protocol Details
          </p>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              How does role-masked peer corroboration protect my colleagues?
            </h3>
            <p className="text-slate-600 leading-relaxed font-normal">
              When a former director, manager, or peer corroborates your milestones, their public identity is masked (e.g. "Senior Engineering Leader, Global Tech"). Their cryptographic attestation token proves they had verified overlapping tenure without exposing them to unsolicited recruiter contact.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Why do recruiters favor a VerifiedCV over traditional resumes?
            </h3>
            <p className="text-slate-600 leading-relaxed font-normal">
              Recruiters and hiring managers spend an average of 4–6 weeks conducting post-offer employment background checks. VerifiedCV brings pre-cleared proof signals to the very top of the hiring funnel, eliminating candidate drop-off and bypassing blind keyword filters.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Can I host sensitive work artifacts like confidential slide decks?
            </h3>
            <p className="text-slate-600 leading-relaxed font-normal">
              Yes. The VerifiedCV Vault supports password-protected and hashed artifacts. Recruiters can view that an artifact is anchored and verified while requiring an explicit candidate-issued password to access the full document.
            </p>
          </div>

        </div>
      </section>

      {/* Call to Action Footer Banner */}
      <section className="py-16 bg-slate-950 text-white text-center">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <VerifiedCVLogo className="w-12 h-12 mx-auto" />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Prove your track record upfront.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Build your cryptographic career dossier in under 5 minutes. Bypassing automated filtering starts with verified truth.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-md cursor-pointer"
            >
              <span>Launch Candidate Studio</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-5 h-5" />
            <span className="font-bold text-slate-900">VerifiedCV</span>
            <span className="text-slate-400">• Forensic Trust Signals for Authentic Careers</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/studio" className="hover:text-slate-950">
              Candidate Studio
            </Link>
            <a href="#tiers" className="hover:text-slate-950">
              Trust Tiers
            </a>
            <a href="#comparison" className="hover:text-slate-950">
              Telemetry
            </a>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>

    </div>
  );
}