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
        if (typeof window !== "undefined") {
          sessionStorage.setItem("vcv_pending_payload", JSON.stringify({
            milestones: data.milestones,
            fullName: data.fullName,
            headline: data.headline
          }));
        }
        router.push("/studio");
        return;
      }
    } catch {
      // Fallback: pass raw text for Studio to process
      if (typeof window !== "undefined") {
        sessionStorage.setItem("vcv_pending_payload", JSON.stringify({
          rawText: chatInput.trim()
        }));
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
          sessionStorage.setItem("vcv_pending_payload", JSON.stringify({
            milestones: data.milestones,
            fullName: data.fullName,
            headline: data.headline
          }));
        }
        router.push("/studio");
        return;
      } else {
        alert(data.error || "Could not parse document. Routing to Candidate Studio.");
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
      sessionStorage.setItem("vcv_pending_payload", JSON.stringify({
        action: "load_canonical"
      }));
    }
    router.push("/studio");
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
      <section className="relative pt-8 pb-10 md:pt-12 md:pb-12">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-3">
          <h1 className="text-3xl sm:text-5xl font-black text-[#0F172A] tracking-tight leading-[1.12] max-w-3xl mx-auto">
            The living portfolio for verified careers.
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A living career portfolio corroborated by peers, managers, and real proof signals. Complements your resume and LinkedIn.
          </p>

          {/* CV Ally Conversational Ingress Window */}
          <div className="max-w-xl mx-auto pt-4 text-left">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-4 space-y-3.5">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#059669] shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-xs text-slate-700 leading-relaxed">
                  <span className="font-bold text-[#0F172A] block mb-0.5">CV Ally Career Copilot</span>
                  Drop your resume or paste your career accomplishments. I will extract your milestones cleanly into Candidate Studio.
                </div>
              </div>

              {/* Action Buttons */}
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
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{isProcessing ? "Processing..." : "Upload Resume (PDF / Word)"}</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleLinkedInImport}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                >
                  <LinkedInIcon className="w-3.5 h-3.5" />
                  <span>Import Career Profile</span>
                </button>
              </div>

              {/* Chat Input */}
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
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </form>
            </div>

            {/* Strip */}
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

      {/* Footer */}
      <footer className="border-t border-[#E2E8F0] bg-white py-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <VerifiedCVLogo className="w-4 h-4" />
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