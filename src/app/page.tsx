"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  UploadCloud,
  Check,
  Globe,
  Layers,
  Users,
  Clock,
  Eye,
  Bot,
  Send,
  BadgeCheck
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { captureEvent } from "@/lib/analytics";

export default function VerifiedCVLandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewPerspective, setViewPerspective] = useState<"candidate" | "recruiter">("candidate");

  const DEMO_HANDLES = ["arashmobayen", "kevinrenfro", "peterkim", "priyanair", "mateoalvarez"];
  const [nameIndex, setNameIndex] = useState(0);

  React.useEffect(() => {
    const handleCount = DEMO_HANDLES.length;
    const interval = setInterval(() => {
      setNameIndex((prev) => (prev + 1) % handleCount);
    }, 2500);
    return () => clearInterval(interval);
  }, [DEMO_HANDLES.length]);

  const forwardPayloadToStudio = (data: {
    milestones?: unknown[];
    fullName?: string;
    headline?: string;
    summaryStatement?: string;
    skills?: unknown[];
    education?: unknown[];
  }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
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
        captureEvent("resume_parsed", { source: "landing_paste", chapters: data.milestones.length });
        forwardPayloadToStudio(data);
        return;
      }
    } catch {
      if (typeof window !== "undefined") {
        localStorage.setItem(
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
        captureEvent("resume_parsed", { source: "landing_upload", chapters: data.milestones.length });
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
      title: "Led personalization products used at large scale",
      company: "Yahoo",
      role: "Head of Product Management",
      badgeText: "Colleague confirmed",
      proofDetail:
        "A former engineering director signed in with LinkedIn and confirmed they worked together on this chapter."
    },
    {
      id: 1,
      title: "Simplified a multi-product SaaS lineup",
      company: "Bazaarvoice",
      role: "Group Product Manager",
      badgeText: "Document attached",
      proofDetail: "Offer letter checked for employer name and dates. One colleague confirmation makes this Company Verified."
    },
    {
      id: 2,
      title: "Founded a recommendation platform for operators",
      company: "PairedRight",
      role: "Founder & Head of Product",
      badgeText: "Colleague confirmed",
      proofDetail: "A teammate confirmed the role and dates. No internal customer metrics are shown."
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
        <div className="max-w-4xl mx-auto px-6 text-center space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <span>Beta</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            Stand out as a real candidate.
          </h1>
          <p className="text-base sm:text-xl font-semibold text-slate-600 max-w-2xl mx-auto leading-snug">
            Upload your resume. Add proof. Share one link.
          </p>

          <div className="max-w-xl mx-auto pt-2 space-y-4">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
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
                onClick={() => {
                  captureEvent("landing_upload_clicked");
                  fileInputRef.current?.click();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4 text-emerald-400" />
                <span>{isProcessing ? "Processing..." : "Upload Resume (PDF / Word)"}</span>
              </button>

              <p className="text-[11px] font-medium text-slate-400">or paste your resume</p>

              <form onSubmit={handleSendMessage} className="relative text-left">
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
                  placeholder="Paste your resume text..."
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

            <div className="inline-flex items-center gap-2 text-sm text-slate-500">
              <Globe className="w-4 h-4 text-[#059669]" />
              <span>Own your portfolio:</span>
              <span className="font-semibold text-[#0F172A]">
                verifiedcv.app/<span className="text-[#059669] transition-all duration-300">{DEMO_HANDLES[nameIndex]}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Why VerifiedCV Section */}
      <section id="why" className="py-16 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              Why VerifiedCV
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              Proof that sits on the chapter.
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              A page you own. Identity, a matching work inbox, documents, and colleagues — not a recommendation sticker on a PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <FileText className="w-4 h-4 text-slate-700" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Put a link on your resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">verifiedcv.app/yourname</code> under your name. Anyone reading the PDF can open the full story.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <Globe className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">A portfolio when they ask for one</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applications that ask for a website finally have a good answer for operators and product leaders — not just designers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] flex items-center justify-center text-slate-800 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              </div>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Proof that stays with you</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm it is you. Match a work email. Attach an employment document. Ask people who overlapped. Each source stays on that chapter when you change jobs.
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
              What it looks like
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A] mt-1">
              You build the page. Proof sits on each chapter.
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
                <span className="font-mono text-slate-400">Studio /</span>
                <span className="font-bold text-[#0F172A]">Your portfolio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-semibold text-slate-500">Saved</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 pb-2.5 border-b border-[#E2E8F0]">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669]">
                    <Bot className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-[#0F172A]">Ally</h4>
                </div>

                <div className="p-3 rounded-lg bg-white border border-emerald-100 text-xs space-y-2.5 shadow-2xs">
                  <p className="text-slate-800 font-medium text-[11px] leading-relaxed">
                    &quot;This Yahoo chapter looks clear. Invite someone who worked there with you to confirm it. Leave out anything your old employer would consider confidential.&quot;
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-[#059669] font-bold text-[9px] rounded border border-emerald-200">
                      Writing help
                    </span>
                    <span className="text-[9px] text-slate-400">No confidential numbers</span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 space-y-1.5 pt-1">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[9px]">
                    What stays on the page
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                    <Check className="w-3 h-3" /> Full titles and dates, not a one-page cut
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3 h-3 text-slate-400" /> Colleague confirmations, names private
                  </div>
                </div>
              </div>

              <div className="md:col-span-7 bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-xs text-[#0F172A]">Yahoo</h4>
                    <p className="text-[10px] text-slate-500">Head of Product · 2010 — 2024</p>
                  </div>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    Confirmed by a Senior Director at Yahoo
                  </span>
                </div>

                <div className="p-3.5 rounded-lg border border-[#E2E8F0] bg-slate-50/70 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800">
                    What they built
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed bg-white p-2.5 rounded border border-[#E2E8F0]">
                    Led personalization and enterprise products, with P&L ownership, three patents, and an 18-person team across eight countries.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#059669] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" /> Ask a colleague
                  </Link>
                  <Link
                    href="/studio"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-[#E2E8F0] px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-500" /> Save portfolio
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
                <BadgeCheck className="w-3 h-3 text-[#059669]" /> Confirmed chapters
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
              Resume, then proof. Not just a nicer PDF.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Upload Resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drop your PDF or paste your resume text. We automatically extract your career chapters.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-[#059669] text-white font-mono font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Add proof</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm identity, match a work inbox, attach a document, and invite people who were there. One independent source verifies a chapter. Two makes it Verified+.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Post</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Add your verifiedcv.app link to job applications and your resume header to stand out to employers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiter Trust Layer */}
      <section id="recruiters" className="py-16 max-w-5xl mx-auto px-6">
        <div className="rounded-3xl bg-white border border-[#E2E8F0] p-8 sm:p-12 space-y-6">
          <div className="max-w-xl space-y-3">
            <span className="text-xs font-bold text-[#059669] uppercase tracking-widest">
              For hiring teams
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight text-[#0F172A]">
              See the proof on the chapter — not a sticker.
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Identity, a matched employment document, and colleagues who signed in with LinkedIn and stated they overlapped. One person is a lead. Several with titles at that company is the signal. You still run your own backchannels.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#059669] font-black text-lg">Invite</span>
              <p className="text-xs text-slate-600">The candidate chooses who to ask</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#059669] font-black text-lg">LinkedIn</span>
              <p className="text-xs text-slate-600">That person signs in before they confirm</p>
            </div>
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
              <span className="text-[#059669] font-black text-lg">On the page</span>
              <p className="text-xs text-slate-600">You see the confirmation next to the chapter</p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-white border-t border-[#E2E8F0] text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Start with your resume. Then add proof.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Free while we are in beta. Upload a resume to claim your page.
          </p>
          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-xs cursor-pointer group"
            >
              <span>Open Studio</span>
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
            <span className="text-slate-400">• A portfolio people can confirm</span>
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