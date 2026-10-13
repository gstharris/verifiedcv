"use client";

import { useEffect, useState, use } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  ArrowRight,
  Loader2,
  AlertCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Award,
  Check,
  ShieldAlert
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import { overlapMonths, parseTenureRange } from "@/lib/tenureOverlap";
import { corroborationHeadline } from "@/lib/corroborationDisplay";
import { captureEvent } from "@/lib/analytics";
import { LOOP_EVENTS, writeCorroboratorRef } from "@/lib/corroborationLoop";

const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => String(new Date().getUTCFullYear() + 1 - i));

function linkedInReturnMessage(auth: string | null, reason: string | null, hasSession: boolean) {
  if (hasSession) return "";
  if (auth === "success") {
    return "LinkedIn signed you in, but this browser did not keep the session. Use www.verifiedcv.app and try again.";
  }
  if (auth !== "error") return "";
  if (reason === "state") {
    return "LinkedIn sign-in lost its session cookie. Open this page on www.verifiedcv.app and try again.";
  }
  if (reason === "denied") return "LinkedIn sign-in was cancelled.";
  if (reason === "profile") return "LinkedIn did not return a usable profile. Try again.";
  return "LinkedIn sign-in did not complete. Try again.";
}

interface ChapterClaimSummary {
  id: string;
  raw_bullet: string;
  metric_summary?: string;
  category?: string;
}

interface ChapterAttestationData {
  token: string;
  candidateHandle: string;
  candidateName: string;
  experienceId: string;
  companyName: string;
  roleTitle: string;
  tenureDates: string;
  claims: ChapterClaimSummary[];
  attestorEmail: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
}

export default function ChapterAttestationPage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<ChapterAttestationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  // Form State
  const [attestorName, setAttestorName] = useState("");
  const [attestorTitle, setAttestorTitle] = useState("");
  const [endorsedClaimIds, setEndorsedClaimIds] = useState<string[]>([]);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(true);
  const [attestorStartYear, setAttestorStartYear] = useState("");
  const [attestorEndYear, setAttestorEndYear] = useState("");
  const [attestorStillThere, setAttestorStillThere] = useState(false);

  // LinkedIn Verification State
  const [isAuthenticatingLinkedIn, setIsAuthenticatingLinkedIn] = useState(false);
  const [linkedInProfile, setLinkedInProfile] = useState<{
    sub: string;
    name: string;
    email?: string;
    picture?: string;
    title?: string;
    url?: string;
  } | null>(null);
  const [linkedInError, setLinkedInError] = useState("");

  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    async function fetchAttestation() {
      try {
        const res = await fetch(`/api/verify/attest?token=${token}`);
        const json = await res.json();

        if (json.success && json.data) {
          setData(json.data);
          setBlockedReason(json.blockedReason || null);
          const parsed = parseTenureRange(String(json.data.tenureDates || ""));
          if (parsed) {
            setAttestorStartYear(String(parsed.start.year));
            setAttestorEndYear(String(parsed.end.year));
          }
          if (json.data.status === "CONFIRMED") {
            setIsSuccess(true);
          }
        } else {
          setError(json.error || "Invalid or expired attestation link.");
        }
      } catch {
        setError("Network error retrieving attestation context.");
      } finally {
        setLoading(false);
      }
    }
    fetchAttestation();
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const linkedInAuth = urlParams.get("linkedin_auth");
    const linkedInReason = urlParams.get("linkedin_reason");
    const authError = urlParams.get("error");
    
    const hash = window.location.hash;
    const hasHashError = hash.includes("error=");
    const hasHashToken = hash.includes("access_token=");
    
    if (authError || hasHashError) {
      setLinkedInError("Authentication failed. Please try again.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (hasHashToken) {
      setTimeout(async () => {
        window.history.replaceState({}, document.title, window.location.pathname);
        
        const { createClient } = await import("@supabase/supabase-js");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.app_metadata?.providers?.includes("linkedin_oidc")) {
          setLinkedInProfile({
            sub: user.user_metadata?.sub || user.id,
            name: user.user_metadata?.full_name || user.user_metadata?.name || "LinkedIn member",
            email: user.user_metadata?.email || user.email,
            picture: user.user_metadata?.picture || user.user_metadata?.avatar_url
          });
          setAttestorName((prev) => prev || user.user_metadata?.full_name || user.user_metadata?.name || "");
          setLinkedInError("");
        }
      }, 500);
    }

    async function applyLinkedInSession() {
      try {
        const res = await fetch("/api/auth/linkedin/session");
        const json = await res.json();
        if (json?.authenticated && json.profile) {
          if (json.usableForConfirm === false) {
            setLinkedInProfile(null);
            setLinkedInError(json.confirmError || "This LinkedIn account is too incomplete to confirm.");
            if (linkedInAuth) {
              window.history.replaceState({}, document.title, `/attest/${token}`);
            }
            return;
          }
          setLinkedInProfile({
            sub: json.profile.sub,
            name: json.profile.name,
            email: json.profile.email,
            picture: json.profile.picture
          });
          setAttestorName((prev) => prev || json.profile.name || "");
          setLinkedInError("");
          if (linkedInAuth) {
            window.history.replaceState({}, document.title, `/attest/${token}`);
          }
          return;
        }
      } catch {
        // Session lookup is optional; the Sign in button still works.
      }

      const returnError = linkedInReturnMessage(linkedInAuth, linkedInReason, false);
      if (returnError) {
        setLinkedInError(returnError);
        window.history.replaceState({}, document.title, `/attest/${token}`);
      }
    }

    if (!hasHashToken) {
      applyLinkedInSession();
    }
  }, [token]);

  const toggleClaimEndorsement = (claimId: string) => {
    setEndorsedClaimIds((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
    );
  };

  const handleLinkedInAuth = () => {
    setIsAuthenticatingLinkedIn(true);
    setLinkedInError("");
    window.location.href = `/api/auth/linkedin?next=${encodeURIComponent(`/attest/${token}`)}`;
  };

  const attestorPeriod = attestorStartYear
    ? `${attestorStartYear} — ${attestorStillThere ? "Present" : attestorEndYear}`
    : "";
  const overlapPreview = data ? overlapMonths(data.tenureDates, attestorPeriod) : { ok: false, months: 0, label: "" };
  const publicPreview = data
    ? corroborationHeadline(data.companyName, [{ name: attestorTitle.trim() || "colleague" }])
    : "";

  const handleConfirm = async () => {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { data: { session } } = await supabase.auth.getSession();

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch("/api/verify/attest", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          token,
          attestorName: attestorName.trim() || linkedInProfile?.name || "",
          attestorTitle: attestorTitle.trim(),
          careerYears: 0,
          relationship: "PEER",
          isRoleMasked: true,
          notes: "",
          endorsedClaimIds,
          attestorPeriod,
          attestorCompany: data?.companyName,
          linkedInProfile,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setIsSuccess(true);
        captureEvent(LOOP_EVENTS.corroborationCompleted, {
          company: data?.companyName || "",
          candidateHandle: data?.candidateHandle || ""
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitError(json.error || "Failed to confirm chapter milestone.");
      }
    } catch {
      setSubmitError("Network interruption confirming attestation.");
    } finally {
      setSubmitting(false);
    }
  };

  const startOwnPage = () => {
    if (!data) return;
    const ref = {
      handle: data.candidateHandle,
      name: data.candidateName,
      company: data.companyName
    };
    writeCorroboratorRef(ref);
    captureEvent(LOOP_EVENTS.corroboratorProfileStarted, {
      invitedBy: ref.handle,
      company: ref.company
    });
    const params = new URLSearchParams({
      ref: ref.handle,
      refName: ref.name,
      company: ref.company
    });
    window.location.href = `/?${params.toString()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Opening this confirmation...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <VerifiedCVLogo className="w-10 h-10 mb-4" />
        <h1 className="text-xl font-black text-slate-900">This link is unavailable</h1>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          {error || "This confirmation link has expired or was already used."}
        </p>
        <a
          href="/"
          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
        >
          Return to VerifiedCV Home
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-emerald-100">
      
      {/* Top Header */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <VerifiedCVLogo />
          <span className="font-black text-xl tracking-tight text-slate-950">VerifiedCV</span>
          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
            Colleague confirmation
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-medium">
          <Lock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Private link</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto p-6 sm:py-12 space-y-6">
        
        {!isSuccess ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
            
            {/* Header Context */}
            <div className="space-y-1.5 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-[11px] font-extrabold text-emerald-800 uppercase tracking-wider">
                  Chapter Corroboration Request
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                Confirm time with {data.candidateName} at {data.companyName}
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                Sign in with LinkedIn, add your title, and the years you overlapped. Your name stays private.
                Recruiters will see a title at {data.companyName}, or a count if several people confirm.
              </p>
            </div>

            {/* Chapter Card (Fast-Path Anchor) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                  <Building2 className="w-4 h-4 text-slate-600" />
                  {data.companyName}
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  {data.tenureDates}
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-700">
                Claimed Role: <span className="font-bold text-slate-950">{data.roleTitle}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <div>
                <label className="font-bold text-xs text-slate-900 block">Your title at {data.companyName}</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Director"
                  value={attestorTitle}
                  onChange={(e) => setAttestorTitle(e.target.value)}
                  className="mt-1.5 w-full border border-slate-200 rounded-xl p-2.5 text-xs outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Years you were there</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Needs to overlap {data.candidateName}'s time ({data.tenureDates}).
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Started</label>
                  <select
                    value={attestorStartYear}
                    onChange={(e) => setAttestorStartYear(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-slate-400"
                  >
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-800 block mb-1">Ended</label>
                  <select
                    value={attestorEndYear}
                    onChange={(e) => setAttestorEndYear(e.target.value)}
                    disabled={attestorStillThere}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:border-slate-400 disabled:opacity-50"
                  >
                    <option value="">Year</option>
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={attestorStillThere}
                  onChange={(e) => setAttestorStillThere(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-0 cursor-pointer"
                />
                I still work there
              </label>
              {attestorStartYear && (attestorStillThere || attestorEndYear) && (
                <p className={`text-[11px] font-semibold ${overlapPreview.ok ? "text-emerald-700" : "text-red-600"}`}>
                  {overlapPreview.label}
                </p>
              )}
              <p className="text-[11px] text-slate-500">
                Recruiters will see: <strong className="text-slate-800">{publicPreview}</strong>
              </p>
            </div>

            {/* Optional Progressive Drill-Down: Specific Milestones */}
            {data.claims && data.claims.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setIsMilestonesOpen(!isMilestonesOpen)}
                  className="w-full p-3.5 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between text-xs text-left cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-bold text-slate-900 block">
                        Corroborate specific achievements
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {endorsedClaimIds.length} of {data.claims.length} selected · checking any also confirms the company
                      </span>
                    </div>
                  </div>
                  {isMilestonesOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isMilestonesOpen && (
                  <div className="p-3.5 space-y-2.5 border-t border-slate-200 bg-slate-50/30">
                    <p className="text-[11px] text-slate-500 pb-1">
                      Check any specific initiatives you directly observed or worked on together:
                    </p>
                    {data.claims.map((claim) => {
                      const isChecked = endorsedClaimIds.includes(claim.id);
                      return (
                        <div
                          key={claim.id}
                          onClick={() => toggleClaimEndorsement(claim.id)}
                          className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                            isChecked
                              ? "bg-emerald-50/60 border-emerald-300 text-slate-900"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                              isChecked
                                ? "bg-emerald-600 text-white"
                                : "border border-slate-300 bg-white"
                            }`}
                          >
                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            {claim.metric_summary && (
                              <span className="inline-block text-[10px] font-bold text-emerald-800 bg-emerald-100/60 px-1.5 py-0.2 rounded mr-1.5">
                                {claim.metric_summary}
                              </span>
                            )}
                            <p className="leading-relaxed">{claim.raw_bullet}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-200 text-[11px] text-slate-600 leading-relaxed">
              Your name stays private. This is a personal confirmation, not an official {data.companyName} reference.
            </div>

            <div className="space-y-4 text-xs">
              {!linkedInProfile ? (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-blue-900">Sign in with LinkedIn</h4>
                      <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                        So we know a real person confirmed. The account needs a verified email, a name, and a profile photo. LinkedIn does not tell us when the account was created. We will not post or show your name.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLinkedInAuth}
                    disabled={isAuthenticatingLinkedIn}
                    className="w-full py-2.5 bg-[#0A66C2] hover:bg-[#004182] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAuthenticatingLinkedIn ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    <span>Sign in with LinkedIn</span>
                  </button>
                  {linkedInError && <div className="text-red-600 text-[10px] font-bold text-center">{linkedInError}</div>}
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Signed in with LinkedIn</div>
                    <div className="text-[10px] text-emerald-700">Identity confirmed. Name stays private on the page.</div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              )}

              {blockedReason && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{blockedReason}</span>
                </div>
              )}
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {linkedInProfile && !blockedReason && (
              <button
                onClick={handleConfirm}
                disabled={submitting || !overlapPreview.ok || !attestorTitle.trim()}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving confirmation...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm</span>
                  </>
                )}
              </button>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6 text-center">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
                Confirmation saved
              </h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thank you. {data.candidateName}&apos;s page now shows that a colleague confirmed their time at {data.companyName}. Your name stays off that page.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-left space-y-3">
              <h3 className="font-extrabold text-sm text-[#0F172A]">
                Start your own page
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Upload a resume and claim a link. {data.candidateName} can confirm your chapter later. Nothing is marked corroborated until someone does.
              </p>
              <button
                type="button"
                onClick={startOwnPage}
                className="w-full py-2.5 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Start your page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 text-center text-xs text-slate-500">
        VerifiedCV • A portfolio people can confirm
      </footer>

    </div>
  );
}