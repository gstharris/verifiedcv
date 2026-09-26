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
  ClipboardPaste,
  Send
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";

function LinkedInIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg">
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
      if (res.ok && data.milestones) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem("vcv_parsed_milestones", JSON.stringify(data.milestones));
          if (data.fullName) sessionStorage.setItem("vcv_parsed_name", data.fullName);
          if (data.headline) sessionStorage.setItem("vcv_parsed_headline", data.headline);
        }
        router.push("/studio");
        return;
      }
    } catch {
      // Fallback: pass raw text if API fails
      if (typeof window !== "undefined") {
        sessionStorage.setItem("vcv_raw_paste", chatInput.trim());
      }
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
        if (typeof window !== "undefined") {
          sessionStorage.setItem("vcv_parsed_milestones", JSON.stringify(data.milestones));
          if (data.fullName) sessionStorage.setItem("vcv_parsed_name", data.fullName);
          if (data.headline) sessionStorage.setItem("vcv_parsed_headline", data.headline);
        }
        router.push("/studio");
        return;
      } else {
        alert(data.error || "Could not parse file. Navigating to Studio.");
      }
    } catch {
      alert("Network error parsing file.");
    } finally {
      setIsProcessing(false);
    }

    router.push("/studio");
  };

  const handleLinkedInImport = () => {
    setIsProcessing(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("vcv_load_canonical", "true");
    }
    router.push("/studio");
  };

  const verifiedFacts = [
    {
      id: 0,
      title: "Scaled Personalization Engine to 400M+ Monthly Users",
      company: "Yahoo",
      role: "Head of Product Management",
      badgeText: "Peer Corroborated",
      proofDetail: "Corroborated by Senior Director of Core Engineering. Overlapping tenure (2014-2022) certified via corporate OAuth.",
      hash: "0x8f2d...3a91"
    },
    {
      id: 1,
      title: "Patent Issued: Distributed Cache Partitioning Algorithm",
      company: "USPTO Registry",
      role: "Lead Inventor",
      badgeText: "Registry Anchored",
      proofDetail: "Direct cryptographic match with USPTO registry. Anchored to candidate Vault ID with public patent verification hash.",
      hash: "0x3c7e...b412"
    },
    {
      id: 2,
      title: "Led Multi-Region Egress Cost Reduction (-45%)",
      company: "Infrastructure Overhaul",
      role: "Executive Lead",
      badgeText: "Calibrated Context",
      proofDetail: "Calibrated via CV Ally: documents caching constraints, query budgets, and latency trade-offs without NDA leakage.",
      hash: "0xd911...fe04"
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      {/* Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link className="flex items-center gap-2 group" href="/">
            <VerifiedCVLogo className="w-7 h-7 group-hover:scale-105 transition-transform"/>
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
            <a href="#candidates" className="hover:text-slate-950 transition-colors">
              For Candidates
            </a>
            <a href="#recruiters" className="hover:text-slate-950 transition-colors">
              For Recruiters
            </a>
            <a href="#why" className="hover:text-slate-950 transition-colors">
              Why VerifiedCV
            </a>
            <a href="#how" className="hover:text-slate-950 transition-colors">
              How It Works
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link className="text-xs font-bold text-slate-700 hover:text-slate-950 px-2.5 py-1.5 rounded-lg transition-colors hidden sm:inline-block" href="/studio">
              Sign In
            </Link>
            <Link className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer group" href="/studio">
              <span>Open Studio</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-emerald-400"/>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            The living portfolio for verified careers.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A living career portfolio corroborated by peers, managers, and more, and anchored with real proof. Complements your resume and LinkedIn.
          </p>

          {/* CV Ally Conversational Ingress Window */}
          <div className="max-w-xl mx-auto pt-4 text-left">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 shrink-0 mt-0.5">
                  <Bot className="w-4 h-4"/>
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0F172A] block mb-0.5">CV Ally Career Copilot</span>
                  Drop your resume file or paste your career accomplishments. I will extract your milestones cleanly into your Candidate Studio.
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#059669] text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5"/>
                  <span>{isProcessing ? "Processing..." : "Upload Resume (PDF / Word)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleLinkedInImport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <LinkedInIcon className="w-3.5 h-3.5"/>
                  <span>Import Career Profile</span>
                </button>
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Paste career accomplishments or describe your recent leadership..."
                  className="w-full text-xs pl-3.5 pr-10 py-2.5 rounded-xl border border-[#E2E8F0] focus:outline-none focus:border-[#059669] focus:ring-1 focus:ring-[#059669] font-sans bg-slate-50/50"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="absolute right-1.5 p-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Clock className="w-3.5 h-3.5 animate-spin"/>
                  ) : (
                    <Send className="w-3.5 h-3.5"/>
                  )}
                </button>
              </form>
            </div>

            {/* Practical Placement Strip */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-3 text-[11px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#059669]"/> Place on Top of Your 1-Page Resume
              </span>
              <span className="flex items-center gap-1.5">
                <LinkedInIcon className="w-3.5 h-3.5 text-blue-600"/> Link from LinkedIn Featured
              </span>
              <span className="flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#059669]"/> Submit as Portfolio URL
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why VerifiedCV Section */}
      <section id="why" className="py-12 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 space-y-8">
          <div className="text-center space-y-1.5 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How VerifiedCV Fits Your Career
            </h2>
            <p className="text-2xl font-black text-[#0F172A]">
              Complement your LinkedIn profile with verified achievements.
            </p>
            <p className="text-xs text-slate-500">
              LinkedIn is for networking and connections. VerifiedCV is the permanent, corroborated proof behind what you built.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800">
                <FileText className="w-4 h-4 text-slate-700"/>
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">At the Top of Your Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">verifiedcv.app/yourname</code> right under your contact info. Recruiters reading your 1-page PDF get an instant link to inspect your depth.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800">
                <Globe className="w-4 h-4 text-blue-600"/>
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">The Portfolio for Every Professional</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                When applications ask for a &quot;Portfolio or Website&quot;, product leaders, operators, and executives finally have an answer. A living showcase of what you built.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800">
                <CheckCircle2 className="w-4 h-4 text-[#059669]"/>
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Validate Once, Keep Permanently</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stop bothering past managers for reference checks on every single late-stage interview. Colleague attestations remain locked in your dossier forever.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Candidates Section */}
      <section id="candidates" className="py-14 max-w-5xl mx-auto px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              For Authentic Candidates
            </h2>
            <p className="text-2xl font-black text-[#0F172A] mt-1">
              Own your career history without 1-page constraints.
            </p>
          </div>

          <div className="inline-flex p-1 bg-slate-100 border border-[#E2E8F0] rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewPerspective("candidate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewPerspective === "candidate"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600"/>
              <span>Studio View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPerspective("recruiter")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewPerspective === "recruiter"
                  ? "bg-white text-[#0F172A] shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-[#059669]"/>
              <span>Recruiter View</span>
            </button>
          </div>
        </div>

        {viewPerspective === "candidate" ? (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400">Candidate Studio /</span>
                <span className="font-bold text-[#0F172A]">Career Vault</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-500">Auto-saved to Vault API</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              <div className="md:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-[#E2E8F0]">
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700">
                    <Bot className="w-3.5 h-3.5"/>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0F172A]">CV Ally Copilot</h4>
                    <span className="text-[9px] text-slate-400 block">Socratic Milestone Calibration</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-xs space-y-2 shadow-2xs">
                  <p className="text-indigo-950 font-medium text-[11px] leading-relaxed">
                    &quot;In your Yahoo chapter, you mention scaling personalization to 400M users. What were the specific latency constraints you solved?&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <button type="button" className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[9px] rounded border border-indigo-200">
                      Calibrate Metric
                    </button>
                    <button type="button" className="text-[9px] text-slate-400 hover:text-slate-600">
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1 pt-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px]">Portfolio Health</span>
                  <div className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Check className="w-3 h-3"/> 14 Milestones extracted losslessly
                  </div>
                  <div className="flex items-center gap-1 text-slate-600">
                    <Users className="w-3 h-3 text-slate-400"/> 2 Peer vouchers corroborated
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0F172A]">Active Career Milestone</h4>
                    <p className="text-[10px] text-slate-500">Chapter: Yahoo (2010 — 2024)</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                    Peer Corroboration Active
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-[#E2E8F0] bg-slate-50/70 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800">
                    Milestone Statement
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2 rounded border border-[#E2E8F0]">
                    Architected multi-tenant personalization pipeline supporting 400M+ global users with sub-50ms query budgets. Reduced cloud egress cost by 45% through regional caching.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Users className="w-3 h-3"/> Send Peer Voucher Link
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-[#E2E8F0] px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-3 h-3 text-slate-500"/> Attach Work Artifact
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0F172A] text-sm">Graham Harris</span>
                <span className="text-[10px] font-mono text-slate-400">verifiedcv.app/gharris</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Verified Recruiter Dossier
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {verifiedFacts.map((fact) => (
                <div key={fact.id} className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{fact.company}</span>
                    <span className="text-[9px] font-bold text-emerald-700">{fact.badgeText}</span>
                  </div>
                  <h4 className="font-bold text-[#0F172A] text-[11px]">{fact.title}</h4>
                  <p className="text-[10px] text-slate-500">{fact.proofDetail}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4"/>
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• The Permanent Career Proof Layer</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <Link className="hover:text-slate-950" href="/">
              Home
            </Link>
            <Link className="hover:text-slate-950" href="/studio">
              Candidate Studio
            </Link>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}