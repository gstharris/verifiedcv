"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Building2, 
  Mail, 
  Loader2, 
  Check, 
  Sparkles, 
  AlertCircle,
  Lock
} from "lucide-react";

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg 
      className={className} 
      fill="currentColor" 
      viewBox="0 0 24 24"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.6 1.6 0 0 0-1.6 1.6 1.6 1.6 0 0 0 1.6 1.6 1.6 1.6 0 0 0 1.6-1.6 1.6 1.6 0 0 0-1.6-1.6Z"/>
    </svg>
  );
}

export default function PeerAttestationPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(0);

  const [activeRail, setActiveRail] = useState<"LINKEDIN" | "WORK_EMAIL">("LINKEDIN");
  const [selectedClaimIds, setSelectedClaimIds] = useState<string[]>([]);

  const [attesterName, setAttesterName] = useState("");
  const [attesterTitle, setAttesterTitle] = useState("");
  const [attesterLinkedinUrl, setAttesterLinkedinUrl] = useState("");
  const [attesterEmail, setAttesterEmail] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function loadContext() {
      try {
        const res = await fetch(`/api/attest/context?token=${token}`);
        const result = await res.json();
        if (result.success && result.data) {
          setData(result.data);
          if (result.data.target_name) setAttesterName(result.data.target_name);
          if (result.data.target_email) setAttesterEmail(result.data.target_email);
          
          if (result.data.requested_claims?.length > 0) {
            setSelectedClaimIds(result.data.requested_claims.map((c: any) => c.id));
          } else if (result.data.primary_claim) {
            setSelectedClaimIds([result.data.primary_claim.id]);
          }
        } else {
          setError(result.error || "Corroboration link is invalid or has expired.");
        }
      } catch {
        setError("Network error loading corroboration details.");
      } finally {
        setLoading(false);
      }
    }
    if (token) loadContext();
  }, [token]);

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaimIds((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
    );
  };

  const handleSubmit = async (verdict: "CONFIRM" | "DISPUTE") => {
    if (!attesterName.trim()) {
      setError("Please enter your name so recruiters can verify this milestone.");
      return;
    }

    if (activeRail === "LINKEDIN" && !attesterLinkedinUrl.trim()) {
      setError("Please provide your LinkedIn profile URL (e.g., https://linkedin.com/in/yourname).");
      return;
    }

    if (activeRail === "WORK_EMAIL" && !attesterEmail.trim()) {
      setError("Please provide your work email to corroborate corporate tenure.");
      return;
    }

    if (verdict === "CONFIRM" && selectedClaimIds.length === 0) {
      setError("Please select at least one achievement you can corroborate.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/attest/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          verdict,
          authRail: activeRail === "LINKEDIN" ? "LINKEDIN_OAUTH" : "CORPORATE_OTP",
          attesterName,
          attesterTitle,
          attesterLinkedinUrl: activeRail === "LINKEDIN" ? attesterLinkedinUrl : null,
          attesterEmail: activeRail === "WORK_EMAIL" ? attesterEmail : null,
          confirmedClaimIds: selectedClaimIds,
          notes,
        }),
      });

      const result = await res.json();
      if (result.success) {
        setVerifiedCount(result.claimsVerifiedCount || selectedClaimIds.length);
        setConfirmed(true);
      } else {
        setError(result.error || "Submission failed.");
      }
    } catch {
      setError("Could not record corroboration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6 text-slate-700 font-sans">
        <div className="flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-sm font-semibold">Loading corroboration packet...</span>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] flex items-center justify-center p-6 text-slate-900 font-sans">
        <Card className="max-w-md w-full border-slate-200 shadow-sm rounded-2xl p-8 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold">Corroboration Link Unavailable</h2>
          <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FBFBFA] text-slate-900 font-sans antialiased py-12 px-6 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-xl mx-auto space-y-8">
        
        <header className="text-center space-y-2">
          <div className="inline-flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-slate-900 text-xl">PITH</span>
            <span className="text-slate-300">/</span>
            <Badge variant="outline" className="bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold px-2.5 py-0.5">
              Peer Proof Network
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Corroborate Colleague Achievements</h1>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            {data.candidate_name} invited you to corroborate their accomplishments from your time together at {data.company_name}.
          </p>
        </header>

        {confirmed ? (
          <Card className="bg-white border-emerald-200 shadow-sm rounded-2xl p-8 text-center space-y-5">
            <div className="w-12 h-12 bg-emerald-50 rounded-full border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">
                {verifiedCount} Achievement{verifiedCount > 1 ? "s" : ""} Corroborated!
              </h2>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Thank you for backing authentic work. Your verification is now linked to {data.candidate_name}’s public dossier for hiring teams.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Thank you reward: 1 Month of Pith Pro Free</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                As an authentic professional corroborator, we've reserved your handle on Pith. Build your verified Master Vault with zero recruiter spam.
              </p>
              <a 
                href="/"
                className="inline-block text-xs font-bold text-emerald-800 underline hover:text-emerald-950 mt-1"
              >
                Claim Your Free Vault →
              </a>
            </div>
          </Card>
        ) : (
          <Card className="bg-white border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/70 border-b border-slate-100 p-6">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {data.role_title}
                  </CardTitle>
                  <p className="text-xs font-bold text-emerald-700 mt-0.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {data.company_name} ({data.role_start} — {data.role_end})
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px] font-semibold bg-white border-slate-200">
                  {data.relationship === "MANAGER" ? "Manager Sign-Off (Tier 3)" : "Peer Corroboration (Tier 2)"}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              
              {data.requested_claims && data.requested_claims.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Requested Achievements
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      Requested by {data.candidate_name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.requested_claims.map((claim: any) => {
                      const isSelected = selectedClaimIds.includes(claim.id);
                      return (
                        <div
                          key={claim.id}
                          onClick={() => toggleClaimSelection(claim.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-50/40 border-emerald-500 shadow-2xs"
                              : "bg-slate-50 border-slate-200 opacity-60"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-300"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-800 leading-snug">
                                "{claim.raw_bullet}"
                              </p>
                              {claim.metric_summary && (
                                <span className="inline-block text-[10px] font-bold text-slate-700 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                                  Outcome: {claim.metric_summary}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.other_claims && data.other_claims.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Other Achievements at {data.company_name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Optional: check any you recall
                    </span>
                  </div>

                  <div className="space-y-2">
                    {data.other_claims.map((claim: any) => {
                      const isSelected = selectedClaimIds.includes(claim.id);
                      return (
                        <div
                          key={claim.id}
                          onClick={() => toggleClaimSelection(claim.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-emerald-50/40 border-emerald-500 shadow-2xs"
                              : "bg-white border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center border shrink-0 transition-colors ${
                              isSelected
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-300"
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-slate-700 leading-snug">
                                "{claim.raw_bullet}"
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {error}
                </div>
              )}

              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700">
                  Step 2: Choose Your Professional Identity Rail
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveRail("LINKEDIN")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activeRail === "LINKEDIN"
                        ? "bg-blue-50/70 border-blue-500 text-blue-700 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <LinkedInIcon className="w-4 h-4 text-blue-600" />
                    LinkedIn Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveRail("WORK_EMAIL")}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      activeRail === "WORK_EMAIL"
                        ? "bg-emerald-50/70 border-emerald-500 text-emerald-800 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Corporate Domain
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={attesterName}
                    onChange={(e) => setAttesterName(e.target.value)}
                    placeholder="e.g., Sarah Chen"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Your Title at {data.company_name}</label>
                  <input
                    type="text"
                    value={attesterTitle}
                    onChange={(e) => setAttesterTitle(e.target.value)}
                    placeholder="e.g., VP of Engineering, Senior Staff PM"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>

                {activeRail === "LINKEDIN" ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Your LinkedIn URL * (Proves Real Identity to Recruiters)
                    </label>
                    <input
                      type="url"
                      value={attesterLinkedinUrl}
                      onChange={(e) => setAttesterLinkedinUrl(e.target.value)}
                      placeholder="https://linkedin.com/in/yourname"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Corporate Work Email * (Confirms Organizational Domain)
                    </label>
                    <input
                      type="email"
                      value={attesterEmail}
                      onChange={(e) => setAttesterEmail(e.target.value)}
                      placeholder={`yourname@${data.company_name.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Brief Corroboration Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g., Confirmed. Graham directly owned this architecture and outcome."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => handleSubmit("CONFIRM")}
                  disabled={submitting || selectedClaimIds.length === 0}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-xs flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Corroborate {selectedClaimIds.length} Selected Achievement{selectedClaimIds.length > 1 ? "s" : ""}
                    </>
                  )}
                </Button>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero marketing spam. Identity used strictly for candidate verification.</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}