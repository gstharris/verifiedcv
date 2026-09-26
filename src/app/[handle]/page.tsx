"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
  Link2,
  Share2
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { createClient } from "@supabase/supabase-js";

export default function CandidateDossierPage() {
  const params = useParams();
  const routeHandle = (params?.handle as string)?.toLowerCase().trim() || "";

  const [candidate, setCandidate] = useState<any | null>(null);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadDossier() {
      setIsLoading(true);

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: candData, error: candError } = await supabase
          .from("candidates")
          .select("*")
          .eq("handle", routeHandle)
          .single();

        if (candError || !candData) {
          setIsNotFound(true);
          setIsLoading(false);
          return;
        }

        const { data: msData } = await supabase
          .from("milestones")
          .select("*")
          .eq("candidate_id", candData.id);

        setCandidate(candData);
        setMilestones(msData || []);
      } catch {
        setIsNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    if (routeHandle) {
      loadDossier();
    }
  }, [routeHandle]);

  const handleShare = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-sans text-xs">
        <Clock className="w-4 h-4 animate-spin text-[#059669] mr-2" />
        Resolving Cryptographic Vault Ground Truth...
      </div>
    );
  }

  // PLG LOOP: High-converting Unclaimed Handle Screen
  if (isNotFound || !candidate) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans flex flex-col justify-between antialiased">
        <header className="bg-white border-b border-[#E2E8F0] h-14 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <VerifiedCVLogo className="w-6 h-6" />
            <span className="font-black text-base text-[#0F172A]">VerifiedCV</span>
          </Link>
          <Link
            href="/studio"
            className="text-xs font-bold text-slate-700 hover:text-slate-950 px-3 py-1.5"
          >
            Open Studio
          </Link>
        </header>

        <main className="max-w-md mx-auto px-6 py-20 text-center space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#059669] mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-mono font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              verifiedcv.app/{routeHandle}
            </span>
            <h1 className="text-2xl font-black text-[#0F172A]">This handle is currently available.</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              VerifiedCV dossiers provide forensic proof behind resumes and LinkedIn profiles. Claim this handle before someone else does.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/studio"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
            >
              <span>Claim verifiedcv.app/{routeHandle}</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            </Link>
          </div>
        </main>

        <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} VerifiedCV • The Permanent Career Proof Layer
        </footer>
      </div>
    );
  }

  // AUTHENTIC DOSSIER VIEW
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-emerald-100 flex flex-col justify-between">
      
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <VerifiedCVLogo className="w-7 h-7 group-hover:scale-105 transition-transform" />
            <div className="flex flex-col">
              <span className="font-black text-lg tracking-tight text-[#0F172A] leading-none">
                VerifiedCV
              </span>
              <span className="text-[9px] font-bold text-[#059669] uppercase tracking-widest mt-0.5">
                Public Dossier
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? "Link Copied" : "Share Dossier"}</span>
            </button>

            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <span>Open Studio</span>
              <ArrowRight className="w-3 h-3 text-emerald-400" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8 flex-1 w-full">
        {/* Profile Card */}
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center font-black text-xl text-[#0F172A] shadow-2xs">
                {candidate.full_name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-[#0F172A]">{candidate.full_name}</h1>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> Verified Identity
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5">
                  {candidate.headline}
                </p>
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1">
                  <span>verifiedcv.app/{candidate.handle}</span>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-left sm:text-right self-start sm:self-auto">
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                Vault Status
              </span>
              <span className="text-xs font-bold text-[#059669] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Cryptographically Anchored
              </span>
            </div>
          </div>

          {/* Milestones Stream */}
          <div className="space-y-4">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Audited Career Milestones ({milestones.length})
            </span>

            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No milestones published to this dossier yet.</p>
            ) : (
              milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {m.company} • {m.role}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] mt-0.5">
                        {m.calibrated_claim}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        m.is_corroborated
                          ? "text-emerald-800 bg-emerald-50 border border-emerald-200"
                          : "text-slate-500 bg-slate-100 border border-slate-200"
                      }`}
                    >
                      {m.is_corroborated ? "Corroborated" : "Self-Reported"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-[#E2E8F0] bg-white py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} VerifiedCV • The Permanent Career Proof Layer
      </footer>

    </div>
  );
}