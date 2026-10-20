"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileText,
  ArrowRight,
  UploadCloud,
  Globe,
  Clock,
  Send
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { captureEvent } from "@/lib/analytics";
import { corroboratorRefFromSearch, writeCorroboratorRef } from "@/lib/corroborationLoop";
import { THIN_RESUME_MESSAGE, resumeImportHasContent } from "@/app/api/parse/parseResume";
import { RESUME_FILE_ACCEPT, UNSUPPORTED_RESUME_MESSAGE, resumeFileKind } from "@/lib/resumeFileKind";

function StudioPreview() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-slate-400">Studio /</span>
          <span className="font-bold text-[#0F172A]">Your portfolio</span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">Saved</span>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Summary</p>
        <p className="text-xs leading-relaxed text-slate-600">
          Product lead focused on revenue and customer problems, with the work and the proof on one page.
        </p>
      </div>
      <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black text-[#0F172A]">Yahoo</p>
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified</span>
        </div>
        <p className="text-[11px] text-slate-500">Senior Director · 2010 — 2016</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <div className="h-16 bg-emerald-50" />
          <p className="px-2 py-2 text-[11px] font-bold text-[#0F172A]">PairedRight</p>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <div className="h-16 bg-slate-100" />
          <p className="px-2 py-2 text-[11px] font-bold text-[#0F172A]">Product deck</p>
        </div>
      </div>
    </div>
  );
}

function DossierPreview() {
  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-xs space-y-4">
      <div className="space-y-1 border-b border-slate-100 pb-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-base font-black text-[#0F172A]">Graham Harris</p>
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-[#059669]">
            <CheckCircle2 className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-600">Product executive</p>
        <p className="font-mono text-[11px] text-slate-400">verifiedcv.app/gharris</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <div className="h-20 bg-[#F8FAFC]" />
          <div className="space-y-0.5 p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">App</p>
            <p className="text-xs font-black text-[#0F172A]">PairedRight</p>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-[#E2E8F0]">
          <div className="h-20 bg-slate-100" />
          <div className="space-y-0.5 p-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presentation</p>
            <p className="text-xs font-black text-[#0F172A]">Product deck</p>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-[#E2E8F0] p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-black text-[#0F172A]">Yahoo</p>
          <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Verified</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Senior Director, Global Product · 2010 — 2016</p>
      </div>
    </div>
  );
}

export default function VerifiedCVLandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chatInput, setChatInput] = useState("");
  const [importNotice, setImportNotice] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const DEMO_HANDLES = ["arashmobayen", "kevinrenfro", "peterkim", "priyanair", "mateoalvarez"];
  const [nameIndex, setNameIndex] = useState(0);

  React.useEffect(() => {
    const ref = corroboratorRefFromSearch(new URLSearchParams(window.location.search));
    if (ref) writeCorroboratorRef(ref);
  }, []);

  useEffect(() => {
    if (isProcessing) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/vault?mine=1", { credentials: "include" });
        if (cancelled) return;
        if (res.ok || res.status === 404) router.replace("/studio");
      } catch {
        // Guests stay on the start page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isProcessing, router]);

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
    highlights?: string[];
    skills?: unknown[];
    education?: unknown[];
    contact?: {
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      emailVerified?: boolean;
      phoneVerified?: boolean;
      linkedinVerified?: boolean;
    };
  }) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "vcv_pending_payload",
        JSON.stringify({
          milestones: data.milestones || [],
          fullName: data.fullName || "",
          headline: data.headline || "",
          summaryStatement: data.summaryStatement || "",
          highlights: data.highlights || [],
          skills: data.skills || [],
          education: data.education || [],
          contact: data.contact || {}
        })
      );
    }
    router.push("/studio");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isProcessing) return;
    setImportNotice("");
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("text", chatInput.trim());

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && resumeImportHasContent(data)) {
        captureEvent("resume_parsed", { source: "landing_paste", chapters: data.milestones?.length || 0 });
        forwardPayloadToStudio(data);
        return;
      }
      setImportNotice(typeof data.error === "string" ? data.error : THIN_RESUME_MESSAGE);
    } catch {
      setImportNotice("Could not read that resume. Paste the text, or start from scratch.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || isProcessing) return;
    const file = e.target.files[0];
    e.target.value = "";
    if (resumeFileKind(file.name, file.type) === "unsupported") {
      setImportNotice(UNSUPPORTED_RESUME_MESSAGE);
      return;
    }
    setImportNotice("");
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && resumeImportHasContent(data)) {
        captureEvent("resume_parsed", { source: "landing_upload", chapters: data.milestones?.length || 0 });
        forwardPayloadToStudio(data);
        return;
      }
      setImportNotice(typeof data.error === "string" ? data.error : THIN_RESUME_MESSAGE);
    } catch {
      setImportNotice("Could not read that file. Paste the resume text, or upload a PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

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
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-xs"
              href="/studio?signin=1"
            >
              Sign in
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
            <div id="start" className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept={RESUME_FILE_ACCEPT}
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
                <span>{isProcessing ? "Processing..." : "Upload resume"}</span>
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
                  title="Parse resume"
                >
                  {isProcessing ? (
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
              {importNotice && (
                <div className="space-y-2 text-left">
                  <p className="text-xs font-semibold leading-relaxed text-amber-800">{importNotice}</p>
                  <button
                    type="button"
                    onClick={() => router.push("/studio?scratch=1")}
                    className="text-xs font-semibold text-slate-500 hover:text-[#0F172A] cursor-pointer"
                  >
                    Start from scratch
                  </button>
                </div>
              )}
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
              A page you own. Start with what you report, then add a colleague, a company email, or a document. Each one is a level of proof on that chapter.
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

      <section id="candidates" className="py-16 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">For Candidates</h2>
            <p className="text-2xl font-black text-[#0F172A] sm:text-3xl">A portfolio you can share.</p>
            <p className="text-sm leading-relaxed text-slate-600">
              Upload a resume and the page is yours. Add proof when you want to: what you report, a colleague who was there, a company email, or a document. Put the link on applications so a reader can see a real person and real experience.
            </p>
          </div>
          <StudioPreview />
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="py-16 bg-white border-t border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">
              How It Works
            </h2>
            <p className="text-2xl sm:text-3xl font-black text-[#0F172A]">
              Upload resume. Verify. Your portfolio is live.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-mono font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Upload resume</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Drop a PDF, Word, RTF, or text file, or paste the resume. We read your chapters, summary, and skills onto the page.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-[#059669] text-white font-mono font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Verify</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm it is you. Then add a company email, a document, or someone who worked with you. Each source is another level of proof on that chapter.
              </p>
            </div>

            <div className="space-y-3">
              <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-extrabold text-sm text-[#0F172A]">Your portfolio is live</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Share verifiedcv.app/yourname on applications and in your resume header.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiter Trust Layer */}
      <section id="recruiters" className="py-16 max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#059669]">For Recruiters</h2>
            <p className="text-2xl font-black tracking-tight text-[#0F172A] sm:text-3xl">A portfolio with proof at several levels.</p>
            <p className="text-sm leading-relaxed text-slate-600">
              Candidates use it to stand out and to make the read easier. You see a real person and real experience. Some of it is what they reported. Some of it is backed by a colleague, a company email, or a document. The page shows which is which.
            </p>
          </div>
          <DossierPreview />
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-white border-t border-[#E2E8F0] text-center">
        <div className="max-w-2xl mx-auto px-6 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
            Upload a resume. Your portfolio goes live.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Free for candidates. Paid options come later.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#059669] hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-xs cursor-pointer group"
            >
              <span>Upload a resume</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
            <span className="font-bold text-[#0F172A]">VerifiedCV</span>
            <span className="text-slate-400">• Your portfolio</span>
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <Link className="hover:text-slate-950 transition-colors" href="/">
              Home
            </Link>
            <Link className="hover:text-slate-950 transition-colors" href="/studio?signin=1">
              Sign in
            </Link>
            <span className="text-slate-400">© {new Date().getFullYear()} verifiedcv.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}