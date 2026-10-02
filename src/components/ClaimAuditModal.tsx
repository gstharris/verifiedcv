"use client";

import { useState } from "react";
import { 
  X, 
  ShieldCheck, 
  Users, 
  Copy,
  ExternalLink,
  Loader2,
  Building2,
  Award
} from "lucide-react";

interface Claim {
  id: string;
  raw_bullet: string;
  metric_summary?: string;
  category?: string;
}

interface ExperienceContext {
  id: string;
  company_name: string;
  title: string;
  start_date?: string;
  end_date?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  claims: Claim[];
}

interface ClaimAuditModalProps {
  experience: ExperienceContext;
  isOpen: boolean;
  onClose: () => void;
  onChapterCorroborated?: (experienceId: string) => void;
}

export default function ClaimAuditModal({
  experience,
  isOpen,
  onClose,
}: ClaimAuditModalProps) {
  const [corroboratorEmail, setCorroboratorEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const tenureStr = experience.is_current
    ? `${experience.start_month || "Jan"} ${experience.start_year || "2020"} — Present`
    : `${experience.start_month || "Jan"} ${experience.start_year || "2020"} — ${experience.end_month || "Dec"} ${experience.end_year || "2024"}`;

  const handleGenerateChapterAttestation = async () => {
    if (!corroboratorEmail.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/verify/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateHandle: "gharris",
          candidateName: "Graham Harris",
          experienceId: experience.id,
          companyName: experience.company_name,
          roleTitle: experience.title,
          tenureDates: tenureStr,
          claims: experience.claims || [],
          attestorEmail: corroboratorEmail.trim(),
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        const fullUrl = `${window.location.origin}${json.attestUrl}`;
        setGeneratedLink(fullUrl);
      }
    } catch (err) {
      console.error("Failed to generate chapter attestation link", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-950">Invite Chapter Corroborator</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          
          {/* Target Chapter Context */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                {experience.company_name}
              </span>
              <span className="font-mono text-[10px] text-slate-500 font-semibold">{tenureStr}</span>
            </div>
            <p className="text-slate-700 font-medium">Role: {experience.title}</p>
            <span className="text-[10px] text-slate-400 block pt-0.5">
              Includes {experience.claims?.length || 0} milestone bullets for optional sign-off.
            </span>
          </div>

          {/* Invitation Engine */}
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">Colleague or Manager Email</label>
              <p className="text-slate-500 mb-2 leading-relaxed text-[11px]">
                We generate an encrypted single-use link. Your reference can certify your chapter in 15 seconds with role-masked privacy by default.
              </p>
              
              {!generatedLink ? (
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={corroboratorEmail}
                    onChange={(e) => setCorroboratorEmail(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-slate-400 text-xs"
                  />
                  <button
                    onClick={handleGenerateChapterAttestation}
                    disabled={loading || !corroboratorEmail.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Generate Link</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 bg-transparent text-[11px] font-mono outline-none text-slate-700 truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 font-bold text-[11px] text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer hover:bg-emerald-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Test Open</span>
                    </a>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Single-use link ready. Open to preview the attestor's role-masked signing experience.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed flex items-start gap-2">
            <Award className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <span>
              <strong>Progressive Proof:</strong> Once confirmed, this entire career chapter is elevated to <em>Verified Chapter</em>. If your reference checks specific initiatives, those will earn individual <em>Directly Vouched</em> badges.
            </span>
          </div>

        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}