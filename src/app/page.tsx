"use client";

import { useState, useRef, useEffect } from "react";
import { 
  UploadCloud, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink, 
  CornerDownLeft, 
  Loader2, 
  Check, 
  TrendingUp, 
  Cpu, 
  Users, 
  Target, 
  Building2,
  AlertCircle,
  Minimize2,
  Maximize2
} from "lucide-react";
import VerifiedCVLogo from "@/components/VerifiedCVLogo";
import ClaimAuditModal from "@/components/ClaimAuditModal";
import ProactiveVerifyModal from "@/components/ProactiveVerifyModal";

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary: string;
  category: "METRIC" | "ARCHITECTURE" | "LEADERSHIP" | "EXECUTION";
  pith_fidelity_score: number;
  status: string;
}

interface Experience {
  id: string;
  company_name: string;
  title: string;
  start_date: string;
  end_date: string;
  affiliation_verified?: boolean;
  claims: Claim[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: { type: "FILE_UPLOAD" | "NONE"; label: string } | null;
}

function getCategoryBadge(cat: string) {
  switch (cat) {
    case "METRIC":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-300">
          <TrendingUp className="w-3 h-3 text-emerald-700" />
          <span>Metric</span>
        </span>
      );
    case "ARCHITECTURE":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-800 border border-indigo-200">
          <Cpu className="w-3 h-3 text-indigo-600" />
          <span>Systems</span>
        </span>
      );
    case "LEADERSHIP":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-300">
          <Users className="w-3 h-3 text-amber-700" />
          <span>Leadership</span>
        </span>
      );
    case "EXECUTION":
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
          <Target className="w-3 h-3 text-slate-500" />
          <span>Execution</span>
        </span>
      );
  }
}

export default function VerifiedCVStudio() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [chatCompact, setChatCompact] = useState(true);

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [summary, setSummary] = useState("");
  const [skills, setSkills] = useState<{ name: string; category: string }[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const [activeClaim, setActiveClaim] = useState<Claim | null>(null);
  const [activeCompany, setActiveCompany] = useState("");
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [activeExpForVerification, setActiveExpForVerification] = useState<Experience | null>(null);
  const [isSelfVerifyOpen, setIsSelfVerifyOpen] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, chatLoading]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const selectedFile = e.target.files[0];

    setApiError(null);
    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: `Uploaded ${selectedFile.name}` },
      { role: "assistant", content: `Ingesting ${selectedFile.name} and extracting verifiable career claims...` },
    ]);

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/parse", { method: "POST", body: formData });
      const result = await res.json();

      if (!res.ok || !result.success) {
        const errorMsg = result.error || `Server responded with status ${res.status}`;
        setApiError(errorMsg);
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ Ingestion notice: ${errorMsg}`, action: { type: "FILE_UPLOAD", label: "Retry PDF Ingestion" } },
        ]);
        return;
      }

      if (result.data?.experiences?.length > 0) {
        const parsedName = result.data.full_name || "Graham Harris";
        const parsedHead = result.data.headline || "Head of Product Management";
        const parsedSumm = result.data.summary || "";
        const parsedSkills = result.data.skills || [];

        setFullName(parsedName);
        setHeadline(parsedHead);
        setSummary(parsedSumm);
        setSkills(parsedSkills);

        const mappedExps: Experience[] = result.data.experiences.map((exp: any) => ({
          ...exp,
          id: exp.id || crypto.randomUUID(),
          affiliation_verified: false,
          claims: (exp.claims || []).map((c: any) => ({
            ...c,
            id: c.id || crypto.randomUUID(),
            pith_fidelity_score: c.pith_fidelity_score || 85,
            status: c.status || "DRAFT",
          })),
        }));

        setExperiences(mappedExps);
        const totalClaims = mappedExps.reduce((acc, exp) => acc + (exp.claims?.length || 0), 0);

        await autoSaveToVault(mappedExps, parsedName, parsedHead, parsedSumm, parsedSkills);

        setChatHistory((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Extracted ${mappedExps.length} career chapters and ${totalClaims} atomic claims. Data saved to your Vault. Review your accomplishments on the live canvas on the right.`,
          },
        ]);
      }
    } catch (err: any) {
      setApiError(err?.message || "Ingestion network failure.");
    } finally {
      setLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const autoSaveToVault = async (
    expsToSave = experiences, 
    fName = fullName, 
    hLine = headline, 
    sMary = summary,
    sKills = skills
  ) => {
    if (expsToSave.length === 0) return;
    setSaving(true);
    try {
      await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateName: fName || "Graham Harris",
          candidateHandle: "gharris",
          headline: hLine,
          summary: sMary,
          skills: sKills,
          experiences: expsToSave,
        }),
      });
      setIsSaved(true);
    } catch (e) {
      console.error("Vault save sync warning:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = (textOverride || chatInput).trim();
    if (!text || chatLoading) return;

    const userMsg: ChatMessage = { role: "user", content: text };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/ally/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedHistory,
          experiences,
          summary,
          skills,
          isSaved,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.reply, action: data.action || null },
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.error || "CV Ally encountered an issue." },
        ]);
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: "Connection interrupted. Please retry." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUpdateClaimText = (expId: string, claimId: string, newText: string) => {
    setExperiences((prev) =>
      prev.map((exp) => {
        if (exp.id !== expId) return exp;
        return {
          ...exp,
          claims: exp.claims.map((c) => (c.id === claimId ? { ...c, raw_bullet: newText } : c)),
        };
      })
    );
  };

  const totalClaims = experiences.reduce((acc, exp) => acc + (exp.claims?.length || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased flex flex-col justify-between selection:bg-emerald-100">
      
      <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />

      {/* Top Header Navigation */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 shrink-0">
        <div className="flex items-center gap-2.5">
          <VerifiedCVLogo />
          <div className="flex items-baseline gap-2">
            <span className="font-black text-xl tracking-tight text-slate-950">VerifiedCV</span>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md hidden sm:inline-block">
              Candidate Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3" suppressHydrationWarning={true}>
          {experiences.length > 0 && (
            <button
              onClick={() => autoSaveToVault()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
              <span>{saving ? "Saving..." : isSaved ? "Saved to Vault" : "Save to Vault"}</span>
            </button>
          )}

          <a
            href={`/gharris?t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            suppressHydrationWarning={true}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          >
            <span>Live Public Profile</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </header>

      {/* Main Workspace */}
      {experiences.length === 0 ? (
        /* Empty State: Focused Intake View */
        <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 flex flex-col justify-center text-center space-y-8 animate-in fade-in duration-300">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-xs">
              <VerifiedCVLogo className="w-9 h-9" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
              Prove your track record upfront.
            </h1>
            <p className="text-base text-slate-600 leading-relaxed font-normal max-w-lg mx-auto">
              Bypass automated screening filters. Upload your resume to extract, calibrate, and verify your real-world accomplishments.
            </p>
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-8 sm:p-10 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-600 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer shadow-xs group space-y-3"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-emerald-100 text-slate-700 group-hover:text-emerald-800 flex items-center justify-center mx-auto transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-sm text-slate-900 block">
                Click to upload your resume PDF
              </span>
              <span className="text-xs text-slate-500 block">
                Deterministic extraction across dense multi-page executive formats
              </span>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2.5 text-sm font-semibold text-emerald-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing all pages and deconstructing accomplishments...</span>
            </div>
          )}

          {apiError && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 max-w-md mx-auto text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{apiError}</span>
            </div>
          )}
        </main>
      ) : (
        /* Active Workspace: Slim Co-Pilot + Massive Right Canvas */
        <div className="flex-1 flex overflow-hidden h-[calc(100vh-4rem)]">
          
          {/* SLIM LEFT CO-PILOT (CV Ally) */}
          <aside className={`border-r border-slate-200 flex flex-col h-full bg-white transition-all duration-200 shrink-0 ${
            chatCompact ? "w-80" : "w-96"
          }`}>
            <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="font-bold text-xs text-slate-900">CV Ally</span>
              </div>
              <button
                onClick={() => setChatCompact(!chatCompact)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                title={chatCompact ? "Expand chat" : "Collapse chat"}
              >
                {chatCompact ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex-1 p-3.5 space-y-3 overflow-y-auto text-xs leading-relaxed bg-[#FAFAFA]">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      CA
                    </div>
                  )}
                  <div
                    className={`p-3 rounded-xl max-w-[85%] space-y-2 leading-relaxed ${
                      msg.role === "user"
                        ? "bg-slate-900 text-white font-medium"
                        : "bg-white border border-slate-200 text-slate-800 shadow-2xs"
                    }`}
                  >
                    <p className="whitespace-pre-line">{msg.content}</p>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 pt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            <div className="p-2.5 border-t border-slate-200 bg-white flex items-center gap-1.5 shrink-0">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Ally or calibrate..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-600 focus:bg-white"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-7 px-2.5 rounded-lg text-xs shadow-xs shrink-0 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              >
                <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </aside>

          {/* MASSIVE RIGHT PANE: Live Editable Dossier Canvas */}
          <main className="flex-1 bg-[#F8FAFC] text-slate-900 h-full overflow-y-auto p-6 sm:p-10 space-y-6">
            
            {/* Candidate Identity Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={() => autoSaveToVault()}
                    placeholder="Candidate Name"
                    className="cv-field text-2xl font-black text-slate-950 tracking-tight px-2 py-1 -ml-2 w-full"
                  />
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    onBlur={() => autoSaveToVault()}
                    placeholder="Headline / Target Title"
                    className="cv-field text-sm font-bold text-slate-700 px-2 py-0.5 -ml-2 w-full"
                  />
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300 self-start">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Verified Candidate
                </span>
              </div>

              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                onBlur={() => autoSaveToVault()}
                placeholder="Executive Profile Summary"
                rows={3}
                className="cv-field w-full text-sm text-slate-800 leading-relaxed p-2 -ml-2 resize-none font-normal"
              />

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                  {skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Career Chapters Canvas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-950 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-700" />
                  Career Chapters & Accomplishments ({experiences.length})
                </h2>
                <span className="text-xs font-medium text-slate-500">
                  Inline editable • Changes auto-sync to Vault
                </span>
              </div>

              {experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden"
                >
                  <div className="p-4 bg-slate-50/90 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setExperiences((prev) => prev.map((item) => item.id === exp.id ? { ...item, title: val } : item));
                        }}
                        onBlur={() => autoSaveToVault()}
                        className="cv-field font-extrabold text-base text-slate-950 px-1.5 py-0.5 -ml-1.5 w-full"
                      />
                      <div className="text-xs font-bold text-emerald-800 px-1.5 mt-0.5">
                        {exp.company_name}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-600 font-mono">
                        {exp.start_date} — {exp.end_date || "Present"}
                      </span>
                      <button
                        onClick={() => {
                          setActiveExpForVerification(exp);
                          setIsSelfVerifyOpen(true);
                        }}
                        className="h-7 px-2.5 text-xs font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Verify</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {exp.claims?.map((claim) => (
                      <div
                        key={claim.id}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getCategoryBadge(claim.category)}
                            {claim.metric_summary && (
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                                {claim.metric_summary}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => {
                              setActiveClaim(claim);
                              setActiveCompany(exp.company_name);
                              setIsAuditOpen(true);
                            }}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer opacity-80 group-hover:opacity-100"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-600" />
                            <span>Calibrate</span>
                          </button>
                        </div>

                        <textarea
                          value={claim.raw_bullet}
                          onChange={(e) => handleUpdateClaimText(exp.id, claim.id, e.target.value)}
                          onBlur={() => autoSaveToVault()}
                          rows={2}
                          className="cv-field w-full text-sm text-slate-900 font-normal leading-relaxed p-1.5 -ml-1.5 resize-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      )}

      {/* Claim Audit Modal */}
      {activeClaim && (
        <ClaimAuditModal
          claim={activeClaim}
          companyName={activeCompany}
          isOpen={isAuditOpen}
          onClose={() => setIsAuditOpen(false)}
          onScoreUpdated={(id, score, status) => {
            const updated = experiences.map((e) => ({
              ...e,
              claims: e.claims.map((c) => (c.id === id ? { ...c, pith_fidelity_score: score, status } : c)),
            }));
            setExperiences(updated);
            autoSaveToVault(updated);
          }}
        />
      )}

      {/* Role Verification Modal */}
      {activeExpForVerification && (
        <ProactiveVerifyModal
          experienceId={activeExpForVerification.id}
          companyName={activeExpForVerification.company_name}
          roleTitle={activeExpForVerification.title}
          isOpen={isSelfVerifyOpen}
          onClose={() => setIsSelfVerifyOpen(false)}
          onVerified={() => {
            const updated = experiences.map((e) => 
              e.id === activeExpForVerification.id ? { ...e, affiliation_verified: true } : e
            );
            setExperiences(updated);
            autoSaveToVault(updated);
          }}
        />
      )}

    </div>
  );
}